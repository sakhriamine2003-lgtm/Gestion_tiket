import { requireRole } from "@backend/auth/session";
import { prisma } from "@backend/db/prisma";
import { ClipboardList, PackageCheck, Ticket, TriangleAlert, Clock3 } from "lucide-react";
import EquipmentRequestPanel from "@frontend/features/equipment-requests/EquipmentRequestPanel";

const numberFormat = new Intl.NumberFormat("fr-FR");

export default async function UtilisateurPage() {
    const user = await requireRole("utilisateur");

    const [requestCount, pendingRequestCount, acceptedRequestCount, openTicketCount, activeFaultCount] = await Promise.all([
        prisma.equipmentRequest.count({ where: { userId: user.id } }),
        prisma.equipmentRequest.count({ where: { userId: user.id, status: "En attente" } }),
        prisma.equipmentRequest.count({ where: { userId: user.id, status: "Acceptée" } }),
        prisma.ticket.count({ where: { userId: user.id, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
        prisma.faultReport.count({ where: { userId: user.id, status: { in: ["a_faire", "en_cours"] } } }),
    ]);

    const statistics = [
        { label: "Mes demandes", value: requestCount, detail: "Demandes de matériel envoyées", icon: ClipboardList },
        { label: "En attente", value: pendingRequestCount, detail: "Demandes à valider", icon: Clock3 },
        { label: "Équipements acceptés", value: acceptedRequestCount, detail: "Demandes approuvées", icon: PackageCheck },
        { label: "Tickets ouverts", value: openTicketCount, detail: "Tickets nouveaux ou en cours", icon: Ticket },
        { label: "Pannes en cours", value: activeFaultCount, detail: "Déclarations à traiter", icon: TriangleAlert },
    ];

    return (<main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Dashboard utilisateur</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Bonjour {user.name}</h1>
        </div>
      </div>

      <section aria-label="Mes statistiques" className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">Mon activité</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Mes statistiques</h2>
          <p className="mt-1 text-sm text-slate-500">Suivi de vos demandes, tickets et déclarations de panne.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {statistics.map(({ label, value, detail, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="text-2xl font-bold tabular-nums text-slate-900">{numberFormat.format(value)}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-800">{label}</h3>
              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <EquipmentRequestPanel />

    </main>);
}
