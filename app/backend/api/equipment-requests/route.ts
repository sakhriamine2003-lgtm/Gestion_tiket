import { getSession } from "@/lib/auth";
import { sendEmails } from "@/lib/email";
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
    const status = "En attente";

    if (!Number.isInteger(productId) || productId <= 0) {
      return Response.json({ error: "Produit invalide" }, { status: 400 });
    }
    if (requestType === "panne" && !reason) {
      return Response.json({ error: "Le détail de la panne est obligatoire." }, { status: 400 });
    }
    if (requestType === "panne" && user.user_role !== "utilisateur") {
      return Response.json({ error: "Seuls les utilisateurs peuvent déclarer une panne." }, { status: 403 });
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

    if (requestType === "demande" && product.stock <= 0) {
      return Response.json({ error: "Cet équipement n'est plus disponible." }, { status: 409 });
    }

    if (requestType === "panne") {
      const acceptedRequest = await prisma.equipmentRequest.findFirst({
        where: { userId: user.id, productId: product.id, status: "Acceptée" },
        select: { id: true },
      });
      if (!acceptedRequest) {
        return Response.json({ error: "Cet équipement ne fait pas partie de votre matériel accepté." }, { status: 403 });
      }
    }

    const demande = requestType === "panne"
      ? await prisma.faultReport.create({
          data: { userId: user.id, productId: product.id, description: reason },
        })
      : await prisma.equipmentRequest.create({
          data: { userId: user.id, productId: product.id, status, reason: null },
        });

    const admins = await prisma.user.findMany({
      where: { user_role: "admin" },
      select: { email: true },
    });
    const typeLabel = requestType === "panne" ? "déclaration de panne" : "demande d’équipement";
    const productLabel = `${product.marque} (${product.bureau})`;
    const details = requestType === "panne" ? `\nDétail de la panne : ${reason}` : "";

    await sendEmails([
      {
        to: user.email,
        subject: `Confirmation de votre ${typeLabel}`,
        text: `Bonjour ${user.name},\n\nVotre ${typeLabel} pour ${productLabel} a été enregistrée.${details}\n\nStatut : ${requestType === "panne" ? "À faire" : status}.`,
      },
      ...admins.map((admin) => ({
        to: admin.email,
        subject: `Nouvelle ${typeLabel}`,
        text: `Une ${typeLabel} a été envoyée par ${user.name} (${user.email}) pour ${productLabel}.${details}\n\nConsultez le tableau de bord administrateur pour la traiter.`,
      })),
    ]);

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
