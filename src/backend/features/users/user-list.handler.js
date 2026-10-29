import { getSession } from "@backend/auth/session";
import { prisma } from "@backend/db/prisma";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (session.user_role !== "admin") {
        return Response.json({ error: "Accès réservé à l'administrateur." }, { status: 403 });
    }
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, user_role: true },
            orderBy: { name: "asc" },
        });
        return Response.json(users);
    }
    catch (error) {
        console.error("Unable to load users:", error);
        return Response.json({ error: "Impossible de charger les utilisateurs." }, { status: 500 });
    }
}