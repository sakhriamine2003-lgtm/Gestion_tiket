"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, Package, Ticket, UserPlus, Wrench, X } from "lucide-react";
import { useState } from "react";
import { LogoutButton } from "@frontend/components/LogoutButton";

const dashboardPaths = {
    admin: "/products_frontend/Gestion_role/admin",
    responsable: "/products_frontend/Gestion_role/responsable",
    utilisateur: "/products_frontend/Gestion_role/utilisateur",
};

export function AppNavigation({ user }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dashboardPath = dashboardPaths[user.user_role];
    const links = [{ href: dashboardPath, label: "Tableau de bord", icon: LayoutDashboard }];
    const materialLinks = user.user_role === "admin"
        ? [
            { href: `${dashboardPath}/demandes-equipement`, label: "Demandes d'équipement", icon: Package },
            { href: `${dashboardPath}/declarations-pannes`, label: "Déclarations de pannes", icon: Wrench },
        ]
        : user.user_role === "utilisateur" ? [{ href: `${dashboardPath}/declarations-pannes`, label: "Mes déclarations de pannes", icon: Wrench }] : [];
    const ticketLinks = user.user_role === "admin"
        ? [{ href: `${dashboardPath}/tickets`, label: "Tickets", icon: Ticket }]
        : user.user_role === "utilisateur" ? [{ href: `${dashboardPath}/tickets`, label: "Mes tickets", icon: Ticket }] : [];
    return (<header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={dashboardPath} className="group flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"><span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 text-sm font-black tracking-tight text-white shadow-md shadow-teal-900/20 transition group-hover:-translate-y-0.5">GS</span><span className="hidden sm:block"><span className="block text-base font-bold tracking-tight text-slate-900">Gestion<span className="text-teal-700">Stock</span></span><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Espace de gestion</span></span></Link>
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 md:hidden" aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={isOpen}>{isOpen ? <X size={22}/> : <Menu size={22}/>}</button>
        <nav className="hidden items-center gap-1 lg:gap-1.5 md:flex" aria-label="Navigation principale">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-colors lg:px-3 ${active ? "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-100" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}><Icon size={16} aria-hidden="true"/>{label}</Link>;
          })}
          {materialLinks.length > 0 ? <><span className="mx-1 h-6 w-px bg-slate-200"/><div className="flex items-center gap-1">{user.user_role === "admin" ? <span className="px-2 text-[10px] font-semibold tracking-wide text-slate-400">GESTION MATÉRIEL</span> : null}{materialLinks.map(({ href, label, icon: Icon }) => <Link key={label} href={href} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${pathname === href ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><Icon size={17} aria-hidden="true"/>{label}</Link>)}</div></> : null}
          {ticketLinks.length > 0 ? <><span className="mx-1 h-6 w-px bg-slate-200"/>{user.user_role === "admin" ? <span className="px-1 text-[10px] font-semibold tracking-wide text-slate-400">TICKETS</span> : null}{ticketLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${pathname === href ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><Icon size={17} aria-hidden="true"/>{label}</Link>)}</> : null}
          {user.user_role === "admin" ? <Link href="/products_frontend/Gestion_product/AffichageProduit" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"><Package size={17} aria-hidden="true"/>Gestion du stock</Link> : null}
          {user.user_role === "admin" ? <Link href="/products_frontend/Gestion_role/admin/ajouter-utilisateur" className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"><UserPlus size={17} aria-hidden="true"/>Ajouter utilisateur</Link> : null}
          <span className="mx-1.5 h-8 w-px bg-slate-200"/><span className="hidden max-w-32 truncate text-sm font-semibold text-slate-700 xl:block" title={user.name}>{user.name}</span><LogoutButton />
        </nav>
      </div>
      {isOpen && <nav className="border-t border-slate-100 px-4 py-3 md:hidden" aria-label="Navigation mobile">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"><Icon size={18} aria-hidden="true"/>{label}</Link>)}
        {materialLinks.length > 0 ? <>{user.user_role === "admin" ? <p className="px-3 pb-1 pt-4 text-[10px] font-semibold tracking-wide text-slate-400">GESTION MATÉRIEL</p> : null}{materialLinks.map(({ href, label, icon: Icon }) => <Link key={label} href={href} onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"><Icon size={18} aria-hidden="true"/>{label}</Link>)}</> : null}
        {ticketLinks.length > 0 ? <>{user.user_role === "admin" ? <p className="px-3 pb-1 pt-4 text-[10px] font-semibold tracking-wide text-slate-400">TICKETS</p> : null}{ticketLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"><Icon size={18} aria-hidden="true"/>{label}</Link>)}</> : null}
        {user.user_role === "admin" ? <Link href="/products_frontend/Gestion_product/AffichageProduit" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"><Package size={18} aria-hidden="true"/>Gestion du stock</Link> : null}
        {user.user_role === "admin" ? <Link href="/products_frontend/Gestion_role/admin/ajouter-utilisateur" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-50"><UserPlus size={18} aria-hidden="true"/>Ajouter utilisateur</Link> : null}
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm text-slate-500">{user.name}</span><LogoutButton /></div>
      </nav>}
    </header>);
}