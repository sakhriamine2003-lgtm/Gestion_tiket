import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST : Faire une demande d'équipement
export async function POST(request: Request) {
  try {
    const user = await getSession();

    if (!user) {
      return Response.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const productId = Number(body.productId);
    const requestType = body.requestType === "panne" ? "panne" : "demande";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const status = requestType === "panne" ? "Panne signalée" : "En attente";

    if (!Number.isInteger(productId) || productId <= 0) {
      return Response.json({ error: "Produit invalide" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return Response.json(
        { error: "Produit introuvable" },
        { status: 404 }
      );
    }

    const demande = await prisma.equipmentRequest.create({
      data: {
        userId: user.id,
        productId: product.id,
        status,
      },
    });

    return Response.json({
      ...demande,
      requestType,
      reason: reason || (requestType === "panne" ? "Panne signalée" : "Demande de matériel"),
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création de la demande:", error);
    return Response.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}




// GET : Liste des demandes de l'utilisateur connecté ou de toutes les demandes pour l'admin
export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "Non autorisé" }, { status: 401 });

  const requests = await prisma.equipmentRequest.findMany({
    where: user.user_role === "admin" ? undefined : { userId: user.id },
    include: user.user_role === "admin" ? { user: true, product: true } : { product: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(requests);
}