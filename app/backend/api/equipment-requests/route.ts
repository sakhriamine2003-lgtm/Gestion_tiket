import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST : Faire une demande d'équipement
export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Non autorisé" }, { status: 401 });

  const { productId } = await request.json();
  if (!productId) return Response.json({ error: "Produit invalide" }, { status: 400 });

  try {
    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) return Response.json({ error: "Produit introuvable" }, { status: 404 });
    if (product.stock <= 0) return Response.json({ error: "Stock épuisé" }, { status: 409 });

    const existingRequest = await prisma.equipmentRequest.findFirst({
      where: { userId: user.id, productId: Number(productId), status: "En attente" },
    });
    if (existingRequest) return Response.json({ error: "Demande déjà existante" }, { status: 409 });

    const newRequest = await prisma.equipmentRequest.create({
      data: { userId: user.id, productId: Number(productId) },
    });

    return Response.json(newRequest, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
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