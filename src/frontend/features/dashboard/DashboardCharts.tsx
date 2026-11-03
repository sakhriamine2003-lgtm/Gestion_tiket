"use client";

import { useMemo, useState } from "react";

const numberFormat = new Intl.NumberFormat("fr-FR");
const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" });

type TicketStatusSlice = { status: string; label: string; color: string; count: number };
type DailyTicketCount = { day: string; count: number };

export function DonutChart({ statuses }: { statuses: TicketStatusSlice[] }) {
    const total = statuses.reduce((sum, item) => sum + item.count, 0);
    const segments = statuses.filter((item) => item.count > 0).map((item, index, visible) => ({
        ...item,
        length: (item.count / total) * 100,
        offset: visible.slice(0, index).reduce((sum, previous) => sum + (previous.count / total) * 100, 0),
    }));

    return (
        <div className="grid items-center gap-6 sm:grid-cols-[160px_1fr]">
            <div className="relative mx-auto size-40">
                <svg viewBox="0 0 42 42" className="size-full -rotate-90" role="img" aria-label={`Répartition de ${numberFormat.format(total)} tickets`}>
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="5" />
                    {segments.map((item) => <circle key={item.status} cx="21" cy="21" r="15.915" fill="transparent" stroke={item.color} strokeWidth="5" strokeDasharray={`${item.length} ${100 - item.length}`} strokeDashoffset={-item.offset} />)}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold text-slate-900">{numberFormat.format(total)}</span><span className="text-[10px] font-medium text-slate-400">tickets</span></div>
            </div>
            <ul className="space-y-3">{statuses.map((item) => <li key={item.status} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-slate-600"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span><span className="font-semibold tabular-nums text-slate-800">{numberFormat.format(item.count)}</span></li>)}</ul>
        </div>
    );
}

export function TicketTrendChart({ dailyCounts, endDay }: { dailyCounts: DailyTicketCount[]; endDay: string }) {
    const [period, setPeriod] = useState(30);
    const points = useMemo(() => {
        const [year, month, day] = endDay.split("-").map(Number);
        const endDate = new Date(Date.UTC(year, month - 1, day));
        const counts = new Map(dailyCounts.map((item) => [item.day, item.count]));
        return Array.from({ length: period }, (_, index) => {
            const date = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate() - period + index + 1));
            const key = date.toISOString().slice(0, 10);
            return { date, count: counts.get(key) ?? 0 };
        });
    }, [dailyCounts, endDay, period]);
    const max = Math.max(1, ...points.map((point) => point.count));
    const coords = points.map((point, index) => ({ x: 12 + (index / Math.max(1, points.length - 1)) * 576, y: 180 - (point.count / max) * 150 }));
    const line = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const area = `${line} L 588 190 L 12 190 Z`;

    return (
        <>
            <div className="mb-4 flex items-center justify-end gap-1 rounded-lg bg-slate-50 p-1" aria-label="Période du graphique">
                {[7, 30, 90].map((days) => <button key={days} type="button" onClick={() => setPeriod(days)} aria-pressed={period === days} className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition ${period === days ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{days} j</button>)}
            </div>
            <svg viewBox="0 0 600 220" className="h-[205px] w-full overflow-visible" role="img" aria-label={`Tickets créés par jour sur les ${period} derniers jours`}>
                {[30, 80, 130, 180].map((y) => <line key={y} x1="12" x2="588" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 5" />)}
                <path d={area} fill="url(#ticket-area)" /><path d={line} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <defs><linearGradient id="ticket-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity=".2" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
                {coords.length > 1 ? <><text x="12" y="211" fill="#94a3b8" fontSize="10">{shortDate.format(points[0].date)}</text><text x="588" y="211" fill="#94a3b8" fontSize="10" textAnchor="end">{shortDate.format(points[points.length - 1].date)}</text></> : null}
            </svg>
            <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-500"><span className="size-2 rounded-full bg-blue-500" />Tickets créés par jour</p>
        </>
    );
}
