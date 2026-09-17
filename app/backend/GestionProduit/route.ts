// import { prisma } from "@/lib/prisma";
// import { getSession } from "@/lib/auth";

// export async function POST(request: Request) {
//   try {
//     const user = await getSession();
//     if (!user) {
//       return Response.json({ error: "Authentification requise." }, { status: 401 });
//     }
//     if (user.user_role !== "admin") {
//       return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
//     }

//     const body = await request.json();

//     const marque = String(body.marque || "").trim();
//     const bureau = String(body.bureau || "").trim();
//     const prix = Number(body.prix);
//     const stock = Number(body.stock);
//     const product = await prisma.product.create({
//       data: { marque, bureau, prix, stock },
//     });

//     return Response.json(product, { status: 201 });
//   } catch (error) {

//     console.error("Erreur création produit :", error);
//     return Response.json({ error: "Une erreur est survenue." }, { status: 500 });
//   }
// }

// export {};





// export async function PUT(request: Request) {
//   try {
//     const user = await getSession();
//     if (!user) {
//       return Response.json({ error: "Authentification requise." }, { status: 401 });
//     }
//     if (user.user_role !== "admin") {
//       return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
//     }

//     const body = await request.json();
//     const id = Number(body.productId);
//     const marque = String(body.marque || "").trim();
//     const bureau = String(body.bureau || "").trim();
//     const prix = Number(body.prix);
//     const stock = Number(body.stock);

//     if (!Number.isInteger(id) || id <= 0) {
//       return Response.json({ error: "ID du produit invalide." }, { status: 400 });
//     }

//     if (!marque || !bureau || !Number.isFinite(prix) || prix < 0 || !Number.isInteger(stock) || stock < 0) {
//       return Response.json({ error: "Les données du produit sont invalides." }, { status: 400 });
//     }

//     const product = await prisma.product.update({
//       where: { id },
//       data: { marque, bureau, prix, stock },

//     });

//     return Response.json(product);
//   } catch (error) {
//     console.error("Erreur modification produit :", error);
//     return Response.json(
//       { error: "Erreur lors de la modification du produit." },
//       { status: 500 }
//     );
//   }
// }






// export async function DELETE(request: Request) {
//   const user = await getSession();
//   if (!user) {
//     return Response.json({ error: "Authentification requise." }, { status: 401 });
//   }
//   if (user.user_role !== "admin") {
//     return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
//   }

//   const { productId } = await request.json();

//   const id = Number(productId);

//   const product = await prisma.product.delete({
//     where: { id },
//   });

// return Response.json({
//     message: "Produit supprimé avec succès",
//     product,
//   });
// }

export {};