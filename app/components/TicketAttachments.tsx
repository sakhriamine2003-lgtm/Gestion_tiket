import Image from "next/image";

export type TicketAttachmentItem = {
  id: number;
  fileName: string;
  contentType: string;
  size: number;
};

export function TicketAttachments({
  ticketId,
  attachments,
}: {
  ticketId: number;
  attachments: TicketAttachmentItem[];
}) {
  if (!attachments.length) return <span className="text-xs text-slate-400">Aucun fichier joint</span>;

  return (
    <ul className="flex flex-wrap gap-3">
      {attachments.map((attachment) => {
        const src = `/backend/api/tickets/${ticketId}/attachments/${attachment.id}`;
        return (
          <li key={attachment.id} className="max-w-48">
            {attachment.contentType.startsWith("image/") ? (
              <a href={src} target="_blank" rel="noreferrer" aria-label={`Ouvrir ${attachment.fileName}`}>
                <Image
                  src={src}
                  alt={attachment.fileName}
                  width={160}
                  height={120}
                  unoptimized
                  className="h-28 w-40 rounded-xl border border-slate-200 object-cover shadow-sm transition hover:scale-[1.02] hover:shadow-md"
                />
              </a>
            ) : (
              <video
                src={src}
                controls
                preload="metadata"
                className="h-28 w-48 rounded-xl border border-slate-200 bg-black shadow-sm"
                aria-label={attachment.fileName}
              />
            )}
            <p className="mt-1 truncate text-xs text-slate-500">{attachment.fileName}</p>
          </li>
        );
      })}
    </ul>
  );
}
