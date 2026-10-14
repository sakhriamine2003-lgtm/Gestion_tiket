import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, context) {
    const user = await getSession();
    if (!user)
        return Response.json({ error: "Authentification requise." }, { status: 401 });
    if (user.user_role !== "admin") {
        return Response.json({ error: "Seul un administrateur peut fermer ou rouvrir un ticket." }, { status: 403 });
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
    if (body?.status !== "OPEN" && body?.status !== "CLOSED") {
        return Response.json({ error: "Statut invalide." }, { status: 400 });
    }
    try {
        const result = await prisma.ticket.updateMany({ where: { id: ticketId }, data: { status: body.status } });
        if (result.count === 0)
            return Response.json({ error: "Ticket introuvable." }, { status: 404 });
        return Response.json({ id: ticketId, status: body.status });
    }
    catch (error) {
        console.error("Erreur lors du changement de statut:", error);
        return Response.json({ error: "Impossible de modifier le statut." }, { status: 500 });
    }
}
