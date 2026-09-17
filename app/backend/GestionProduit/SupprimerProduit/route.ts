import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return Response.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (user.user_role !== "admin") {
      return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const id = Number(body.productId);

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "ID du produit invalide." }, { status: 400 });
    }

    const product = await prisma.product.delete({
      where: { id },
    });

    return Response.json({
      message: "Produit supprimé avec succès",
      product,
    });
  } catch (error) {
    console.error("Erreur suppression produit :", error);
    return Response.json(
      { error: "Erreur lors de la suppression du produit." },
      { status: 500 }
    );
  }
}