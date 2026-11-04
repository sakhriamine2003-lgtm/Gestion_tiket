"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Boxes,
    ClipboardList,
    LayoutDashboard,
    Menu,
    Ticket,
    UserPlus,
    Users,
    Wrench,
    X,
} from "lucide-react";
import { useState } from "react";
import { LogoutButton } from "@frontend/components/LogoutButton";

const dashboardPaths = {
    admin: "/products_frontend/Gestion_role/admin",
    responsable: "/products_frontend/Gestion_role/responsable",
    utilisateur: "/products_frontend/Gestion_role/utilisateur",
};

function getNavigationLinks(role, dashboardPath) {
    const links = [{ href: dashboardPath, label: "Tableau de bord", icon: LayoutDashboard }];

    if (role === "admin") {
        links.push(
            { href: `${dashboardPath}/tickets`, label: "Tickets", icon: Ticket },
            { href: `${dashboardPath}/demandes-equipement`, label: "Demandes d’équipement", icon: ClipboardList },
            { href: `${dashboardPath}/declarations-pannes`, label: "Déclarations de pannes", icon: Wrench },
            { href: "/products_frontend/Gestion_product/AffichageProduit", label: "Équipements & stock", icon: Boxes },
            { href: "/products_frontend/User/AfficherUser", label: "Utilisateurs", icon: Users },
            { href: "/products_frontend/Gestion_role/admin/ajouter-utilisateur", label: "Ajouter un utilisateur", icon: UserPlus },
        );
    } else if (role === "utilisateur") {
        links.push(
            { href: `${dashboardPath}/tickets`, label: "Mes tickets", icon: Ticket },
            { href: `${dashboardPath}/declarations-pannes`, label: "Mes déclarations de pannes", icon: Wrench },
        );
    }

    return links;
}

export function AppNavigation({ user }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dashboardPath = dashboardPaths[user.user_role];

    if (!dashboardPath || (user.user_role === "admin" && pathname === dashboardPath)) return null;

    const roleLabel = user.user_role === "admin"
        ? "Administrateur"
        : user.user_role === "responsable" ? "Responsable" : "Utilisateur";
    const links = getNavigationLinks(user.user_role, dashboardPath);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={isOpen}
                className="fixed left-4 top-4 z-[60] grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 lg:hidden"
            >
                {isOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            {isOpen ? (
                <button
                    type="button"
                    aria-label="Fermer le menu"
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
                />
            ) : null}
            <aside className={`fixed inset-y-0 left-0 z-50 flex w-[270px] shrink-0 flex-col bg-[#101b36] text-slate-300 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex h-[82px] items-center border-b border-white/[0.08] px-6">
                    <Link href={dashboardPath} onClick={() => setIsOpen(false)} className="flex items-center gap-3">
                        <Image
                            src="/sofimed-logo.png"
                            alt="SOFIMED — La puissance derrière votre process"
                            width={483}
                            height={128}
                            priority
                            className="h-auto max-h-14 w-[210px] object-contain"
                        />
                    </Link>
                </div>
                <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-3 py-6">
                    <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Espace de travail</p>
                    <ul className="space-y-1">
                        {links.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href || (href !== dashboardPath && pathname.startsWith(`${href}/`));
                            return (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        onClick={() => setIsOpen(false)}
                                        aria-current={active ? "page" : undefined}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-950/25" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"}`}
                                    >
                                        <Icon size={17} className="shrink-0" aria-hidden="true" />
                                        <span className="truncate">{label}</span>
                                        {active ? <span className="ml-auto size-1.5 rounded-full bg-white" /> : null}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="mx-3 my-6 border-t border-white/[0.08]" />
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                        <p className="text-xs font-semibold text-slate-200">Espace {roleLabel.toLowerCase()}</p>
                        <p className="mt-1.5 text-[11px] leading-5 text-slate-400">Vos accès et votre navigation sont adaptés à votre rôle.</p>
                    </div>
                </nav>
                <div className="border-t border-white/[0.08] p-4">
                    <div className="mb-3 flex min-w-0 items-center gap-3 px-1">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-200">
                            {user.name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase()}
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold text-white">{user.name}</span>
                            <span className="mt-0.5 block text-[10px] text-slate-400">{roleLabel}</span>
                        </span>
                    </div>
                    <LogoutButton className="w-full justify-center border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10 hover:text-white" />
                </div>
            </aside>
        </>
    );
}
