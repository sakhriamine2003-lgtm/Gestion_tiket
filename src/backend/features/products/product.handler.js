import { getSession } from "@backend/auth/session";
import { prisma } from "@backend/db/prisma";

export async function POST(request) {
    try {
        const user = await getSession();
        if (!user) {
            return Response.json({ error: "Authentification requise." }, { status: 401 });
        }
        if (user.user_role !== "admin") {
            return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
        }
        const body = await request.json();
        const marque = String(body.marque || "").trim();
        const bureau = String(body.bureau || "").trim();
        const prix = Number(body.prix);
        const stock = Number(body.stock);
        const product = await prisma.product.create({ data: { marque, bureau, prix, stock, initialStock: stock } });
        return Response.json(product, { status: 201 });
    }
    catch (error) {
        console.error("Erreur création produit :", error);
        return Response.json({ error: "Une erreur est survenue." }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const user = await getSession();
        if (!user) {
            return Response.json({ error: "Authentification requise." }, { status: 401 });
        }
        if (user.user_role !== "admin") {
            return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
        }
        const body = await request.json();
        const id = Number(body.productId);
        const marque = String(body.marque || "").trim();
        const bureau = String(body.bureau || "").trim();
        const prix = Number(body.prix);
        const stock = Number(body.stock);
        if (!Number.isInteger(id) || id <= 0) {
            return Response.json({ error: "ID du produit invalide." }, { status: 400 });
        }
        if (!marque || !bureau || !Number.isFinite(prix) || prix < 0 || !Number.isInteger(stock) || stock < 0) {
            return Response.json({ error: "Les données du produit sont invalides." }, { status: 400 });
        }
        const product = await prisma.product.update({ where: { id }, data: { marque, bureau, prix, stock } });
        return Response.json(product);
    }
    catch (error) {
        console.error("Erreur modification produit :", error);
        return Response.json({ error: "Erreur lors de la modification du produit." }, { status: 500 });
    }
}

export async function DELETE(request) {
    const user = await getSession();
    if (!user)
        return Response.json({ error: "Authentification requise." }, { status: 401 });
    if (user.user_role !== "admin")
        return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const id = Number(body.productId);
    if (!Number.isInteger(id) || id <= 0)
        return Response.json({ error: "ID du produit invalide." }, { status: 400 });
    try {
        const result = await prisma.$transaction(async (transaction) => {
            const acceptedRequests = await transaction.equipmentRequest.findMany({ where: { productId: id, status: "Acceptée" }, select: { userId: true } });
            for (const request of acceptedRequests) {
                await transaction.user.update({ where: { id: request.userId }, data: { equipmentCount: { decrement: 1 } } });
            }
            const deletedFaultReports = await transaction.faultReport.deleteMany({ where: { productId: id } });
            const deletedRequests = await transaction.equipmentRequest.deleteMany({ where: { productId: id } });
            const product = await transaction.product.delete({ where: { id } });
            return { product, deletedRequests: deletedRequests.count, deletedFaultReports: deletedFaultReports.count };
        });
        return Response.json({ message: "Produit et historique supprimés.", ...result });
    }
    catch (error) {
        const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
        if (code === "P2025")
            return Response.json({ error: "Produit introuvable." }, { status: 404 });
        console.error("Erreur suppression produit :", error);
        return Response.json({ error: "Erreur lors de la suppression du produit." }, { status: 500 });
    }
}