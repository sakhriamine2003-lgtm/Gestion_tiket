import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("type") ?? "demande";

  if (mode === "panne") {
    const acceptedRequests = await prisma.equipmentRequest.findMany({
      where: { userId: user.id, status: "Acceptée" },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(
      acceptedRequests.map((request) => ({
        id: request.product.id,
        name: request.product.marque,
        type: request.product.bureau,
        description: "Produit accepté par l’administrateur. Vous pouvez maintenant déclarer une panne.",
        condition: "Accepté par l’administrateur",
        available: true,
      }))
    );
  }

  const equipment = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json(
    equipment.map((product) => ({
      id: product.id,
      name: product.marque,
      type: product.bureau,
      description: `Produit disponible dans le stock (${product.stock} unité${product.stock > 1 ? "s" : ""}).`,
      condition: "Disponible",
      available: product.stock > 0,
    }))
  );
}