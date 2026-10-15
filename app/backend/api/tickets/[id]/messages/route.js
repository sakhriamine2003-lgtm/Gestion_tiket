import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_TICKET_TOTAL_SIZE, TicketAttachmentValidationError, validateTicketAttachments } from "@/lib/ticket-attachments";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGE_REQUEST_SIZE = MAX_TICKET_TOTAL_SIZE + 1024 * 1024;

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
            user: { select: { id: true, name: true } },
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
    const { ticket } = auth;
    try {
        const stored = await prisma.ticketMessage.findMany({
            where: { ticketId: ticket.id },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: {
                id: true,
                senderRole: true,
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
            senderRole: "utilisateur",
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
                content: message.content,
                createdAt: message.createdAt,
                attachments: message.attachments,
            })),
        ];
        return Response.json({ ticketId: ticket.id, title: ticket.title, status: ticket.status, messages });
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
    if (ticket.status === "CLOSED" && user.user_role !== "admin") {
        return Response.json({ error: "Ce ticket est fermé." }, { status: 409 });
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
        console.error("Erreur lors de l'envoi du message:", error);
        return Response.json({ error: "Impossible d'envoyer le message." }, { status: 500 });
    }
}
