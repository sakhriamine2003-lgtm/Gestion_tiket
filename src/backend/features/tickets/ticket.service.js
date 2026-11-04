import { sendEmails } from "@backend/notifications/email";
import { prisma } from "@backend/db/prisma";
import { TICKET_STATUS, canTransition } from "@shared/ticket-status";

export class TicketStatusError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

async function adminRecipients() {
    const configured = (process.env.ADMIN_EMAIL ?? "")
        .split(",")
        .map((address) => address.trim())
        .filter(Boolean);
    if (configured.length > 0)
        return configured;
    const admins = await prisma.user.findMany({ where: { user_role: "admin" }, select: { email: true } });
    return admins.map((admin) => admin.email);
}

async function buildNotifications(ticket, newStatus, actor) {
    if (newStatus === TICKET_STATUS.IN_PROGRESS && ticket.user) {
        return [{
            to: ticket.user.email,
            subject: "Votre ticket est en cours de traitement",
            text: `Bonjour ${ticket.user.name},\n\nvotre ticket n°${ticket.id} est actuellement pris en charge par notre équipe.`,
        }];
    }
    if (newStatus === TICKET_STATUS.RESOLVED && ticket.user) {
        return [{
            to: ticket.user.email,
            subject: "Votre ticket a été traité",
            text: `Bonjour ${ticket.user.name},\n\nvotre ticket n°${ticket.id} a été traité par notre équipe. Vous pouvez maintenant clôturer la conversation si le problème est résolu.`,
        }];
    }
    if (newStatus === TICKET_STATUS.CLOSED) {
        const recipients = await adminRecipients();
        return recipients.map((to) => ({
            to,
            subject: "Ticket clôturé par l'utilisateur",
            text: `L'utilisateur ${actor.name} a clôturé le ticket n°${ticket.id}.`,
        }));
    }
    return [];
}

export async function transitionTicketStatus({ ticketId, newStatus, actor }) {
    const ticket = await prisma.ticket.findFirst({
        where: actor.user_role === "admin" ? { id: ticketId } : { id: ticketId, userId: actor.id },
        select: { id: true, status: true, user: { select: { name: true, email: true } } },
    });
    if (!ticket)
        throw new TicketStatusError("NOT_FOUND", "Ticket introuvable.");
    if (!ticket.user) {
        throw new TicketStatusError("FORBIDDEN", "Le statut n'est pas géré pour les tickets créés par l'administration.");
    }
    if (ticket.status === newStatus) {
        return { id: ticket.id, status: ticket.status, unchanged: true, emailSent: null };
    }
    if (!canTransition(actor.user_role, ticket.status, newStatus)) {
        throw new TicketStatusError("FORBIDDEN", "Cette modification de statut n'est pas autorisée.");
    }
    const result = await prisma.ticket.updateMany({
        where: { id: ticket.id, status: ticket.status },
        data: { status: newStatus },
    });
    if (result.count === 0) {
        throw new TicketStatusError("CONFLICT", "Le statut du ticket a déjà été modifié. Actualisez la page.");
    }
    let emailSent = null;
    try {
        const notifications = await buildNotifications(ticket, newStatus, actor);
        if (notifications.length > 0) {
            emailSent = (await sendEmails(notifications)).every(Boolean);
        }
    }
    catch (error) {
        emailSent = false;
        console.error("Erreur lors de l'envoi de la notification de ticket:", error);
    }
    return { id: ticket.id, status: newStatus, emailSent };
}