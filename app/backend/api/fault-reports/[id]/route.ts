import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

const allowedStatuses = ["a_faire", "en_cours", "termine"] as const;
const statusLabels: Record<(typeof allowedStatuses)[number], string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
};
const htmlEscapes: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => htmlEscapes[character]);
}

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

    const report = result.report;
    const oldStatus = result.oldStatus ?? report.status;
    const newStatus = result.newStatus ?? statusLabels[report.status as (typeof allowedStatuses)[number]] ?? report.status;
    const deviceName = `${report.product.marque} (${report.product.bureau})`;
    const reportDate = report.updatedAt.toLocaleString("fr-FR");
    const qrCid = `fault-ticket-${report.id}@gestion-tickets`;
    const ticketDetails = {
      ticket: report.id,
      statut: newStatus,
      utilisateur: report.user.name,
      email: report.user.email,
      appareil: deviceName,
    };
    const escaped = {
      userName: escapeHtml(report.user.name),
      userEmail: escapeHtml(report.user.email),
      deviceName: escapeHtml(deviceName),
      description: escapeHtml(report.description),
      oldStatus: escapeHtml(oldStatus),
      newStatus: escapeHtml(newStatus),
      date: escapeHtml(reportDate),
    };

    let emailSent = false;
    try {
      const qrCode = await QRCode.toBuffer(JSON.stringify(ticketDetails), { width: 220, margin: 1 });
      emailSent = await sendEmail({
        to: report.user.email,
        subject: `Ticket panne #${report.id} : statut mis à jour`,
        text: `Bonjour ${report.user.name},\n\nLe statut de votre déclaration de panne a été modifié.\n\nTicket d'intervention #${report.id}\nAncien statut : ${oldStatus}\nNouveau statut : ${newStatus}\nUtilisateur : ${report.user.name}\nEmail : ${report.user.email}\nAppareil : ${deviceName}\nDescription : ${report.description}\nDate : ${reportDate}\n\nLe QR code du ticket est joint à cet email.\n\nMerci.`,
        html: `<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.5;max-width:600px;margin:auto"><h2>Mise à jour de votre déclaration de panne</h2><p>Bonjour ${escaped.userName},</p><p>Le statut de votre déclaration a été modifié.</p><div style="border:1px solid #d7dee8;padding:20px;border-radius:8px"><h3>Ticket d'intervention #${report.id}</h3><p><strong>Ancien statut :</strong> ${escaped.oldStatus}<br><strong>Nouveau statut :</strong> ${escaped.newStatus}</p><p><strong>Utilisateur :</strong> ${escaped.userName}<br><strong>Email :</strong> ${escaped.userEmail}<br><strong>Appareil :</strong> ${escaped.deviceName}<br><strong>Description :</strong> ${escaped.description}<br><strong>Date :</strong> ${escaped.date}</p><img src="cid:${qrCid}" width="180" height="180" alt="QR code du ticket panne ${report.id}" /></div><p>Merci.</p></div>`,
        attachments: [{
          filename: `ticket-panne-${report.id}.png`,
          content: qrCode,
          contentType: "image/png",
          cid: qrCid,
        }],
      });
    } catch (error) {
      console.error("Erreur lors de la création du QR code du ticket :", error);
    }

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