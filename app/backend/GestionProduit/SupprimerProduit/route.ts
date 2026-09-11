import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
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