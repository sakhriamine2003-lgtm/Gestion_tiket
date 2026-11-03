"use client";

import Link from "next/link";
import {
    BookOpen,
    Boxes,
    Building2,
    CalendarDays,
    ClipboardList,
    FileBarChart,
    Headset,
    LayoutDashboard,
    Package,
    Settings2,
    ShieldCheck,
    Ticket,
    Users,
    Wrench,
    X,
} from "lucide-react";
import { LogoutButton } from "@frontend/components/LogoutButton";

type DashboardUser = { name: string };
type NavigationItem = {
    label: string;
    href?: string;
    icon: typeof LayoutDashboard;
};

const dashboardPath = "/products_frontend/Gestion_role/admin";
const links: NavigationItem[] = [
    { label: "Tableau de bord", href: dashboardPath, icon: LayoutDashboard },
    { label: "Tickets", href: `${dashboardPath}/tickets`, icon: Ticket },
    { label: "Demandes d’équipement", href: `${dashboardPath}/demandes-equipement`, icon: ClipboardList },
    { label: "Déclarations de pannes", href: `${dashboardPath}/declarations-pannes`, icon: Wrench },
    { label: "Interventions planifiées", icon: CalendarDays },
    { label: "Équipements", href: "/products_frontend/Gestion_product/AffichageProduit", icon: Boxes },
    { label: "Clients", href: "/products_frontend/User/AfficherUser", icon: Users },
    { label: "Techniciens", icon: Headset },
    { label: "Contrats", icon: Building2 },
    { label: "Pièces & stock", href: "/products_frontend/Gestion_product/AffichageProduit", icon: Package },
    { label: "Rapports", icon: FileBarChart },
    { label: "Base de connaissances", icon: BookOpen },
    { label: "Paramètres", icon: Settings2 },
];

function initials(name: string) {
    return name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

export default function DashboardSidebar({
    user,
    mobileOpen,
    onClose,
}: {
    user: DashboardUser;
    mobileOpen: boolean;
    onClose: () => void;
}) {
    return (
        <>
            {mobileOpen ? <button type="button" aria-label="Fermer le menu" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" /> : null}
            <aside className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#101b36] text-slate-300 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex h-[82px] items-center justify-between border-b border-white/[0.08] px-6">
                    <Link href={dashboardPath} onClick={onClose} className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-white text-[11px] font-black tracking-tight text-[#12254a]">SM</span>
                        <span><span className="block text-[17px] font-bold tracking-[0.12em] text-white">SOFIMED</span><span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">Gestion SAV</span></span>
                    </Link>
                    <button type="button" onClick={onClose} aria-label="Fermer le menu" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"><X size={18} /></button>
                </div>
                <nav aria-label="Navigation administrateur" className="flex-1 overflow-y-auto px-3 py-6">
                    <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Espace de travail</p>
                    <ul className="space-y-1">
                        {links.map(({ label, href, icon: Icon }) => {
                            const active = label === "Tableau de bord";
                            return <li key={label}>
                                {href ? <Link href={href} onClick={onClose} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-950/25" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"}`}>
                                    <Icon size={17} className="shrink-0" aria-hidden="true" /><span className="truncate">{label}</span>{active ? <span className="ml-auto size-1.5 rounded-full bg-white" /> : null}
                                </Link> : <span aria-disabled="true" title="Fonctionnalité non disponible dans les modules actuels" className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500">
                                    <Icon size={17} className="shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{label}</span><span className="text-[9px] font-semibold uppercase text-slate-600">Indisponible</span>
                                </span>}
                            </li>;
                        })}
                    </ul>
                    <div className="mx-3 my-6 border-t border-white/[0.08]" />
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-slate-200"><ShieldCheck size={15} className="text-emerald-400" />Espace sécurisé</div><p className="mt-2 text-[11px] leading-5 text-slate-400">Accès réservé à l’administration SOFIMED.</p></div>
                </nav>
                <div className="border-t border-white/[0.08] p-4">
                    <div className="mb-3 flex min-w-0 items-center gap-3 px-1"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-200">{initials(user.name)}</span><span className="min-w-0"><span className="block truncate text-xs font-semibold text-white">{user.name}</span><span className="mt-0.5 block text-[10px] text-slate-400">Administrateur</span></span></div>
                    <LogoutButton className="w-full justify-center border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10 hover:text-white" />
                </div>
            </aside>
        </>
    );
}
