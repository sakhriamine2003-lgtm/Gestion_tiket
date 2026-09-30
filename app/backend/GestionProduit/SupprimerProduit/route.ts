import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(request: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });
  if (user.user_role !== "admin") return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const id = Number(body.productId);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "ID du produit invalide." }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const acceptedRequests = await transaction.equipmentRequest.findMany({
        where: { productId: id, status: "Acceptée" },
        select: { userId: true },
      });
      for (const request of acceptedRequests) {
        await transaction.user.update({ where: { id: request.userId }, data: { equipmentCount: { decrement: 1 } } });
      }
      const deletedFaultReports = await transaction.faultReport.deleteMany({ where: { productId: id } });
      const deletedRequests = await transaction.equipmentRequest.deleteMany({ where: { productId: id } });
      const product = await transaction.product.delete({ where: { id } });
      return { product, deletedRequests: deletedRequests.count, deletedFaultReports: deletedFaultReports.count };
    });
    return Response.json({ message: "Produit et historique supprimés.", ...result });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (code === "P2025") return Response.json({ error: "Produit introuvable." }, { status: 404 });
    console.error("Erreur suppression produit :", error);
    return Response.json({ error: "Erreur lors de la suppression du produit." }, { status: 500 });
  }
}