import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(request: Request) {
  const user = await getSession();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }
  if (user.user_role !== "admin") {
    return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const { productId } = await request.json();

  const id = Number(productId);

  const product = await prisma.product.delete({
    where: { id },
  });

return Response.json({
    message: "Produit supprimé avec succès",
    product,
  });
}