import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });

  const equipment = await prisma.equipment.findMany({
    where: { available: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(equipment);
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });
  if (user.user_role !== "admin") {
    return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const condition = typeof body.condition === "string" ? body.condition.trim() : "";
  if (!name || !type || !description || !condition) {
    return Response.json({ error: "Tous les champs de l'équipement sont requis." }, { status: 400 });
  }

  const equipment = await prisma.equipment.create({ data: { name, type, description, condition } });
  return Response.json(equipment, { status: 201 });
}