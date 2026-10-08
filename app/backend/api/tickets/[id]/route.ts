import { getSession } from "@/lib/auth";
import {
  MAX_TICKET_ATTACHMENTS,
  MAX_TICKET_TOTAL_SIZE,
  TicketAttachmentValidationError,
  validateTicketAttachments,
} from "@/lib/ticket-attachments";
import { prisma } from "@/lib/prisma";

type TicketRouteContext = { params: Promise<{ id: string }> };

async function authorize(context: TicketRouteContext) {
  const user = await getSession();
  if (!user) return { error: Response.json({ error: "Authentification requise." }, { status: 401 }) };
  if (user.user_role !== "utilisateur") {
    return { error: Response.json({ error: "Seuls les utilisateurs peuvent gérer leurs tickets." }, { status: 403 }) };
  }

  const ticketId = Number((await context.params).id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    return { error: Response.json({ error: "Ticket introuvable." }, { status: 404 }) };
  }
  return { user, ticketId };
}

export async function PATCH(request: Request, context: TicketRouteContext) {
  const auth = await authorize(context);
  if (auth.error) return auth.error;
  const { user, ticketId } = auth;

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_TICKET_TOTAL_SIZE + 1024 * 1024) {
    return Response.json({ error: "La requête est trop volumineuse." }, { status: 413 });
  }
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return Response.json({ error: "Le formulaire de ticket est invalide." }, { status: 415 });
  }

  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: "Formulaire de ticket invalide." }, { status: 400 });
    }

    const title = formData.get("title");
    const description = formData.get("description");
    const titleText = typeof title === "string" ? title.trim() : "";
    const descriptionText = typeof description === "string" ? description.trim() : "";
    if (!titleText || titleText.length > 150 || !descriptionText || descriptionText.length > 2000) {
      return Response.json({ error: "Le titre est obligatoire (150 caractères max.) et le message doit contenir au maximum 2 000 caractères." }, { status: 400 });
    }

    const fileEntries = formData.getAll("attachments");
    if (fileEntries.some((entry) => !(entry instanceof File))) {
      return Response.json({ error: "Fichier joint invalide." }, { status: 400 });
    }
    const files = fileEntries.filter((entry): entry is File => entry instanceof File);
    const removeIds = formData.getAll("removeAttachmentIds").map((value) => Number(value));
    if (removeIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return Response.json({ error: "Pièce jointe invalide." }, { status: 400 });
    }

    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, userId: user.id },
      select: { attachments: { select: { id: true, size: true } } },
    });
    if (!existing) return Response.json({ error: "Ticket introuvable." }, { status: 404 });

    const remaining = existing.attachments.filter((attachment) => !removeIds.includes(attachment.id));
    const newAttachments = await validateTicketAttachments(files);
    const remainingSize = remaining.reduce((total, attachment) => total + attachment.size, 0);
    const newSize = newAttachments.reduce((total, attachment) => total + attachment.size, 0);
    if (remaining.length + newAttachments.length > MAX_TICKET_ATTACHMENTS) {
      return Response.json({ error: `Un ticket peut contenir au maximum ${MAX_TICKET_ATTACHMENTS} fichiers.` }, { status: 400 });
    }
    if (remainingSize + newSize > MAX_TICKET_TOTAL_SIZE) {
      return Response.json({ error: "La taille totale des fichiers ne doit pas dépasser 25 Mo." }, { status: 400 });
    }

    const ticket = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.ticket.updateMany({
        where: { id: ticketId, userId: user.id },
        data: { title: titleText, description: descriptionText },
      });
      if (updated.count === 0) return null;

      if (removeIds.length) {
        await transaction.ticketAttachment.deleteMany({ where: { ticketId, id: { in: removeIds } } });
      }
      if (newAttachments.length) {
        await transaction.ticketAttachment.createMany({
          data: newAttachments.map((attachment) => ({ ...attachment, ticketId })),
        });
      }

      return transaction.ticket.findUnique({
        where: { id: ticketId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          attachments: { select: { id: true, fileName: true, contentType: true, size: true }, orderBy: { id: "asc" } },
        },
      });
    });

    if (!ticket) return Response.json({ error: "Ticket introuvable." }, { status: 404 });
    return Response.json(ticket);
  } catch (error) {
    if (error instanceof TicketAttachmentValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("Erreur lors de la modification du ticket:", error);
    return Response.json({ error: "Impossible de modifier le ticket." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: TicketRouteContext) {
  const auth = await authorize(context);
  if (auth.error) return auth.error;

  try {
    const result = await prisma.ticket.deleteMany({ where: { id: auth.ticketId, userId: auth.user.id } });
    if (result.count === 0) return Response.json({ error: "Ticket introuvable." }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Erreur lors de la suppression du ticket:", error);
    return Response.json({ error: "Impossible de supprimer le ticket." }, { status: 500 });
  }
}
