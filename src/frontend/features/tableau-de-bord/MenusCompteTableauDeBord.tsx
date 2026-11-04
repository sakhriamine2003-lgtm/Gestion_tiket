"use client";

import { useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { LogoutButton } from "@frontend/components/BoutonDeconnexion";

type DashboardUser = { name: string; email: string };
type Notification = { id: number; message: string; createdAt: Date | string };

const numberFormat = new Intl.NumberFormat("fr-FR");
const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
});

function initials(name: string) {
    return name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

export function NotificationsMenu({ count, notifications }: { count: number; notifications: Notification[] }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Notifications enregistrées : ${count}`} className="relative grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800">
                <Bell size={18} />
                {count > 0 ? <span className="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-bold text-white">{count > 99 ? "99+" : count}</span> : null}
            </button>
            {open ? <div className="absolute right-0 top-12 z-30 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3"><p className="text-sm font-semibold text-slate-900">Notifications enregistrées</p><p className="mt-0.5 text-[11px] text-slate-400">{numberFormat.format(count)} au total</p></div>
                {notifications.length ? <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">{notifications.map((item) => <li key={item.id} className="px-4 py-3"><p className="text-xs leading-5 text-slate-700">{item.message}</p><time className="mt-1 block text-[10px] text-slate-400">{dateTimeFormat.format(new Date(item.createdAt))}</time></li>)}</ul> : <p className="px-4 py-7 text-center text-xs text-slate-500">Aucune notification enregistrée.</p>}
            </div> : null}
        </div>
    );
}

export function ProfileMenu({ user }: { user: DashboardUser }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-slate-100">
                <span className="grid size-9 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">{initials(user.name)}</span>
                <span className="hidden min-w-0 sm:block"><span className="block max-w-36 truncate text-xs font-semibold text-slate-800">{user.name}</span><span className="mt-0.5 block text-[10px] text-slate-400">Administrateur</span></span>
                <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
            </button>
            {open ? <div className="absolute right-0 top-12 z-30 w-60 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="border-b border-slate-100 px-2 pb-3"><p className="truncate text-sm font-semibold text-slate-800">{user.name}</p><p className="mt-1 truncate text-xs text-slate-500">{user.email}</p></div>
                <div className="pt-3"><LogoutButton /></div>
            </div> : null}
        </div>
    );
}
