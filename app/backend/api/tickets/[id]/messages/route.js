import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_MESSAGE_LENGTH = 2000;

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
            },
        });
        // Le contenu initial du ticket est le premier message de la conversation.
        const initial = {
            id: 0,
            senderRole: "utilisateur",
            senderName: ticket.user?.name ?? null,
            content: ticket.description,
            createdAt: ticket.createdAt,
        };
        const messages = [
            initial,
            ...stored.map((message) => ({
                id: message.id,
                senderRole: message.senderRole,
                senderName: message.sender?.name ?? null,
                content: message.content,
                createdAt: message.createdAt,
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
    let body;
    try {
        body = await request.json();
    }
    catch {
        return Response.json({ error: "Message invalide." }, { status: 400 });
    }
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content || content.length > MAX_MESSAGE_LENGTH) {
        return Response.json({ error: `Le message est obligatoire (${MAX_MESSAGE_LENGTH} caractères max.).` }, { status: 400 });
    }
    if (ticket.status === "CLOSED" && user.user_role !== "admin") {
        return Response.json({ error: "Ce ticket est fermé." }, { status: 409 });
    }
    try {
        const message = await prisma.ticketMessage.create({
            data: { ticketId: ticket.id, senderId: user.id, senderRole: user.user_role, content },
            select: { id: true, senderRole: true, content: true, createdAt: true },
        });
        await prisma.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } });
        return Response.json({ ...message, senderName: user.name }, { status: 201 });
    }
    catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        return Response.json({ error: "Impossible d'envoyer le message." }, { status: 500 });
    }
}
