"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Activity,
    Boxes,
    CheckCircle2,
    Clock3,
    Menu,
    Search,
    Ticket,
    Users,
    Wrench,
} from "lucide-react";
import { DonutChart, TicketTrendChart } from "@frontend/features/dashboard/DashboardCharts";
import DashboardSidebar from "@frontend/features/dashboard/DashboardSidebar";
import DashboardStatCards from "@frontend/features/dashboard/DashboardStatCards";
import DashboardQuickActions from "@frontend/features/dashboard/DashboardQuickActions";
import { NotificationsMenu, ProfileMenu } from "@frontend/features/dashboard/DashboardAccountMenus";
import RecentTicketsTable from "@frontend/features/dashboard/RecentTicketsTable";

type DashboardUser = {
    name: string;
    email: string;
};

type CountByStatus = {
    status: string;
    _count: { _all: number };
};

type TicketRow = {
    id: number;
    title: string;
    status: string;
    createdAt: Date | string;
    user: { name: string } | null;
};

type FaultReport = {
    id: number;
    status: string;
    createdAt: Date | string;
    user: { name: string };
    product: { marque: string; bureau: string };
};

type DashboardData = {
    ticketStatuses: CountByStatus[];
    ticketsCreatedThisMonth: CountByStatus[];
    ticketsCreatedLastMonth: CountByStatus[];
    resolvedThisMonth: number;
    resolvedLastMonth: number;
    recentTickets: TicketRow[];
    dailyTicketCounts: { day: string; count: number }[];
    trendEndDay: string;
    todayFaultReports: FaultReport[];
    productCount: number;
    availableProductCount: number;
    stockTotal: { _sum: { stock: number | null } };
    clientCount: number;
    notificationCount: number;
    notifications: { id: number; message: string; createdAt: Date | string }[];
};

const numberFormat = new Intl.NumberFormat("fr-FR");
const timeFormat = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
});

const ticketStatusLabels: Record<string, { label: string; color: string }> = {
    OPEN: { label: "Nouveau", color: "#3b82f6" },
    IN_PROGRESS: { label: "En cours", color: "#f59e0b" },
    RESOLVED: { label: "Résolu", color: "#10b981" },
    CLOSED: { label: "Fermé", color: "#64748b" },
};

const faultStatusLabels: Record<string, string> = {
    a_faire: "À faire",
    en_cours: "En cours",
    termine: "Terminé",
};

const faultStatusStyles: Record<string, string> = {
    a_faire: "bg-amber-50 text-amber-700",
    en_cours: "bg-sky-50 text-sky-700",
    termine: "bg-emerald-50 text-emerald-700",
};

function sumStatuses(statuses: CountByStatus[], included?: string[]) {
    return statuses.reduce(
        (total, row) => total + (included && !included.includes(row.status) ? 0 : row._count._all),
        0,
    );
}

function monthlyChange(current: number, previous: number) {
    if (previous === 0) return current === 0 ? 0 : null;
    return Math.round(((current - previous) / previous) * 100);
}

export default function AdminDashboard({
    user,
    dashboard,
}: {
    user: DashboardUser;
    dashboard: DashboardData;
}) {
    const [search, setSearch] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const ticketTotal = sumStatuses(dashboard.ticketStatuses);
    const activeTickets = sumStatuses(dashboard.ticketStatuses, ["OPEN", "IN_PROGRESS"]);
    const ticketStatuses = dashboard.ticketStatuses.map(({ status, _count }) => ({
        status,
        label: ticketStatusLabels[status]?.label ?? status,
        color: ticketStatusLabels[status]?.color ?? "#94a3b8",
        count: _count._all,
    }));

    const cards = [
        {
            title: "Tickets enregistrés",
            value: ticketTotal,
            icon: Ticket,
            iconClass: "bg-blue-50 text-blue-700",
            detail: "Total des tickets dans le système",
        },
        {
            title: "Tickets ouverts",
            value: activeTickets,
            icon: Clock3,
            iconClass: "bg-amber-50 text-amber-700",
            detail: "Nouveaux et en cours de traitement",
        },
        {
            title: "Tickets ce mois",
            value: sumStatuses(dashboard.ticketsCreatedThisMonth),
            icon: Activity,
            iconClass: "bg-cyan-50 text-cyan-700",
            detail: `${numberFormat.format(sumStatuses(dashboard.ticketsCreatedLastMonth))} le mois dernier`,
            change: monthlyChange(
                sumStatuses(dashboard.ticketsCreatedThisMonth),
                sumStatuses(dashboard.ticketsCreatedLastMonth),
            ),
        },
        {
            title: "Résolus ce mois",
            value: dashboard.resolvedThisMonth,
            icon: CheckCircle2,
            iconClass: "bg-emerald-50 text-emerald-700",
            detail: `${numberFormat.format(dashboard.resolvedLastMonth)} le mois dernier`,
        },
        {
            title: "Articles en stock",
            value: dashboard.stockTotal._sum.stock ?? 0,
            icon: Boxes,
            iconClass: "bg-violet-50 text-violet-700",
            detail: `${numberFormat.format(dashboard.availableProductCount)} références avec du stock sur ${numberFormat.format(dashboard.productCount)}`,
        },
        {
            title: "Clients",
            value: dashboard.clientCount,
            icon: Users,
            iconClass: "bg-rose-50 text-rose-700",
            detail: "Comptes utilisateurs enregistrés",
        },
    ];

    return (
        <div className="flex min-h-screen min-w-0 flex-1 bg-slate-50">
            <DashboardSidebar
                user={user}
                mobileOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />
            <div className="min-w-0 flex-1">
                <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
                    <div className="flex min-h-[76px] items-center gap-3 px-4 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Ouvrir le menu"
                            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
                        >
                            <Menu size={18} aria-hidden="true" />
                        </button>
                        <label className="flex min-w-0 max-w-xl flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-400 focus-within:border-blue-300 focus-within:bg-white">
                            <Search size={16} aria-hidden="true" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Rechercher dans les tickets récents..."
                                aria-label="Rechercher dans les tickets récents"
                                className="w-full min-w-0 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                            />
                        </label>
                        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                            <NotificationsMenu
                                count={dashboard.notificationCount}
                                notifications={dashboard.notifications}
                            />
                            <ProfileMenu user={user} />
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
                    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Espace administration</p>
                            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Bonjour {user.name}</h1>
                            <p className="mt-1.5 text-sm text-slate-500">Vue d’ensemble des tickets, du stock et de l’activité SAV.</p>
                        </div>
                        <p className="flex items-center gap-2 text-xs text-slate-500">
                            <Activity size={15} className="text-emerald-600" aria-hidden="true" />
                            Données actualisées à l’ouverture de la page
                        </p>
                    </section>

                    <DashboardStatCards cards={cards} />

                    <section className="grid gap-5 xl:grid-cols-2" aria-label="Statistiques des tickets">
                        <article className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-5">
                                <h2 className="text-sm font-bold text-slate-900">Répartition des tickets</h2>
                                <p className="mt-1 text-xs text-slate-500">État actuel des tickets enregistrés</p>
                            </div>
                            <DonutChart statuses={ticketStatuses} />
                        </article>
                        <article className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-1">
                                <h2 className="text-sm font-bold text-slate-900">Évolution des tickets</h2>
                                <p className="mt-1 text-xs text-slate-500">Tickets créés quotidiennement</p>
                            </div>
                            <TicketTrendChart
                                dailyCounts={dashboard.dailyTicketCounts}
                                endDay={dashboard.trendEndDay}
                            />
                        </article>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                        <div className="flex flex-col gap-1 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Tickets récents</h2>
                                <p className="mt-1 text-xs text-slate-500">Les {dashboard.recentTickets.length} derniers tickets chargés depuis la base.</p>
                            </div>
                            <Link href="/products_frontend/Gestion_role/admin/tickets" className="text-xs font-semibold text-blue-700 hover:text-blue-800">
                                Gérer les tickets
                            </Link>
                        </div>
                        <RecentTicketsTable tickets={dashboard.recentTickets} query={search} />
                    </section>

                    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Interventions du jour</h2>
                                <p className="mt-1 text-xs text-slate-500">Déclarations de panne créées aujourd’hui, selon les données disponibles.</p>
                            </div>
                            <Link href="/products_frontend/Gestion_role/admin/declarations-pannes" className="text-xs font-semibold text-blue-700 hover:text-blue-800">
                                Voir les déclarations
                            </Link>
                        </div>
                        {dashboard.todayFaultReports.length ? (
                            <ul className="divide-y divide-slate-100">
                                {dashboard.todayFaultReports.map((report) => (
                                    <li key={report.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
                                            <Wrench size={16} aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-slate-800">{report.product.marque} · {report.product.bureau}</p>
                                            <p className="mt-1 truncate text-[11px] text-slate-500">{report.user.name} · Déclaration #{report.id}</p>
                                        </div>
                                        <time className="text-[11px] text-slate-400">{timeFormat.format(new Date(report.createdAt))}</time>
                                        <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${faultStatusStyles[report.status] ?? "bg-slate-100 text-slate-600"}`}>
                                            {faultStatusLabels[report.status] ?? report.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="px-5 py-8 text-center text-xs text-slate-500">Aucune déclaration de panne aujourd’hui.</p>
                        )}
                        <p className="border-t border-slate-100 px-5 py-3 text-[10px] text-slate-400 sm:px-6">
                            Le modèle actuel ne contient pas d’affectation à un technicien ni de planification distincte.
                        </p>
                    </section>

                    <DashboardQuickActions />
                </main>
            </div>
        </div>
    );
}
