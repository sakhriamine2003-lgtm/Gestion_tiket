import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedStatuses = ["a_faire", "en_cours", "termine"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });
  if (user.user_role !== "admin") {
    return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const reportId = Number((await params).id);

  try {
    const body = await request.json();
    if (!Number.isInteger(reportId) || reportId <= 0 || !allowedStatuses.includes(body.status)) {
      return Response.json({ error: "Statut invalide." }, { status: 400 });
    }

    const report = await prisma.faultReport.update({
      where: { id: reportId },
      data: { status: body.status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, marque: true, bureau: true } },
      },
    });

    return Response.json(report);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return Response.json({ error: "Déclaration introuvable." }, { status: 404 });
    }
    console.error("Erreur lors de la mise à jour du statut de panne:", error);
    return Response.json({ error: "Impossible de modifier le statut." }, { status: 500 });
  }
}