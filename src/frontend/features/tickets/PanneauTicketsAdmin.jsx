"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { MessageSquarePlus } from "lucide-react";
import api from "@frontend/services/api";
import TicketConversation from "@frontend/features/tickets/ConversationTicket";
import TicketStatusBadge from "@frontend/features/tickets/BadgeStatutTicket";

export default function AdminTicketsPanel({ initialTicketId = null }) {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [selectedId, setSelectedId] = useState(initialTicketId);
    async function refreshTickets() {
        try {
            const response = await api.get("/tickets");
            setTickets(response.data);
        } catch (error) {
            setMessage(axios.isAxiosError(error)
                ? error.response?.data?.error ?? "Impossible d'actualiser les tickets."
                : error instanceof Error ? error.message : "Impossible d'actualiser les tickets.");
        }
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
    return (<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {isLoading ? <p className="py-8 text-center text-sm text-slate-500" role="status">Chargement des tickets...</p> : null}
      {!isLoading ? (<div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <div className="space-y-3">
          <button type="button" onClick={() => setSelectedId("new")} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
            <MessageSquarePlus size={17} aria-hidden="true" /> Nouvelle conversation
          </button>
          {tickets.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">Aucun ticket créé.</p> : null}
          <ul className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {tickets.map((ticket) => {
                const owner = ticket.user?.name ?? "Administration";
                return (<li key={ticket.id}>
                <button type="button" onClick={() => setSelectedId(ticket.id)} aria-pressed={ticket.id === selectedId} className={`group flex w-full gap-3 rounded-xl border p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${ticket.id === selectedId ? "border-blue-500 bg-blue-50/70 ring-1 ring-blue-500" : "border-slate-200 bg-white"}`}>
                  <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${ticket.user ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>{owner.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{ticket.title}</span>
                      <span className="shrink-0 text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString("fr-FR")}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500"><span className="truncate">{owner}{ticket.user ? ` · ${ticket.user.email}` : ""}</span></span>
                    <span className="mt-1.5 line-clamp-2 block text-sm text-slate-600">{ticket.description}</span>
                    <span className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Ticket #{ticket.id}</span>
                      {ticket.user ? <TicketStatusBadge status={ticket.status}/> : null}
                    </span>
                  </span>
                </button>
              </li>);
            })}
          </ul>
          </div>
          {selectedId === "new" ? (<TicketConversation key="new" ticketId={null} role="admin" onCreated={(ticket) => {
                    setSelectedId(ticket.id);
                    void refreshTickets();
                }}/>) : selected ? (<TicketConversation key={selected.id} ticketId={selected.id} title={selected.title} status={selected.status} statusEnabled={Boolean(selected.user)} role="admin" onChanged={() => void refreshTickets()}/>) : (<p className="hidden items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-sm text-slate-500 lg:flex">Sélectionnez un ticket pour ouvrir la conversation.</p>)}
        </div>) : null}
      {message ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{message}</p> : null}
    </section>);
}