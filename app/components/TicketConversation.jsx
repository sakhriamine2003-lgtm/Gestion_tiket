"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import api from "@/lib/axios";
import { TicketAttachments } from "@/app/components/TicketAttachments";
import TicketStatusBadge from "@/app/components/TicketStatusBadge";
import { TICKET_STATUS, canTransition, nextStatusFor } from "@/lib/ticket-status";

const POLL_INTERVAL_MS = 5000;

function errorText(error, fallback) {
    return axios.isAxiosError(error) ? error.response?.data?.error ?? fallback : fallback;
}

export default function TicketConversation({ ticketId, title, status, role, onBack, onChanged, onCreated }) {
    const [messages, setMessages] = useState([]);
    const [currentStatus, setCurrentStatus] = useState(status);
    const [content, setContent] = useState("");
    const [newTitle, setNewTitle] = useState("");
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(ticketId !== null && ticketId !== undefined);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [readBaseline, setReadBaseline] = useState(null);
    const [presence, setPresence] = useState({ online: false, hasPeer: false });
    const bottomRef = useRef(null);
    const lastKeyRef = useRef("");
    const fileInputRef = useRef(null);

    const isDraft = ticketId === null || ticketId === undefined;

    const load = useCallback(async () => {
        if (ticketId === null || ticketId === undefined)
            return;
        try {
            const response = await api.get(`/tickets/${ticketId}/messages`);
            setMessages(response.data.messages);
            setCurrentStatus(response.data.status);
            // La référence de lecture est figée au premier chargement : les messages reçus ensuite restent signalés comme nouveaux.
            setReadBaseline((current) => current ?? (response.data.selfReadAt ? new Date(response.data.selfReadAt).getTime() : 0));
            setPresence({
                online: response.data.peerOnline,
                hasPeer: response.data.hasPeer,
            });
        }
        catch (loadError) {
            setError(errorText(loadError, "Impossible de charger la conversation."));
        }
        finally {
            setIsLoading(false);
        }
    }, [ticketId]);

    useEffect(() => {
        const first = setTimeout(() => void load(), 0);
        const timer = setInterval(() => void load(), POLL_INTERVAL_MS);
        return () => {
            clearTimeout(first);
            clearInterval(timer);
        };
    }, [load]);

    useEffect(() => {
        const last = messages[messages.length - 1];
        const key = `${messages.length}:${last?.id ?? ""}`;
        if (key !== lastKeyRef.current) {
            lastKeyRef.current = key;
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messages]);

    async function send(event) {
        event.preventDefault();
        const text = content.trim();
        if ((!text && files.length === 0) || isSending)
            return;
        const ticketTitle = newTitle.trim();
        if (isDraft && !ticketTitle) {
            setError("Le titre du ticket est obligatoire.");
            return;
        }
        setIsSending(true);
        setError("");
        try {
            if (isDraft) {
                // Le premier message d'une nouvelle conversation crée le ticket.
                const formData = new FormData();
                formData.set("title", ticketTitle);
                formData.set("description", text || "Pièce(s) jointe(s)");
                files.forEach((file) => formData.append("attachments", file));
                const response = await fetch("/backend/api/tickets", { method: "POST", body: formData });
                const result = await response.json();
                if (!response.ok)
                    throw new Error(result?.error ?? "Impossible d'envoyer le message.");
                setContent("");
                setNewTitle("");
                setFiles([]);
                if (fileInputRef.current)
                    fileInputRef.current.value = "";
                onCreated?.(result);
                return;
            }
            if (files.length > 0) {
                const formData = new FormData();
                formData.set("content", text);
                files.forEach((file) => formData.append("attachments", file));
                await api.post(`/tickets/${ticketId}/messages`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }
            else {
                await api.post(`/tickets/${ticketId}/messages`, { content: text });
            }
            setContent("");
            setFiles([]);
            if (fileInputRef.current)
                fileInputRef.current.value = "";
            await load();
            onChanged?.();
        }
        catch (sendError) {
            setError(sendError instanceof Error && !axios.isAxiosError(sendError)
                ? sendError.message
                : errorText(sendError, "Impossible d'envoyer le message."));
        }
        finally {
            setIsSending(false);
        }
    }

    async function changeStatus(next) {
        setError("");
        setNotice("");
        if (next === TICKET_STATUS.CLOSED && !window.confirm("Voulez-vous vraiment fermer cette conversation ? Vous ne pourrez plus envoyer de messages."))
            return;
        try {
            const response = await api.patch(`/tickets/${ticketId}/status`, { status: next });
            setCurrentStatus(response.data.status);
            if (response.data.emailSent === false && !response.data.unchanged) {
                setNotice("Le statut a été mis à jour, mais la notification par e-mail n'a pas pu être envoyée.");
            }
            onChanged?.();
        }
        catch (statusError) {
            setError(errorText(statusError, "Impossible de modifier le statut."));
        }
    }

    const isClosed = currentStatus === TICKET_STATUS.CLOSED;
    // Nouveau = message de l'autre partie reçu après la dernière lecture connue à l'ouverture de la conversation.
    const isNewMessage = (message) => readBaseline !== null
        && !message.isAutomatic
        && message.id !== 0
        && message.senderRole !== role
        && new Date(message.createdAt).getTime() > readBaseline;
    const newCount = messages.filter(isNewMessage).length;
    const canWrite = !isClosed;
    const nextAdminStatus = role === "admin" ? nextStatusFor("admin", currentStatus) : null;
    const canUserClose = role === "utilisateur" && canTransition("utilisateur", currentStatus, TICKET_STATUS.CLOSED);
    const adminButtonLabels = {
        [TICKET_STATUS.IN_PROGRESS]: "En cours",
        [TICKET_STATUS.RESOLVED]: "Marquer comme traité",
    };

    return (<section className="flex h-[75vh] min-h-96 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{isDraft ? "Nouvelle conversation" : `Ticket #${ticketId}`}</p>
          {isDraft ? (<input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} maxLength={150} disabled={isSending} aria-label="Titre du ticket" placeholder="Titre du ticket (ex. Problème de connexion)" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"/>) : (<h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>)}
        </div>
        <div className="flex items-center gap-2">
          {isDraft || !presence.hasPeer ? null : <span className={`flex items-center gap-1 text-xs font-semibold ${presence.online ? "text-green-700" : "text-slate-500"}`}><span className={`h-2 w-2 rounded-full ${presence.online ? "bg-green-500" : "bg-slate-400"}`}/>{role === "admin" ? "Utilisateur" : "Administrateur"} {presence.online ? "connecté" : "non connecté"}</span>}
          {isDraft ? null : <TicketStatusBadge status={currentStatus}/>}
          {nextAdminStatus ? (<button type="button" onClick={() => void changeStatus(nextAdminStatus)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white">
              {adminButtonLabels[nextAdminStatus]}
            </button>) : null}
          {canUserClose ? (<button type="button" onClick={() => void changeStatus(TICKET_STATUS.CLOSED)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white">
              Fermer la conversation
            </button>) : null}
          {onBack ? (<button type="button" onClick={onBack} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white">
              Retour
            </button>) : null}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4">
        {isLoading ? <p className="text-sm text-slate-500">Chargement...</p> : null}
        {isDraft ? <p className="text-center text-sm text-slate-500">Saisissez le titre du ticket, puis écrivez votre premier message pour démarrer la conversation.</p> : null}
        {messages.map((message, index) => {
            const isAdmin = message.senderRole === "admin";
            const isNew = isNewMessage(message);
            const isFirstNew = isNew && !messages.slice(0, index).some(isNewMessage);
            const bubble = message.isAutomatic
                ? "rounded-bl-sm bg-green-50 ring-1 ring-green-300"
                : isNew
                    ? "rounded-2xl bg-amber-50 ring-2 ring-amber-400 shadow-md"
                    : isAdmin ? "rounded-bl-sm bg-white ring-1 ring-slate-200" : "rounded-br-sm bg-teal-700 text-white";
            return (<div key={message.id}>
              {isFirstNew ? (<div className="my-3 flex items-center gap-3" role="separator">
                  <span className="h-px flex-1 bg-amber-300"/>
                  <span className="rounded-full bg-amber-500 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">{newCount} nouveau{newCount > 1 ? "x" : ""} message{newCount > 1 ? "s" : ""}</span>
                  <span className="h-px flex-1 bg-amber-300"/>
                </div>) : null}
              <div className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${bubble}`}>
                <p className={`flex items-center gap-2 text-xs font-semibold ${message.isAutomatic ? "text-green-700" : isNew ? "text-amber-800" : isAdmin ? "text-teal-700" : "text-teal-100"}`}>
                  {message.isAutomatic ? "Confirmation" : isAdmin ? "Administrateur" : message.senderName ?? "Utilisateur"}
                  {isNew ? <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Nouveau</span> : null}
                </p>
                {message.content ? <p className={`mt-0.5 whitespace-pre-wrap break-words text-sm ${isNew ? "text-slate-900" : ""}`}>{message.content}</p> : null}
                {message.attachments?.length ? <div className="mt-2"><TicketAttachments ticketId={ticketId} attachments={message.attachments}/></div> : null}
                <p className={`mt-1 text-right text-[11px] ${isNew ? "text-amber-700" : isAdmin ? "text-slate-400" : "text-teal-100"}`}>
                  {new Date(message.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
              </div>
            </div>);
        })}
        <div ref={bottomRef}/>
      </div>

      {isSending && isDraft ? <p className="px-4 pt-2 text-sm text-slate-600">Création de la conversation en cours...</p> : null}
      {error ? <p className="px-4 pt-2 text-sm text-red-700" role="alert">{error}</p> : null}
      {notice ? <p className="px-4 pt-2 text-sm text-orange-700" role="status">{notice}</p> : null}
      {canWrite ? (<form onSubmit={send} className="border-t border-slate-200 p-3">
          {files.length > 0 ? <ul className="mb-2 flex flex-wrap gap-2">
              {files.map((file, index) => <li key={`${file.name}-${index}`} className="flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  <span className="max-w-56 truncate">{file.name}</span>
                  <button type="button" disabled={isSending} onClick={() => {
                        setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
                        if (fileInputRef.current)
                            fileInputRef.current.value = "";
                    }} aria-label={`Retirer ${file.name}`} className="font-bold text-slate-500 hover:text-red-700 disabled:opacity-50">×</button>
                </li>)}
            </ul> : null}
          <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" multiple disabled={isSending} accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm,application/pdf,.pdf" onChange={(event) => {
                const selected = Array.from(event.target.files ?? []);
                if (selected.length > 4) {
                    setError("Vous pouvez joindre au maximum 4 fichiers par message.");
                    event.target.value = "";
                    return;
                }
                setFiles(selected);
                setError("");
            }} className="hidden"/>
          <button type="button" disabled={isSending} onClick={() => fileInputRef.current?.click()} aria-label="Joindre des photos, vidéos ou PDF" className="shrink-0 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            Joindre
          </button>
          <textarea disabled={isSending} value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                }
            }} rows={2} maxLength={2000} placeholder="Écrire un message..." className="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 disabled:opacity-60"/>
          <button type="submit" disabled={isSending || (!content.trim() && files.length === 0)} className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSending ? "Envoi..." : "Envoyer"}
          </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">Photos (5 Mo max.), vidéos (20 Mo max.) ou PDF (10 Mo max.). Jusqu&apos;à 4 fichiers et 25 Mo par message.</p>
        </form>) : (<p className="border-t border-slate-200 p-3 text-center text-sm text-slate-500">Cette conversation est fermée.</p>)}
    </section>);
}
