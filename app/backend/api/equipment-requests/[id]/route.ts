import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });
  if (user.user_role !== "admin") {
    return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const requestId = Number((await params).id);
  const { status } = await request.json();
  if (!Number.isInteger(requestId) || !["Acceptée", "Refusée"].includes(status)) {
    return Response.json({ error: "Décision invalide." }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (transaction) => {
      const equipmentRequest = await transaction.equipmentRequest.findUnique({ where: { id: requestId } });
      if (!equipmentRequest || !["En attente", "Panne signalée"].includes(equipmentRequest.status)) {
        throw new Error("REQUEST_NOT_PENDING");
      }

      if (status === "Acceptée" && equipmentRequest.status !== "Panne signalée") {
        const product = await transaction.product.findFirst({
          where: { id: equipmentRequest.productId, stock: { gt: 0 } },
        });
        if (!product) throw new Error("EQUIPMENT_UNAVAILABLE");
        await transaction.product.update({
          where: { id: product.id },
          data: { stock: { decrement: 1 } },
        });
        await transaction.user.update({
          where: { id: equipmentRequest.userId },
          data: { equipmentCount: { increment: 1 } },
        });
      }
      return transaction.equipmentRequest.update({ where: { id: requestId }, data: { status } });
    });
    return Response.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "REQUEST_NOT_PENDING") {
      return Response.json({ error: "Cette demande a déjà été traitée." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "EQUIPMENT_UNAVAILABLE") {
      return Response.json({ error: "Cet équipement n'est plus disponible." }, { status: 409 });
    }
    return Response.json({ error: "Impossible de traiter la demande." }, { status: 500 });
  }
}