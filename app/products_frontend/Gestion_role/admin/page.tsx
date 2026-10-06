import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Package,
  Users,
  Wrench,
} from "lucide-react";

const requestStatusStyles: Record<string, string> = {
  "En attente": "bg-amber-100 text-amber-800",
  Acceptée: "bg-emerald-100 text-emerald-800",
  Refusée: "bg-rose-100 text-rose-800",
  "Panne signalée": "bg-orange-100 text-orange-800",
};

const faultStatusLabels: Record<string, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
};

const faultStatusStyles: Record<string, string> = {
  a_faire: "bg-amber-100 text-amber-800",
  en_cours: "bg-sky-100 text-sky-800",
  termine: "bg-emerald-100 text-emerald-800",
};

const statusBarStyles: Record<string, string> = {
  "En attente": "bg-amber-400",
  Acceptée: "bg-emerald-500",
  Refusée: "bg-rose-500",
  "Panne signalée": "bg-orange-500",
  a_faire: "bg-amber-400",
  en_cours: "bg-sky-500",
  termine: "bg-emerald-500",
};

const numberFormat = new Intl.NumberFormat("fr-FR");

export default async function AdminPage() {
  const user = await requireRole("admin");

  const [
    requestStatuses,
    faultStatuses,
    productCount,
    availableProductCount,
    stockTotal,
    userCount,
    recentRequests,
    recentFaultReports,
  ] = await Promise.all([
    prisma.equipmentRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.faultReport.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.product.count(),
    prisma.product.count({ where: { stock: { gt: 0 } } }),
    prisma.product.aggregate({ _sum: { stock: true } }),
    prisma.user.count(),
    prisma.equipmentRequest.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
        product: { select: { marque: true, bureau: true } },
      },
    }),
    prisma.faultReport.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
        product: { select: { marque: true, bureau: true } },
      },
    }),
  ]);

  const requestTotal = requestStatuses.reduce((total, row) => total + row._count._all, 0);
  const faultTotal = faultStatuses.reduce((total, row) => total + row._count._all, 0);
  const pendingRequests = requestStatuses.find((row) => row.status === "En attente")?._count._all ?? 0;
  const openFaults = faultStatuses
    .filter((row) => row.status === "a_faire" || row.status === "en_cours")
    .reduce((total, row) => total + row._count._all, 0);
  const operationTotal = requestTotal + faultTotal;

  const activities = [
    ...recentRequests.map((request) => ({
      id: `request-${request.id}`,
      createdAt: request.createdAt,
      title: request.product.marque,
      detail: `${request.user.name} · ${request.product.bureau}`,
      category: "Demande",
      status: request.status,
      href: "/products_frontend/Gestion_role/admin/demandes-equipement",
    })),
    ...recentFaultReports.map((report) => ({
      id: `fault-${report.id}`,
      createdAt: report.createdAt,
      title: report.product.marque,
      detail: `${report.user.name} · ${report.product.bureau}`,
      category: "Panne",
      status: report.status,
      href: "/products_frontend/Gestion_role/admin/declarations-pannes",
    })),
  ]
    .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
    .slice(0, 6);

  const statCards = [
    {
      label: "Opérations enregistrées",
      value: operationTotal,
      detail: `${numberFormat.format(requestTotal)} demandes · ${numberFormat.format(faultTotal)} pannes`,
      icon: Activity,
      iconStyle: "bg-teal-50 text-teal-700",
    },
    {
      label: "Demandes en attente",
      value: pendingRequests,
      detail: "À examiner par l’administration",
      icon: Clock3,
      iconStyle: "bg-amber-50 text-amber-700",
    },
    {
      label: "Interventions ouvertes",
      value: openFaults,
      detail: "Déclarations à faire ou en cours",
      icon: Wrench,
      iconStyle: "bg-sky-50 text-sky-700",
    },
    {
      label: "Articles en stock",
      value: stockTotal._sum.stock ?? 0,
      detail: `${numberFormat.format(availableProductCount)} références disponibles`,
      icon: Boxes,
      iconStyle: "bg-violet-50 text-violet-700",
    },
    {
      label: "Utilisateurs",
      value: userCount,
      detail: `${numberFormat.format(productCount)} références au catalogue`,
      icon: Users,
      iconStyle: "bg-rose-50 text-rose-700",
    },
  ];

  const statusSections = [
    {
      title: "Demandes d’équipement",
      total: requestTotal,
      statuses: requestStatuses.map((row) => ({
        key: row.status,
        label: row.status,
        count: row._count._all,
        badgeStyle: requestStatusStyles[row.status] ?? "bg-slate-100 text-slate-700",
      })),
      emptyMessage: "Aucune demande enregistrée.",
    },
    {
      title: "Déclarations de pannes",
      total: faultTotal,
      statuses: faultStatuses.map((row) => ({
        key: row.status,
        label: faultStatusLabels[row.status] ?? row.status,
        count: row._count._all,
        badgeStyle: faultStatusStyles[row.status] ?? "bg-slate-100 text-slate-700",
      })),
      emptyMessage: "Aucune déclaration enregistrée.",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-6 text-white shadow-xl shadow-slate-900/10 sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">Espace administration</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Bonjour {user.name}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Retrouvez en un coup d’œil les demandes, les interventions et l’état de votre stock.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-100">
            <CheckCircle2 size={16} className="text-teal-300" aria-hidden="true" />
            Tableau de bord à jour
          </div>
        </div>
      </section>

      <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map(({ label, value, detail, icon: Icon, iconStyle }) => (
          <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <span className={`rounded-xl p-2.5 ${iconStyle}`}>
                <Icon size={18} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{numberFormat.format(value)}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {statusSections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Répartition par statut</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{section.title}</h2>
                  </div>
                  <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                    {numberFormat.format(section.total)}
                  </span>
                </div>
                {section.statuses.length === 0 ? (
                  <p className="mt-6 text-sm text-slate-500">{section.emptyMessage}</p>
                ) : (
                  <ul className="mt-6 space-y-4">
                    {section.statuses.map((status) => (
                      <li key={status.key}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.badgeStyle}`}>
                            {status.label}
                          </span>
                          <span className="font-semibold tabular-nums text-slate-700">
                            {numberFormat.format(status.count)}
                          </span>
                        </div>
                        <div
                          className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                          role="progressbar"
                          aria-label={`${status.label} : ${status.count} sur ${section.total}`}
                          aria-valuemin={0}
                          aria-valuemax={section.total}
                          aria-valuenow={status.count}
                        >
                          <div
                            className={`h-full rounded-full transition-all ${statusBarStyles[status.key] ?? "bg-slate-400"}`}
                            style={{ width: `${section.total === 0 ? 0 : (status.count / section.total) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Accès rapide</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Gérer les opérations</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/products_frontend/Gestion_role/admin/demandes-equipement"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  <ClipboardList size={16} aria-hidden="true" />
                  Demandes
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
                <Link
                  href="/products_frontend/Gestion_role/admin/declarations-pannes"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Wrench size={16} aria-hidden="true" />
                  Pannes
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
                <Link
                  href="/products_frontend/Gestion_product/AffichageProduit"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Package size={16} aria-hidden="true" />
                  Catalogue
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>
        </div>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Suivi opérationnel</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Activité récente</h2>
            </div>
            <Activity size={20} className="text-teal-700" aria-hidden="true" />
          </div>
          {activities.length === 0 ? (
            <div className="mt-8 rounded-xl bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">Aucune activité pour le moment</p>
              <p className="mt-1 text-xs text-slate-500">Les nouvelles demandes et interventions apparaîtront ici.</p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100">
              {activities.map((activity) => {
                const isFault = activity.category === "Panne";
                const statusLabel = isFault ? faultStatusLabels[activity.status] ?? activity.status : activity.status;
                const statusStyle = isFault
                  ? faultStatusStyles[activity.status] ?? "bg-slate-100 text-slate-700"
                  : requestStatusStyles[activity.status] ?? "bg-slate-100 text-slate-700";

                return (
                  <li key={activity.id}>
                    <Link href={activity.href} className="group flex gap-3 py-4 first:pt-1 last:pb-1">
                      <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${isFault ? "bg-orange-50 text-orange-700" : "bg-teal-50 text-teal-700"}`}>
                        {isFault ? <Wrench size={16} aria-hidden="true" /> : <ClipboardList size={16} aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-teal-800">{activity.title}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle}`}>
                            {statusLabel}
                          </span>
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">{activity.category} · {activity.detail}</span>
                        <time className="mt-1 block text-[11px] text-slate-400" dateTime={activity.createdAt.toISOString()}>
                          {activity.createdAt.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                        </time>
                      </span>
                      <ArrowUpRight size={15} className="mt-1 shrink-0 text-slate-300 transition group-hover:text-teal-700" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
