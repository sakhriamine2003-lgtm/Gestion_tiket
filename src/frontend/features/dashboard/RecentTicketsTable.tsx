import Link from "next/link";
import { ArrowRight } from "lucide-react";

type TicketRow = {
    id: number;
    title: string;
    status: string;
    createdAt: Date | string;
    user: { name: string } | null;
};

const dashboardPath = "/products_frontend/Gestion_role/admin";
const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" });
const ticketStatuses: Record<string, { label: string; badge: string }> = {
    OPEN: { label: "Nouveau", badge: "bg-blue-50 text-blue-700 ring-blue-200" },
    IN_PROGRESS: { label: "En cours", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
    RESOLVED: { label: "Résolu", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    CLOSED: { label: "Fermé", badge: "bg-slate-100 text-slate-600 ring-slate-200" },
};

export default function RecentTicketsTable({ tickets, query }: { tickets: TicketRow[]; query: string }) {
    const visible = tickets.filter((ticket) => `${ticket.id} ${ticket.title} ${ticket.user?.name ?? ""}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")));
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
                <thead><tr className="border-y border-slate-100 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">Ticket</th><th className="px-3 py-3">Client</th><th className="px-3 py-3">Sujet</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3">Créé le</th><th className="px-4 py-3" />
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                    {visible.map((ticket) => {
                        const status = ticketStatuses[ticket.status] ?? { label: ticket.status, badge: "bg-slate-100 text-slate-600 ring-slate-200" };
                        return <tr key={ticket.id} className="transition hover:bg-slate-50/70">
                            <td className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold text-blue-700">#{ticket.id}</td>
                            <td className="max-w-32 truncate px-3 py-3.5 text-xs font-medium text-slate-700">{ticket.user?.name ?? "Administration"}</td>
                            <td className="max-w-48 truncate px-3 py-3.5 text-xs text-slate-700">{ticket.title}</td>
                            <td className="px-3 py-3.5"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${status.badge}`}>{status.label}</span></td>
                            <td className="whitespace-nowrap px-3 py-3.5 text-[11px] text-slate-500">{dateFormat.format(new Date(ticket.createdAt))}</td>
                            <td className="px-4 py-3.5"><Link href={`${dashboardPath}/tickets`} aria-label={`Consulter le ticket ${ticket.id}`} className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"><ArrowRight size={15} /></Link></td>
                        </tr>;
                    })}
                    {visible.length === 0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-xs text-slate-500">{tickets.length ? "Aucun ticket ne correspond à la recherche." : "Aucun ticket enregistré."}</td></tr> : null}
                </tbody>
            </table>
        </div>
    );
}
