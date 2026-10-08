export const MAX_TICKET_ATTACHMENTS = 4;
export const MAX_TICKET_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_TICKET_VIDEO_SIZE = 20 * 1024 * 1024;
export const MAX_TICKET_TOTAL_SIZE = 25 * 1024 * 1024;

export type ValidatedTicketAttachment = {
  fileName: string;
  contentType: string;
  size: number;
  data: Uint8Array<ArrayBuffer>;
};

export class TicketAttachmentValidationError extends Error {}

function matchesAscii(bytes: Uint8Array, offset: number, value: string) {
  return [...value].every((character, index) => bytes[offset + index] === character.charCodeAt(0));
}

function detectContentType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && matchesAscii(bytes, 1, "PNG\r\n\x1a\n")) return "image/png";
  if (bytes.length >= 6 && (matchesAscii(bytes, 0, "GIF87a") || matchesAscii(bytes, 0, "GIF89a"))) return "image/gif";
  if (bytes.length >= 12 && matchesAscii(bytes, 0, "RIFF") && matchesAscii(bytes, 8, "WEBP")) return "image/webp";
  if (bytes.length >= 12 && matchesAscii(bytes, 4, "ftyp")) {
    return matchesAscii(bytes, 8, "qt  ") ? "video/quicktime" : "video/mp4";
  }
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return "video/webm";
  }
  return null;
}

function sanitizeFileName(fileName: string) {
  const baseName = fileName.split(/[\\/]/).pop() ?? "";
  const cleaned = baseName.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 255);
  return cleaned || "piece-jointe";
}

export async function validateTicketAttachments(files: File[]): Promise<ValidatedTicketAttachment[]> {
  const selectedFiles = files.filter((file) => file.name !== "" || file.size > 0);
  if (selectedFiles.length > MAX_TICKET_ATTACHMENTS) {
    throw new TicketAttachmentValidationError(`Ajoutez au maximum ${MAX_TICKET_ATTACHMENTS} fichiers.`);
  }

  const totalSize = selectedFiles.reduce((total, file) => total + file.size, 0);
  if (totalSize > MAX_TICKET_TOTAL_SIZE) {
    throw new TicketAttachmentValidationError("La taille totale des fichiers ne doit pas dépasser 25 Mo.");
  }

  const validated: ValidatedTicketAttachment[] = [];
  for (const file of selectedFiles) {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const maxSize = isImage ? MAX_TICKET_IMAGE_SIZE : isVideo ? MAX_TICKET_VIDEO_SIZE : 0;
    if (!maxSize) {
      throw new TicketAttachmentValidationError("Formats acceptés : JPEG, PNG, GIF, WebP, MP4, MOV et WebM.");
    }
    if (file.size === 0 || file.size > maxSize) {
      throw new TicketAttachmentValidationError(isImage
        ? "Chaque photo doit faire 5 Mo maximum."
        : "Chaque vidéo doit faire 20 Mo maximum.");
    }

    const data = new Uint8Array(await file.arrayBuffer());
    const contentType = detectContentType(data);
    if (!contentType || contentType !== file.type) {
      throw new TicketAttachmentValidationError(`Le format réel de « ${sanitizeFileName(file.name)} » ne correspond pas à son type de fichier.`);
    }

    validated.push({
      fileName: sanitizeFileName(file.name),
      contentType,
      size: file.size,
      data,
    });
  }
  return validated;
}
