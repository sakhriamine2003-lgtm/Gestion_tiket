import { getSession } from "@backend/auth/session";
import { isTicketStatus } from "@shared/ticket-status";
import { TicketStatusError, transitionTicketStatus } from "@backend/features/tickets/ticket.service";

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
        const result = await transitionTicketStatus({ ticketId, newStatus, actor: user });
        return Response.json(result);
    }
    catch (error) {
        if (error instanceof TicketStatusError) {
            const status = error.code === "NOT_FOUND" ? 404 : error.code === "CONFLICT" ? 409 : 403;
            return Response.json({ error: error.message }, { status });
        }
        console.error("Erreur lors du changement de statut:", error);
        return Response.json({ error: "Impossible de modifier le statut." }, { status: 500 });
    }
}
