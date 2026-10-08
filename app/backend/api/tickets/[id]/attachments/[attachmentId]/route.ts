import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AttachmentRouteContext = {
  params: Promise<{ id: string; attachmentId: string }>;
};

export async function GET(request: Request, { params }: AttachmentRouteContext) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });

  const { id, attachmentId } = await params;
  const ticketId = Number(id);
  const fileId = Number(attachmentId);
  if (!Number.isInteger(ticketId) || ticketId <= 0 || !Number.isInteger(fileId) || fileId <= 0) {
    return Response.json({ error: "Pièce jointe introuvable." }, { status: 404 });
  }

  const attachment = await prisma.ticketAttachment.findFirst({
    where: {
      id: fileId,
      ticketId,
      ...(user.user_role === "admin" ? {} : { ticket: { userId: user.id } }),
    },
    select: { fileName: true, contentType: true, size: true, data: true },
  });
  if (!attachment) return Response.json({ error: "Pièce jointe introuvable." }, { status: 404 });

  const bytes = new Uint8Array(attachment.data);
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Disposition": `inline; filename="piece-jointe"; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
    "Content-Length": String(attachment.size),
    "Content-Type": attachment.contentType,
    "X-Content-Type-Options": "nosniff",
  });
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${attachment.size}` },
      });
    }

    const start = match[1] ? Number(match[1]) : Math.max(0, attachment.size - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(Number(match[2]), attachment.size - 1) : attachment.size - 1;
    if (start >= attachment.size || end < start) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${attachment.size}` },
      });
    }

    headers.set("Content-Length", String(end - start + 1));
    headers.set("Content-Range", `bytes ${start}-${end}/${attachment.size}`);
    return new Response(bytes.slice(start, end + 1), { status: 206, headers });
  }

  return new Response(bytes, { headers });
}
