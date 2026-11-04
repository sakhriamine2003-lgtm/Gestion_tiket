import Link from "next/link";
import { ArrowUpRight, CalendarDays, CircleHelp, Package, Ticket, Users } from "lucide-react";

const dashboardPath = "/Gestion_produits/Gestion_roles/administrateur";

export default function DashboardQuickActions() {
    return (
        <section aria-label="Actions rapides" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.035)] sm:p-6">
            <div className="mb-4"><p className="text-[11px] font-medium text-slate-400">Raccourcis</p><h2 className="mt-1 text-sm font-bold text-slate-900">Actions rapides</h2></div>
            <div className="flex flex-wrap gap-2.5">
                <Link href={`${dashboardPath}/tickets`} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"><Ticket size={15} />Gérer les tickets<ArrowUpRight size={13} /></Link>
                <span title="La planification d’interventions n’est pas disponible"><span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-400"><CalendarDays size={15} />Planifier intervention</span></span>
                <Link href="/Gestion_produits/Gestion_produit/AjouterProduit" className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"><Package size={15} />Ajouter équipement<ArrowUpRight size={13} /></Link>
                <Link href="/Gestion_produits/Gestion_roles/administrateur/ajouter-utilisateur" className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"><Users size={15} />Ajouter un utilisateur<ArrowUpRight size={13} /></Link>
                <span title="La commande de pièces n’est pas disponible"><span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-400"><Package size={15} />Commander pièce</span></span>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400"><CircleHelp size={12} />Les actions indisponibles ne disposent pas de page ou de module existant.</p>
        </section>
    );
}
