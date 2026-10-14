"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import api from "@/lib/axios";

const POLL_INTERVAL_MS = 5000;

function errorText(error, fallback) {
    return axios.isAxiosError(error) ? error.response?.data?.error ?? fallback : fallback;
}

export default function TicketConversation({ ticketId, title, status, role, onBack, onChanged }) {
    const [messages, setMessages] = useState([]);
    const [currentStatus, setCurrentStatus] = useState(status);
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const bottomRef = useRef(null);
    const lastKeyRef = useRef("");

    const load = useCallback(async () => {
        try {
            const response = await api.get(`/tickets/${ticketId}/messages`);
            setMessages(response.data.messages);
            setCurrentStatus(response.data.status);
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
        if (!text || isSending)
            return;
        setIsSending(true);
        setError("");
        try {
            await api.post(`/tickets/${ticketId}/messages`, { content: text });
            setContent("");
            await load();
            onChanged?.();
        }
        catch (sendError) {
            setError(errorText(sendError, "Impossible d'envoyer le message."));
        }
        finally {
            setIsSending(false);
        }
    }

    async function changeStatus(next) {
        setError("");
        try {
            await api.patch(`/tickets/${ticketId}/status`, { status: next });
            setCurrentStatus(next);
            onChanged?.();
        }
        catch (statusError) {
            setError(errorText(statusError, "Impossible de modifier le statut."));
        }
    }

    const isClosed = currentStatus === "CLOSED";
    const canWrite = role === "admin" || !isClosed;

    return (<section className="flex h-[75vh] min-h-96 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Ticket #{ticketId}</p>
          <h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-200">{currentStatus}</span>
          {role === "admin" ? (<button type="button" onClick={() => void changeStatus(isClosed ? "OPEN" : "CLOSED")} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white">
              {isClosed ? "Rouvrir" : "Fermer"}
            </button>) : null}
          {onBack ? (<button type="button" onClick={onBack} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white">
              Retour
            </button>) : null}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4">
        {isLoading ? <p className="text-sm text-slate-500">Chargement...</p> : null}
        {messages.map((message) => {
            const isAdmin = message.senderRole === "admin";
            return (<div key={message.id} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${isAdmin ? "rounded-bl-sm bg-white ring-1 ring-slate-200" : "rounded-br-sm bg-teal-700 text-white"}`}>
                <p className={`text-xs font-semibold ${isAdmin ? "text-teal-700" : "text-teal-100"}`}>
                  {isAdmin ? "Administrateur" : message.senderName ?? "Sportif"}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{message.content}</p>
                <p className={`mt-1 text-right text-[11px] ${isAdmin ? "text-slate-400" : "text-teal-100"}`}>
                  {new Date(message.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>);
        })}
        <div ref={bottomRef}/>
      </div>

      {error ? <p className="px-4 pt-2 text-sm text-red-700" role="alert">{error}</p> : null}
      {canWrite ? (<form onSubmit={send} className="flex items-end gap-2 border-t border-slate-200 p-3">
          <textarea value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                }
            }} rows={2} maxLength={2000} placeholder="Écrire un message..." className="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15"/>
          <button type="submit" disabled={isSending || !content.trim()} className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSending ? "Envoi..." : "Envoyer"}
          </button>
        </form>) : (<p className="border-t border-slate-200 p-3 text-center text-sm text-slate-500">Ce ticket est fermé.</p>)}
    </section>);
}
