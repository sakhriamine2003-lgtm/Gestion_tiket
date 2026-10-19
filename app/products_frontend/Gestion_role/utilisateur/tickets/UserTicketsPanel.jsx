"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/axios";
import TicketConversation from "@/app/components/TicketConversation";
import TicketStatusBadge from "@/app/components/TicketStatusBadge";

const NEW_CONVERSATION = "new";

export default function UserTicketsPanel() {
    const [tickets, setTickets] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");

    const refreshTickets = useCallback(async () => {
        try {
            const response = await api.get("/tickets");
            setTickets(response.data);
            return response.data;
        }
        catch (error) {
            setMessage(axios.isAxiosError(error)
                ? error.response?.data?.error ?? "Impossible de charger vos conversations."
                : "Impossible de charger vos conversations.");
            return null;
        }
    }, []);

    useEffect(() => {
        async function init() {
            const loaded = await refreshTickets();
            setSelectedId(loaded && loaded.length > 0 ? loaded[0].id : NEW_CONVERSATION);
            setIsLoading(false);
        }
        void init();
        const timer = setInterval(() => void refreshTickets(), 5000);
        return () => clearInterval(timer);
    }, [refreshTickets]);

    const selected = tickets.find((ticket) => ticket.id === selectedId);
    const isDraft = selectedId === NEW_CONVERSATION;

    if (isLoading)
        return <p className="text-sm text-slate-500">Chargement...</p>;

    return (<div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
      <aside className="space-y-2">
        <button type="button" onClick={() => setSelectedId(NEW_CONVERSATION)} className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isDraft ? "bg-teal-800 text-white" : "bg-teal-700 text-white hover:bg-teal-800"}`}>
          + Nouvelle conversation
        </button>
        <ul className="max-h-[65vh] space-y-2 overflow-y-auto">
          {tickets.map((ticket) => (<li key={ticket.id} className={`flex items-start gap-2 rounded-lg border p-3 transition hover:bg-slate-50 ${ticket.id === selectedId ? "border-teal-500 bg-teal-50/50" : "border-slate-200 bg-white"}`}>
              <button type="button" onClick={() => setSelectedId(ticket.id)} className="min-w-0 flex-1 text-left">
                <div className="flex justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">#{ticket.id} — {ticket.title}</span>
                  <span className="shrink-0 text-xs text-slate-500">{new Date(ticket.messages?.[0]?.createdAt ?? ticket.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{ticket.messages?.[0]?.content ?? ticket.description}</p>
                <div className="mt-1"><TicketStatusBadge status={ticket.status}/></div>
              </button>
            </li>))}
        </ul>
        {message ? <p className="text-sm text-red-700" role="alert">{message}</p> : null}
      </aside>
      {isDraft ? (<TicketConversation key="new" ticketId={null} role="utilisateur" onCreated={(ticket) => {
                setTickets((current) => [ticket, ...current.filter((item) => item.id !== ticket.id)]);
                setSelectedId(ticket.id);
                void refreshTickets();
            }}/>) : selected ? (<TicketConversation key={selected.id} ticketId={selected.id} title={selected.title} status={selected.status} role="utilisateur" onChanged={() => void refreshTickets()}/>) : null}
    </div>);
}
