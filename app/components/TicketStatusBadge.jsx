import { TICKET_STATUS, TICKET_STATUS_LABELS, TICKET_STATUS_STYLES } from "@/lib/ticket-status";

export default function TicketStatusBadge({ status }) {
    const key = Object.hasOwn(TICKET_STATUS, status) ? status : TICKET_STATUS.OPEN;
    const style = TICKET_STATUS_STYLES[key];
    return (<span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${style.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`}/>
      {TICKET_STATUS_LABELS[key]}
    </span>);
}
