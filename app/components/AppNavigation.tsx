"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, Package, X } from "lucide-react";
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
    ...(user.user_role === "admin"
      ? [{ href: "/products_frontend/Gestion_product/AffichageProduit", label: "Gestion du stock", icon: Package }]
      : []),
  ];

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
          <span className="mx-2 h-6 w-px bg-slate-200" />
          <span className="text-sm text-slate-500">{user.name}</span>
          <LogoutButton />
        </nav>
      </div>

      {isOpen && <nav className="border-t border-slate-100 px-4 py-3 md:hidden" aria-label="Navigation mobile">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"><Icon size={18} aria-hidden="true" />{label}</Link>)}
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm text-slate-500">{user.name}</span><LogoutButton /></div>
      </nav>}
    </header>
  );
}