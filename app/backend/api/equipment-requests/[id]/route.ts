import { getSession } from "@/lib/auth";
import { sendEmails } from "@/lib/email";
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
      const equipmentRequest = await transaction.equipmentRequest.findUnique({
        where: { id: requestId },
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { marque: true, bureau: true } },
        },
      });
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
      const updatedRequest = await transaction.equipmentRequest.update({ where: { id: requestId }, data: { status } });
      return { updatedRequest, equipmentRequest };
    });

    const admins = await prisma.user.findMany({ where: { user_role: "admin" }, select: { email: true } });
    const decision = status === "Acceptée" ? "acceptée" : "refusée";
    const productLabel = `${updated.equipmentRequest.product.marque} (${updated.equipmentRequest.product.bureau})`;
    await sendEmails([
      {
        to: updated.equipmentRequest.user.email,
        subject: `Votre demande a été ${decision}`,
        text: `Bonjour ${updated.equipmentRequest.user.name},\n\nVotre demande concernant ${productLabel} a été ${decision} par l’administrateur.`,
      },
      ...admins.map((admin) => ({
        to: admin.email,
        subject: `Demande ${decision}`,
        text: `La demande de ${updated.equipmentRequest.user.name} concernant ${productLabel} a été ${decision}.`,
      })),
    ]);

    return Response.json(updated.updatedRequest);
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
