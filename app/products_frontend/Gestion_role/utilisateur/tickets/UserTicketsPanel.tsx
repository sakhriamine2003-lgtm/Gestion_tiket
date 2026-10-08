"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import api from "@/lib/axios";
import { TicketAttachments, type TicketAttachmentItem } from "@/app/components/TicketAttachments";

type Ticket = {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  attachments: TicketAttachmentItem[];
};

function isTicket(value: unknown): value is Ticket {
  return typeof value === "object"
    && value !== null
    && "id" in value
    && typeof value.id === "number"
    && "title" in value
    && typeof value.title === "string"
    && "description" in value
    && typeof value.description === "string"
    && "status" in value
    && typeof value.status === "string"
    && "createdAt" in value
    && typeof value.createdAt === "string"
    && "attachments" in value
    && Array.isArray(value.attachments);
}

const MAX_ATTACHMENTS = 4;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;

export default function UserTicketsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadTickets() {
      try {
        const response = await api.get<Ticket[]>("/tickets");
        setTickets(response.data);
      } catch (error) {
        setMessage(axios.isAxiosError<{ error?: string }>(error)
          ? error.response?.data?.error ?? "Impossible de charger vos tickets."
          : error instanceof Error ? error.message : "Impossible de charger vos tickets.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadTickets();
  }, []);

  function selectFiles(selected: File[]) {
    setFiles(selected);
    const totalSize = selected.reduce((total, file) => total + file.size, 0);
    const invalidFile = selected.find((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      return (!isImage && !isVideo)
        || file.size === 0
        || file.size > (isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE);
    });

    if (selected.length > MAX_ATTACHMENTS) {
      setMessage(`Vous pouvez joindre au maximum ${MAX_ATTACHMENTS} fichiers.`);
    } else if (invalidFile) {
      setMessage("Formats acceptés : JPEG, PNG, GIF, WebP, MP4, MOV et WebM. Photos : 5 Mo max., vidéos : 20 Mo max.");
    } else if (totalSize > 25 * 1024 * 1024) {
      setMessage("La taille totale des fichiers ne doit pas dépasser 25 Mo.");
    } else {
      setMessage("");
    }
  }

  async function submitTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      setMessage("Le titre et le message sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("description", description.trim());
      files.forEach((file) => formData.append("attachments", file));

      removedIds.forEach((id) => formData.append("removeAttachmentIds", String(id)));

      const response = await fetch(
        editingId === null ? "/backend/api/tickets" : `/backend/api/tickets/${editingId}`,
        { method: editingId === null ? "POST" : "PATCH", body: formData },
      );
      const result: unknown = await response.json();
      if (!response.ok) {
        const errorMessage = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "Impossible d'enregistrer le ticket.";
        setMessage(errorMessage);
        return;
      }
      if (!isTicket(result)) throw new Error("Réponse invalide lors de la création du ticket.");

      if (editingId === null) {
        setTickets((current) => [result, ...current]);
      } else {
        setTickets((current) => current.map((ticket) => ticket.id === result.id ? result : ticket));
      }
      setMessage(editingId === null ? "Votre ticket a été créé." : "Votre ticket a été modifié.");
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'enregistrer le ticket.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setRemovedIds([]);
    setTitle("");
    setDescription("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function editTicket(ticket: Ticket) {
    resetForm();
    setEditingId(ticket.id);
    setTitle(ticket.title);
    setDescription(ticket.description);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleRemoved(id: number) {
    setRemovedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function deleteTicket(id: number) {
    if (!window.confirm("Supprimer définitivement ce ticket et ses fichiers joints ?")) return;

    setDeletingId(id);
    setMessage("");
    try {
      await api.delete(`/tickets/${id}`);
      setTickets((current) => current.filter((ticket) => ticket.id !== id));
      if (editingId === id) resetForm();
      setMessage("Votre ticket a été supprimé.");
    } catch (error) {
      setMessage(axios.isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error ?? "Impossible de supprimer le ticket."
        : "Impossible de supprimer le ticket.");
    } finally {
      setDeletingId(null);
    }
  }

  const editingTicket = tickets.find((ticket) => ticket.id === editingId);

  const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15";

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-white">
            {editingId === null ? "Créer un ticket" : `Modifier le ticket #${editingId}`}
          </h2>
          <p className="mt-0.5 text-sm text-teal-50/90">
            {editingId === null ? "Décrivez votre demande et joignez des photos ou vidéos si besoin." : "Mettez à jour le message ou les fichiers joints."}
          </p>
        </div>
        <form onSubmit={submitTicket} className="space-y-5 p-5 sm:p-6">
          <label className="block text-sm font-medium text-slate-700">
            Titre
            <input
              required
              maxLength={150}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
              placeholder="Ex. Problème de connexion"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Message
            <textarea
              required
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${inputClass} resize-y`}
              placeholder="Décrivez votre demande..."
            />
            <span className="mt-1 block text-right text-xs text-slate-400">{description.length}/2000</span>
          </label>
          {editingTicket?.attachments.length ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-sm font-medium text-slate-700">Fichiers actuels</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {editingTicket.attachments.map((attachment) => (
                  <li key={attachment.id} className="flex items-center gap-2">
                    <input
                      id={`remove-attachment-${attachment.id}`}
                      type="checkbox"
                      checked={removedIds.includes(attachment.id)}
                      onChange={() => toggleRemoved(attachment.id)}
                      className="size-4 rounded border-slate-300 accent-red-600"
                    />
                    <label htmlFor={`remove-attachment-${attachment.id}`} className={removedIds.includes(attachment.id) ? "text-slate-400 line-through" : ""}>
                      Retirer {attachment.fileName}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="ticket-attachments">
              {editingId === null ? "Photos ou vidéos (facultatif)" : "Ajouter des photos ou vidéos (facultatif)"}
            </label>
            <div className="mt-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-4 transition hover:border-teal-400 hover:bg-teal-50/40">
              <input
                ref={fileInputRef}
                id="ticket-attachments"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
                onChange={(event) => selectFiles(Array.from(event.target.files ?? []))}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-600 file:px-3.5 file:py-2 file:font-semibold file:text-white hover:file:bg-teal-700"
              />
              <p className="mt-2 text-xs text-slate-500">Jusqu&apos;à 4 fichiers, 25 Mo au total. Photos de 5 Mo max. et vidéos de 20 Mo max.</p>
              {files.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="max-w-full truncate rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow-sm ring-1 ring-slate-200">
                      {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} Mo)
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Envoi..." : editingId === null ? "Créer le ticket" : "Enregistrer"}
            </button>
            {editingId !== null ? (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
            ) : null}
          </div>
        </form>
        {message ? (
          <p className="mx-5 mb-5 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 sm:mx-6 sm:mb-6" role="status">{message}</p>
        ) : null}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Historique de mes tickets</h2>
          {tickets.length > 0 ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{tickets.length}</span>
          ) : null}
        </div>
        {isLoading ? <p className="mt-4 text-sm text-slate-500">Chargement...</p> : null}
        {!isLoading && tickets.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Aucun ticket pour le moment.
          </p>
        ) : null}
        <ul className="mt-4 grid gap-4">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="space-y-4 rounded-2xl border border-slate-200 border-l-4 border-l-teal-500 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Ticket #{ticket.id}</p>
                  <h3 className="mt-0.5 break-words text-base font-semibold text-slate-900">{ticket.title}</h3>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-200">{ticket.status}</span>
                  <span className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-700">{ticket.description}</p>
              <TicketAttachments ticketId={ticket.id} attachments={ticket.attachments} />
              <div className="flex gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => editTicket(ticket)}
                  disabled={isSubmitting || deletingId !== null}
                  className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => void deleteTicket(ticket.id)}
                  disabled={isSubmitting || deletingId !== null}
                  className="rounded-lg border border-red-200 px-3.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === ticket.id ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
