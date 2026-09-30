import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return Response.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (user.user_role !== "admin") {
      return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    const body = await request.json();

    const marque = String(body.marque || "").trim();
    const bureau = String(body.bureau || "").trim();
    const prix = Number(body.prix);
    const stock = Number(body.stock);
    const product = await prisma.product.create({
      data: { marque, bureau, prix, stock, initialStock: stock },
    });

    return Response.json(product, { status: 201 });
  } catch (error) {

    console.error("Erreur création produit :", error);
    return Response.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
