import { getSession } from "@/lib/auth";
import {
  MAX_TICKET_TOTAL_SIZE,
  TicketAttachmentValidationError,
  validateTicketAttachments,
} from "@/lib/ticket-attachments";
import { prisma } from "@/lib/prisma";

const attachmentSummary = {
  select: { id: true, fileName: true, contentType: true, size: true },
};

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });

  try {
    const tickets = await prisma.ticket.findMany({
      where: user.user_role === "admin" ? undefined : { userId: user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        attachments: attachmentSummary,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(tickets);
  } catch (error) {
    console.error("Erreur lors du chargement des tickets:", error);
    return Response.json({ error: errorMessage("Impossible de charger les tickets.", error) }, { status: 500 });
  }
}

function errorMessage(fallback: string, error: unknown) {
  if (process.env.NODE_ENV === "production") return fallback;
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? `[${error.code}] `
    : "";
  return `${fallback} ${code}${error instanceof Error ? error.message : "Erreur inconnue."}`;
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });
  if (user.user_role !== "utilisateur") {
    return Response.json({ error: "Seuls les utilisateurs peuvent créer un ticket." }, { status: 403 });
  }

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
    const fileEntries = formData.getAll("attachments");
    if (fileEntries.some((entry) => !(entry instanceof File))) {
      return Response.json({ error: "Fichier joint invalide." }, { status: 400 });
    }
    const files = fileEntries.filter((entry): entry is File => entry instanceof File);

    if (!titleText || titleText.length > 150 || !descriptionText || descriptionText.length > 2000) {
      return Response.json({ error: "Le titre est obligatoire (150 caractères max.) et le message doit contenir au maximum 2 000 caractères." }, { status: 400 });
    }

    const attachments = await validateTicketAttachments(files);
    const ticket = await prisma.ticket.create({
      data: {
        title: titleText,
        description: descriptionText,
        userId: user.id,
        attachments: { create: attachments },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        attachments: attachmentSummary,
      },
    });

    return Response.json(ticket, { status: 201 });
  } catch (error) {
    if (error instanceof TicketAttachmentValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("Erreur lors de la création du ticket:", error);
    return Response.json({ error: errorMessage("Impossible d'enregistrer le ticket.", error) }, { status: 500 });
  }
}
