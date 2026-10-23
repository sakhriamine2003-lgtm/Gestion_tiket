"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/axios";
import TicketConversation from "@/app/components/TicketConversation";
import TicketStatusBadge from "@/app/components/TicketStatusBadge";
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
      {!isLoading ? (<div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <div className="space-y-2">
          <button type="button" onClick={() => setSelectedId("new")} className="w-full rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800">
            + Nouvelle conversation
          </button>
          {tickets.length === 0 ? <p className="text-sm text-slate-500">Aucun ticket créé.</p> : null}
          <ul className="max-h-[70vh] space-y-2 overflow-y-auto">
            {tickets.map((ticket) => {
                const owner = ticket.user?.name ?? "Administration";
                return (<li key={ticket.id}>
                <button type="button" onClick={() => setSelectedId(ticket.id)} className={`group flex w-full gap-3 rounded-xl border p-3 text-left shadow-sm transition hover:border-teal-300 hover:shadow ${ticket.id === selectedId ? "border-teal-500 bg-teal-50/60 ring-1 ring-teal-500" : "border-slate-200 bg-white"}`}>
                  <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${ticket.user ? "bg-teal-600" : "bg-slate-500"}`}>{owner.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{ticket.title}</span>
                      <span className="shrink-0 text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString("fr-FR")}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span className="truncate">{owner}{ticket.user ? ` · ${ticket.user.email}` : ""}</span>
                    </span>
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
                }}/>) : selected ? (<TicketConversation key={selected.id} ticketId={selected.id} title={selected.title} status={selected.status} statusEnabled={Boolean(selected.user)} role="admin" onChanged={() => void refreshTickets()}/>) : (<p className="hidden items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-sm text-slate-500 lg:flex">
              Sélectionnez un ticket pour ouvrir la conversation.
            </p>)}
        </div>) : null}
      {message ? <p className="mt-4 text-sm text-red-700" role="alert">{message}</p> : null}
    </section>);
}
