"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/axios";
import { TicketAttachments, type TicketAttachmentItem } from "@/app/components/TicketAttachments";

type Ticket = {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  user: { name: string; email: string } | null;
  attachments: TicketAttachmentItem[];
};

export default function AdminTicketsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadTickets() {
      try {
        const response = await api.get<Ticket[]>("/tickets");
        setTickets(response.data);
      } catch (error) {
        setMessage(axios.isAxiosError<{ error?: string }>(error)
          ? error.response?.data?.error ?? "Impossible de charger les tickets."
          : error instanceof Error ? error.message : "Impossible de charger les tickets.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadTickets();
  }, []);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      {isLoading ? <p className="text-sm text-slate-500">Chargement...</p> : null}
      {!isLoading && tickets.length === 0 ? <p className="text-sm text-slate-500">Aucun ticket créé.</p> : null}
      {tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row">
                <div>
                  <h2 className="font-semibold text-slate-900">#{ticket.id} — {ticket.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {ticket.user ? `${ticket.user.name} (${ticket.user.email})` : "Ticket ancien sans utilisateur associé"}
                  </p>
                </div>
                <div className="text-sm text-slate-500 sm:text-right">
                  <p>{ticket.status}</p>
                  <p>{new Date(ticket.createdAt).toLocaleString("fr-FR")}</p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{ticket.description}</p>
              <div className="mt-4">
                <TicketAttachments ticketId={ticket.id} attachments={ticket.attachments} />
              </div>
            </article>
          ))}
        </div>
      ) : null}
      {message ? <p className="mt-4 text-sm text-red-700" role="alert">{message}</p> : null}
    </section>
  );
}
