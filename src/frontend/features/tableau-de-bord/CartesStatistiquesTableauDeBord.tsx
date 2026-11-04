import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const numberFormat = new Intl.NumberFormat("fr-FR");

type StatCardProps = {
    title: string;
    value: number | null;
    icon: LucideIcon;
    iconClass: string;
    detail: string;
    change?: number | null;
};

export default function DashboardStatCards({ cards }: { cards: StatCardProps[] }) {
    return (
        <section aria-label="Indicateurs clés" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {cards.map(({ title, value, icon: Icon, iconClass, detail, change }) => {
                const hasChange = change !== undefined;
                const TrendIcon = change === null || change === undefined || change === 0 ? Activity : change > 0 ? ArrowUpRight : ArrowDownRight;
                return <article key={title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                        <span className={`grid size-10 place-items-center rounded-xl ${iconClass}`}><Icon size={19} aria-hidden="true" /></span>
                        {hasChange ? <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${change === null || change === 0 ? "bg-blue-50 text-blue-700" : change > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            <TrendIcon size={13} aria-hidden="true" />{change === null ? "Nouveau" : `${change > 0 ? "+" : ""}${change} %`}
                        </span> : null}
                    </div>
                    <p className="mt-4 text-[27px] font-bold tracking-tight text-slate-900">{value === null ? "—" : numberFormat.format(value)}</p>
                    <h2 className="mt-0.5 text-[13px] font-semibold text-slate-700">{title}</h2>
                    <p className="mt-2 text-[11px] leading-4 text-slate-400">{detail}</p>
                </article>;
            })}
        </section>
    );
}
