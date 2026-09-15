import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });

  const equipment = await prisma.product.findMany({
    where: { stock: { gt: 0 } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(equipment.map((product) => ({
    id: product.id,
    name: product.marque,
    type: product.bureau,
    description: `Produit disponible dans le stock (${product.stock} unité${product.stock > 1 ? "s" : ""}).`,
    condition: "Disponible",
    available: product.stock > 0,
  })));
}