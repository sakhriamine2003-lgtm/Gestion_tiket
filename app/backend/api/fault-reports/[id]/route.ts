import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const allowedStatuses = ["a_faire", "en_cours", "termine"] as const;
const statusLabels: Record<(typeof allowedStatuses)[number], string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
};

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

    const result = await prisma.$transaction(async (transaction) => {
      const currentReport = await transaction.faultReport.findUnique({
        where: { id: reportId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, marque: true, bureau: true } },
        },
      });

      if (!currentReport) {
        throw new Error("REPORT_NOT_FOUND");
      }

      if (currentReport.status === body.status) {
        return { report: currentReport, changed: false };
      }

      const report = await transaction.faultReport.update({
        where: { id: reportId },
        data: { status: body.status },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, marque: true, bureau: true } },
        },
      });
      const oldStatus = statusLabels[currentReport.status as (typeof allowedStatuses)[number]] ?? currentReport.status;
      const newStatus = statusLabels[body.status as (typeof allowedStatuses)[number]];

      await transaction.notification.create({
        data: {
          userId: currentReport.userId,
          message: `Le statut de votre déclaration de panne a été modifié. Ancien statut : ${oldStatus}. Nouveau statut : ${newStatus}. Référence de la panne : ${report.id}. Date : ${report.updatedAt.toLocaleString("fr-FR")}.`,
        },
      });

      return { report, changed: true, oldStatus, newStatus };
    });

    if (!result.changed) {
      return Response.json({ ...result.report, unchanged: true, message: "Le statut est déjà identique." });
    }

    const emailSent = await sendEmail({
      to: result.report.user.email,
      subject: "Mise à jour de votre déclaration de panne",
      text: `Bonjour ${result.report.user.name},\n\nLe statut de votre déclaration de panne a été modifié.\n\nAncien statut : ${result.oldStatus}\nNouveau statut : ${result.newStatus}\nRéférence de la panne : ${result.report.id}\nDate : ${result.report.updatedAt.toLocaleString("fr-FR")}\n\nMerci.`,
    });

    return Response.json({
      ...result.report,
      emailSent,
      message: emailSent
        ? "Statut mis à jour et email envoyé."
        : "Statut mis à jour, mais l'email n'a pas pu être envoyé.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "REPORT_NOT_FOUND") {
      return Response.json({ error: "Déclaration introuvable." }, { status: 404 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return Response.json({ error: "Déclaration introuvable." }, { status: 404 });
    }
    console.error("Erreur lors de la mise à jour du statut de panne:", error);
    return Response.json({ error: "Impossible de modifier le statut." }, { status: 500 });
  }
}