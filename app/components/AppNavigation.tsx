"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, Package, Ticket, Wrench, X } from "lucide-react";
import { useState } from "react";
import type { UserRole } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

const dashboardPaths: Record<UserRole, string> = {
  admin: "/products_frontend/Gestion_role/admin",
  responsable: "/products_frontend/Gestion_role/responsable",
  utilisateur: "/products_frontend/Gestion_role/utilisateur",
};

export function AppNavigation({ user }: { user: { name: string; user_role: UserRole } }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dashboardPath = dashboardPaths[user.user_role];

  const links = [
    { href: dashboardPath, label: "Tableau de bord", icon: LayoutDashboard },
  ];
  const materialLinks = user.user_role === "admin"
    ? [
        { href: `${dashboardPath}/demandes-equipement`, label: "Demandes d'équipement", icon: Package },
        { href: `${dashboardPath}/declarations-pannes`, label: "Déclarations de pannes", icon: Wrench },
      ]
    : user.user_role === "utilisateur"
      ? [{ href: `${dashboardPath}/declarations-pannes`, label: "Mes déclarations de pannes", icon: Wrench }]
      : [];
  const ticketLinks = user.user_role === "admin"
    ? [{ href: `${dashboardPath}/tickets`, label: "Tickets", icon: Ticket }]
    : user.user_role === "utilisateur"
      ? [{ href: `${dashboardPath}/tickets`, label: "Mes tickets", icon: Ticket }]
      : [];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
        <Link href={dashboardPath} className="text-lg font-bold tracking-tight text-slate-900">
          Gestion<span className="text-teal-600">Stock</span>
        </Link>

        <button type="button" onClick={() => setIsOpen(!isOpen)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}>
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Navigation principale">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return <Link key={href} href={href} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><Icon size={17} aria-hidden="true" />{label}</Link>;
          })}
          {materialLinks.length > 0 ? (
            <>
              <span className="mx-1 h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-1">
                {user.user_role === "admin" ? <span className="px-2 text-[10px] font-semibold tracking-wide text-slate-400">GESTION MATÉRIEL</span> : null}
                {materialLinks.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return <Link key={label} href={href} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><Icon size={17} aria-hidden="true" />{label}</Link>;
                })}
              </div>
            </>
          ) : null}
          {ticketLinks.length > 0 ? (
            <>
              <span className="mx-1 h-6 w-px bg-slate-200" />
              {user.user_role === "admin" ? <span className="px-1 text-[10px] font-semibold tracking-wide text-slate-400">TICKETS</span> : null}
              {ticketLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return <Link key={href} href={href} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><Icon size={17} aria-hidden="true" />{label}</Link>;
              })}
            </>
          ) : null}
          {user.user_role === "admin" ? (
            <Link href="/products_frontend/Gestion_product/AffichageProduit" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <Package size={17} aria-hidden="true" />Gestion du stock
            </Link>
          ) : null}
          <span className="mx-2 h-6 w-px bg-slate-200" />
          <span className="text-sm text-slate-500">{user.name}</span>
          <LogoutButton />
        </nav>
      </div>

      {isOpen && <nav className="border-t border-slate-100 px-4 py-3 md:hidden" aria-label="Navigation mobile">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"><Icon size={18} aria-hidden="true" />{label}</Link>)}
        {materialLinks.length > 0 ? (
          <>
            {user.user_role === "admin" ? <p className="px-3 pb-1 pt-4 text-[10px] font-semibold tracking-wide text-slate-400">GESTION MATÉRIEL</p> : null}
            {materialLinks.map(({ href, label, icon: Icon }) => <Link key={label} href={href} onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"><Icon size={18} aria-hidden="true" />{label}</Link>)}
          </>
        ) : null}
        {ticketLinks.length > 0 ? (
          <>
            {user.user_role === "admin" ? <p className="px-3 pb-1 pt-4 text-[10px] font-semibold tracking-wide text-slate-400">TICKETS</p> : null}
            {ticketLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"><Icon size={18} aria-hidden="true" />{label}</Link>)}
          </>
        ) : null}
        {user.user_role === "admin" ? <Link href="/products_frontend/Gestion_product/AffichageProduit" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"><Package size={18} aria-hidden="true" />Gestion du stock</Link> : null}
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm text-slate-500">{user.name}</span><LogoutButton /></div>
      </nav>}
    </header>
  );
}