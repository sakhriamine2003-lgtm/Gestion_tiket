import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_TICKET_TOTAL_SIZE, TicketAttachmentValidationError, validateTicketAttachments } from "@/lib/ticket-attachments";

const MAX_MESSAGE_LENGTH = 2000;
const ONLINE_WINDOW_MS = 15000;
const MAX_MESSAGE_REQUEST_SIZE = MAX_TICKET_TOTAL_SIZE + 1024 * 1024;

class ConversationClosedError extends Error {
}

async function authorize(context) {
    const user = await getSession();
    if (!user)
        return { error: Response.json({ error: "Authentification requise." }, { status: 401 }) };
    if (user.user_role !== "admin" && user.user_role !== "utilisateur") {
        return { error: Response.json({ error: "Accès refusé." }, { status: 403 }) };
    }
    const ticketId = Number((await context.params).id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
        return { error: Response.json({ error: "Ticket introuvable." }, { status: 404 }) };
    }
    const ticket = await prisma.ticket.findFirst({
        where: user.user_role === "admin" ? { id: ticketId } : { id: ticketId, userId: user.id },
        select: {
            id: true,
            title: true,
            description: true,
            status: true,
            createdAt: true,
            adminReadAt: true,
            userReadAt: true,
            user: { select: { id: true, name: true, lastSeenAt: true } },
            attachments: {
                where: { messageId: null },
                select: { id: true, fileName: true, contentType: true, size: true },
                orderBy: { id: "asc" },
            },
        },
    });
    if (!ticket)
        return { error: Response.json({ error: "Ticket introuvable." }, { status: 404 }) };
    return { user, ticket };
}

export async function GET(_request, context) {
    const auth = await authorize(context);
    if (auth.error)
        return auth.error;
    const { ticket, user } = auth;
    try {
        const now = new Date();
        const isAdminViewer = user.user_role === "admin";
        const [, , lastAdminSeen] = await Promise.all([
            prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: now } }),
            prisma.ticket.updateMany({
                where: { id: ticket.id },
                data: isAdminViewer ? { adminReadAt: now } : { userReadAt: now },
            }),
            isAdminViewer
                ? null
                : prisma.user.aggregate({ where: { user_role: "admin" }, _max: { lastSeenAt: true } }),
        ]);
        const peerSeen = isAdminViewer ? ticket.user?.lastSeenAt : lastAdminSeen?._max.lastSeenAt;
        const peerOnline = Boolean(peerSeen) && now.getTime() - new Date(peerSeen).getTime() < ONLINE_WINDOW_MS;
        const peerReadAt = isAdminViewer ? ticket.userReadAt : ticket.adminReadAt;
        const stored = await prisma.ticketMessage.findMany({
            where: { ticketId: ticket.id, createdAt: { lte: new Date() } },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: {
                id: true,
                senderRole: true,
                senderId: true,
                content: true,
                createdAt: true,
                sender: { select: { name: true } },
                attachments: {
                    select: { id: true, fileName: true, contentType: true, size: true },
                    orderBy: { id: "asc" },
                },
            },
        });
        // Le contenu initial du ticket est le premier message de la conversation.
        const initial = {
            id: 0,
            senderRole: ticket.user ? "utilisateur" : "admin",
            senderName: ticket.user?.name ?? null,
            content: ticket.description,
            createdAt: ticket.createdAt,
            attachments: ticket.attachments,
        };
        const messages = [
            initial,
            ...stored.map((message) => ({
                id: message.id,
                senderRole: message.senderRole,
                senderName: message.sender?.name ?? null,
                isAutomatic: message.senderId === null,
                content: message.content,
                createdAt: message.createdAt,
                attachments: message.attachments,
            })),
        ];
        return Response.json({ ticketId: ticket.id, title: ticket.title, status: ticket.status, messages, peerOnline, peerReadAt, hasPeer: isAdminViewer ? Boolean(ticket.user) : true });
    }
    catch (error) {
        console.error("Erreur lors du chargement de la conversation:", error);
        return Response.json({ error: "Impossible de charger la conversation." }, { status: 500 });
    }
}

export async function POST(request, context) {
    const auth = await authorize(context);
    if (auth.error)
        return auth.error;
    const { user, ticket } = auth;
    if (ticket.status === "CLOSED") {
        return Response.json({ error: "Cette conversation est fermée." }, { status: 409 });
    }
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_MESSAGE_REQUEST_SIZE) {
        return Response.json({ error: "La requête est trop volumineuse." }, { status: 413 });
    }
    const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
    let content = "";
    let files = [];
    try {
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            const text = formData.get("content");
            content = typeof text === "string" ? text.trim() : "";
            const fileEntries = formData.getAll("attachments");
            if (fileEntries.some((entry) => !(entry instanceof File))) {
                return Response.json({ error: "Fichier joint invalide." }, { status: 400 });
            }
            files = await validateTicketAttachments(fileEntries.filter((entry) => entry instanceof File));
        }
        else if (contentType.includes("application/json")) {
            const body = await request.json();
            content = typeof body?.content === "string" ? body.content.trim() : "";
        }
        else {
            return Response.json({ error: "Le formulaire du message est invalide." }, { status: 415 });
        }
    }
    catch (error) {
        if (error instanceof TicketAttachmentValidationError) {
            return Response.json({ error: error.message }, { status: 400 });
        }
        if (error instanceof SyntaxError || error instanceof TypeError) {
            return Response.json({ error: "Message ou formulaire invalide." }, { status: 400 });
        }
        console.error("Erreur lors de la lecture du message:", error);
        return Response.json({ error: "Impossible de lire le message." }, { status: 500 });
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
        return Response.json({ error: `Le message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères.` }, { status: 400 });
    }
    if (!content && files.length === 0) {
        return Response.json({ error: "Écrivez un message ou ajoutez au moins un fichier." }, { status: 400 });
    }
    try {
        const message = await prisma.$transaction(async (transaction) => {
            const current = await transaction.ticket.findUnique({ where: { id: ticket.id }, select: { status: true } });
            if (current?.status === "CLOSED")
                throw new ConversationClosedError();
            const created = await transaction.ticketMessage.create({
                data: { ticketId: ticket.id, senderId: user.id, senderRole: user.user_role, content },
                select: { id: true, senderRole: true, content: true, createdAt: true },
            });
            if (files.length) {
                await transaction.ticketAttachment.createMany({
                    data: files.map((attachment) => ({ ...attachment, ticketId: ticket.id, messageId: created.id })),
                });
            }
            await transaction.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } });
            return transaction.ticketMessage.findUniqueOrThrow({
                where: { id: created.id },
                select: {
                    id: true,
                    senderRole: true,
                    content: true,
                    createdAt: true,
                    attachments: { select: { id: true, fileName: true, contentType: true, size: true } },
                },
            });
        });
        return Response.json({ ...message, senderName: user.name }, { status: 201 });
    }
    catch (error) {
        if (error instanceof ConversationClosedError) {
            return Response.json({ error: "Cette conversation est fermée." }, { status: 409 });
        }
        console.error("Erreur lors de l'envoi du message:", error);
        return Response.json({ error: "Impossible d'envoyer le message." }, { status: 500 });
    }
}
