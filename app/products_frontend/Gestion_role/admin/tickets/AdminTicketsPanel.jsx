"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/axios";
import { TicketAttachments } from "@/app/components/TicketAttachments";
import TicketConversation from "@/app/components/TicketConversation";
export default function AdminTicketsPanel() {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    async function refreshTickets() {
        try {
            const response = await api.get("/tickets");
            setTickets(response.data);
        }
        catch { }
    }
    const selected = tickets.find((ticket) => ticket.id === selectedId);
    useEffect(() => {
        async function loadTickets() {
            try {
                const response = await api.get("/tickets");
                setTickets(response.data);
            }
            catch (error) {
                setMessage(axios.isAxiosError(error)
                    ? error.response?.data?.error ?? "Impossible de charger les tickets."
                    : error instanceof Error ? error.message : "Impossible de charger les tickets.");
            }
            finally {
                setIsLoading(false);
            }
        }
        void loadTickets();
    }, []);
    return (<section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      {isLoading ? <p className="text-sm text-slate-500">Chargement...</p> : null}
      {!isLoading && tickets.length === 0 ? <p className="text-sm text-slate-500">Aucun ticket créé.</p> : null}
      {tickets.length > 0 ? (<div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <ul className="max-h-[75vh] space-y-2 overflow-y-auto">
            {tickets.map((ticket) => (<li key={ticket.id}>
                <button type="button" onClick={() => setSelectedId(ticket.id)} className={`w-full rounded-lg border p-3 text-left transition hover:bg-slate-50 ${ticket.id === selectedId ? "border-teal-500 bg-teal-50/50" : "border-slate-200"}`}>
                  <div className="flex justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">#{ticket.id} — {ticket.title}</span>
                    <span className="shrink-0 text-xs text-slate-500">{new Date(ticket.messages?.[0]?.createdAt ?? ticket.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {ticket.user ? `${ticket.user.name} (${ticket.user.email})` : "Ticket ancien sans utilisateur associé"} · {ticket.status}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{ticket.messages?.[0]?.content ?? ticket.description}</p>
                </button>
              </li>))}
          </ul>
          {selected ? (<div className="space-y-3">
              <TicketConversation key={selected.id} ticketId={selected.id} title={selected.title} status={selected.status} role="admin" onChanged={() => void refreshTickets()}/>
              {selected.attachments.length > 0 ? <TicketAttachments ticketId={selected.id} attachments={selected.attachments}/> : null}
            </div>) : (<p className="hidden items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-sm text-slate-500 lg:flex">
              Sélectionnez un ticket pour ouvrir la conversation.
            </p>)}
        </div>) : null}
      {message ? <p className="mt-4 text-sm text-red-700" role="alert">{message}</p> : null}
    </section>);
}
