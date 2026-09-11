import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const marque = String(body.marque || "").trim();
    const bureau = String(body.bureau || "").trim();
    const prix = Number(body.prix);
    const stock = Number(body.stock);
    const product = await prisma.product.create({
      data: { marque, bureau, prix, stock },
    });

    return Response.json(product, { status: 201 });
  } catch (error) {

    console.error("Erreur création produit :", error);
    return Response.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
