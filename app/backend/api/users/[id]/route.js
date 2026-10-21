import { hash } from "bcryptjs";
import { getSession, isUserRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
    const session = await getSession();
    if (!session) {
        return { error: Response.json({ error: "Authentification requise." }, { status: 401 }) };
    }
    if (session.user_role !== "admin") {
        return { error: Response.json({ error: "Accès réservé à l'administrateur." }, { status: 403 }) };
    }
    return { session };
}

async function getUserId(context) {
    const { id } = await context.params;
    const userId = Number(id);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
}

export async function GET(_request, context) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const id = await getUserId(context);
    if (!id) return Response.json({ error: "Utilisateur invalide." }, { status: 400 });

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                user_role: true,
                equipmentCount: true,
                createdAt: true,
                lastSeenAt: true,
                equipmentRequests: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        status: true,
                        reason: true,
                        createdAt: true,
                        product: { select: { marque: true, bureau: true } },
                    },
                },
                tickets: {
                    orderBy: { updatedAt: "desc" },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        attachments: {
                            where: { messageId: null },
                            select: { id: true, fileName: true, size: true },
                        },
                        messages: {
                            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
                            select: {
                                senderRole: true,
                                content: true,
                                createdAt: true,
                                attachments: { select: { id: true, fileName: true, size: true } },
                            },
                        },
                    },
                },
                faultReports: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        description: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        product: { select: { marque: true, bureau: true } },
                    },
                },
            },
        });

        if (!user) return Response.json({ error: "Utilisateur introuvable." }, { status: 404 });
        return Response.json(user);
    } catch (error) {
        console.error("Unable to load user report:", error);
        return Response.json({ error: "Impossible de charger le rapport utilisateur." }, { status: 500 });
    }
}

export async function PATCH(request, context) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const id = await getUserId(context);
    if (!id) return Response.json({ error: "Utilisateur invalide." }, { status: 400 });

    try {
        const body = await request.json();
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const user_role = body.user_role;

        if (!name || !email || !isUserRole(user_role) || (password && password.length < 6)) {
            return Response.json({ error: "Nom, e-mail et rôle valides requis. Le mot de passe doit contenir au moins 6 caractères." }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                user_role,
                ...(password ? { password: await hash(password, 12) } : {}),
            },
            select: { id: true, name: true, email: true, user_role: true },
        });
        return Response.json(user);
    } catch (error) {
        if (error && typeof error === "object" && "code" in error) {
            if (error.code === "P2002") {
                return Response.json({ error: "Cette adresse e-mail est déjà utilisée." }, { status: 409 });
            }
            if (error.code === "P2025") {
                return Response.json({ error: "Utilisateur introuvable." }, { status: 404 });
            }
        }
        console.error("Unable to update user:", error);
        return Response.json({ error: "Impossible de modifier l'utilisateur." }, { status: 500 });
    }
}

export async function DELETE(_request, context) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const id = await getUserId(context);
    if (!id) return Response.json({ error: "Utilisateur invalide." }, { status: 400 });
    if (auth.session.id === id) {
        return Response.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });
    }

    try {
        await prisma.$transaction([
            prisma.equipmentRequest.deleteMany({ where: { userId: id } }),
            prisma.user.delete({ where: { id } }),
        ]);
        return Response.json({ success: true });
    } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
            return Response.json({ error: "Utilisateur introuvable." }, { status: 404 });
        }
        console.error("Unable to delete user:", error);
        return Response.json({ error: "Impossible de supprimer l'utilisateur." }, { status: 500 });
    }
}
