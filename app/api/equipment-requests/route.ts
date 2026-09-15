import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });

  const { equipmentId } = await request.json();
  const id = Number(equipmentId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Équipement invalide." }, { status: 400 });
  }

  try {
    const equipmentRequest = await prisma.$transaction(async (transaction) => {
      const equipment = await transaction.equipment.findUnique({ where: { id } });
      if (!equipment?.available) throw new Error("EQUIPMENT_UNAVAILABLE");

      const existingRequest = await transaction.equipmentRequest.findFirst({
        where: { userId: user.id, equipmentId: id, status: "En attente" },
      });
      if (existingRequest) throw new Error("REQUEST_EXISTS");

      return transaction.equipmentRequest.create({ data: { userId: user.id, equipmentId: id } });
    });
    return Response.json(equipmentRequest, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "EQUIPMENT_UNAVAILABLE") {
      return Response.json({ error: "Cet équipement n'est plus disponible." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "REQUEST_EXISTS") {
      return Response.json({ error: "Vous avez déjà demandé cet équipement." }, { status: 409 });
    }
    return Response.json({ error: "Impossible d'envoyer la demande." }, { status: 500 });
  }
}

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });
  if (user.user_role !== "admin") {
    return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const requests = await prisma.equipmentRequest.findMany({
    include: { user: { select: { name: true, email: true } }, equipment: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(requests);
}