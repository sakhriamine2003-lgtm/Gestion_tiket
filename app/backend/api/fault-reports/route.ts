import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });

  const reports = await prisma.faultReport.findMany({
    where: user.user_role === "admin" ? undefined : { userId: user.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, marque: true, bureau: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(reports);
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });
  if (user.user_role !== "utilisateur") {
    return Response.json({ error: "Seuls les utilisateurs peuvent déclarer une panne." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const productId = Number(body.productId);
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!Number.isInteger(productId) || productId <= 0 || !description) {
      return Response.json({ error: "Choisissez un équipement et décrivez la panne." }, { status: 400 });
    }

    const acceptedRequest = await prisma.equipmentRequest.findFirst({
      where: { userId: user.id, productId, status: "Acceptée" },
      select: { id: true },
    });
    if (!acceptedRequest) {
      return Response.json({ error: "Cet équipement ne fait pas partie de votre matériel accepté." }, { status: 403 });
    }

    const report = await prisma.faultReport.create({
      data: { userId: user.id, productId, description },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, marque: true, bureau: true } },
      },
    });

    return Response.json(report, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la déclaration de panne:", error);
    return Response.json({ error: "Impossible d'enregistrer la déclaration." }, { status: 500 });
  }
}