import { getSession } from "@/lib/auth";
import { sendEmails } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS, canTransition, isTicketStatus } from "@/lib/ticket-status";

async function adminRecipients() {
    // L'adresse administrateur configurée prime ; sinon, les comptes administrateurs en base.
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

export async function PATCH(request, context) {
    const user = await getSession();
    if (!user)
        return Response.json({ error: "Authentification requise." }, { status: 401 });
    if (user.user_role !== "admin" && user.user_role !== "utilisateur") {
        return Response.json({ error: "Accès refusé." }, { status: 403 });
    }
    const ticketId = Number((await context.params).id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
        return Response.json({ error: "Ticket introuvable." }, { status: 404 });
    }
    let body;
    try {
        body = await request.json();
    }
    catch {
        return Response.json({ error: "Requête invalide." }, { status: 400 });
    }
    if (!isTicketStatus(body?.status)) {
        return Response.json({ error: "Statut invalide." }, { status: 400 });
    }
    const newStatus = body.status;
    try {
        // Un utilisateur ne voit (et ne ferme) que ses propres tickets.
        const ticket = await prisma.ticket.findFirst({
            where: user.user_role === "admin" ? { id: ticketId } : { id: ticketId, userId: user.id },
            select: { id: true, status: true, user: { select: { name: true, email: true } } },
        });
        if (!ticket)
            return Response.json({ error: "Ticket introuvable." }, { status: 404 });
        if (!ticket.user) {
            return Response.json({ error: "Le statut n'est pas géré pour les tickets créés par l'administration." }, { status: 403 });
        }
        if (ticket.status === newStatus) {
            return Response.json({ id: ticket.id, status: ticket.status, unchanged: true, emailSent: null });
        }
        if (!canTransition(user.user_role, ticket.status, newStatus)) {
            return Response.json({ error: "Cette modification de statut n'est pas autorisée." }, { status: 403 });
        }
        // La condition sur l'ancien statut rend la transition atomique : une requête concurrente ne peut ni dupliquer ni envoyer deux e-mails.
        const result = await prisma.ticket.updateMany({
            where: { id: ticket.id, status: ticket.status },
            data: { status: newStatus },
        });
        if (result.count === 0) {
            return Response.json({ error: "Le statut du ticket a déjà été modifié. Actualisez la page." }, { status: 409 });
        }
        // Un échec SMTP ne doit jamais annuler ni corrompre le changement de statut.
        // emailSent : null = aucun destinataire, true = tout envoyé, false = échec d'au moins un envoi.
        let emailSent = null;
        try {
            const notifications = await buildNotifications(ticket, newStatus, user);
            if (notifications.length > 0) {
                emailSent = (await sendEmails(notifications)).every(Boolean);
            }
        }
        catch (emailError) {
            emailSent = false;
            console.error("Erreur lors de l'envoi de la notification de ticket:", emailError);
        }
        return Response.json({ id: ticket.id, status: newStatus, emailSent });
    }
    catch (error) {
        console.error("Erreur lors du changement de statut:", error);
        return Response.json({ error: "Impossible de modifier le statut." }, { status: 500 });
    }
}
