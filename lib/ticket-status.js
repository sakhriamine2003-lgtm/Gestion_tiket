// Module partagé (serveur et client) : statuts de ticket et transitions autorisées.
// Les anciens tickets "OPEN" et "CLOSED" restent valides sans migration.
export const TICKET_STATUS = {
    OPEN: "OPEN",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
};

export const TICKET_STATUS_LABELS = {
    OPEN: "Ouvert",
    IN_PROGRESS: "En cours",
    RESOLVED: "Traité",
    CLOSED: "Fermé",
};

export const TICKET_STATUS_STYLES = {
    OPEN: { badge: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
    IN_PROGRESS: { badge: "bg-orange-50 text-orange-700 ring-orange-200", dot: "bg-orange-500" },
    RESOLVED: { badge: "bg-green-50 text-green-700 ring-green-200", dot: "bg-green-500" },
    CLOSED: { badge: "bg-slate-100 text-slate-600 ring-slate-300", dot: "bg-slate-400" },
};

// Workflow : Ouvert → En cours → Traité → Fermé. Chaque transition n'est permise qu'à un seul rôle.
const TRANSITIONS = [
    { from: TICKET_STATUS.OPEN, to: TICKET_STATUS.IN_PROGRESS, role: "admin" },
    { from: TICKET_STATUS.IN_PROGRESS, to: TICKET_STATUS.RESOLVED, role: "admin" },
    { from: TICKET_STATUS.RESOLVED, to: TICKET_STATUS.CLOSED, role: "utilisateur" },
];

export function isTicketStatus(value) {
    return typeof value === "string" && Object.hasOwn(TICKET_STATUS, value);
}

export function canTransition(role, from, to) {
    return TRANSITIONS.some((rule) => rule.role === role && rule.from === from && rule.to === to);
}

export function nextStatusFor(role, from) {
    return TRANSITIONS.find((rule) => rule.role === role && rule.from === from)?.to ?? null;
}
