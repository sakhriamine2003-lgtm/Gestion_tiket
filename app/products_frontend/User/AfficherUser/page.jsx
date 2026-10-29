"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  CalendarDays,
  LoaderCircle,
  Mail,
  MessageSquare,
  Package,
  Save,
  ShieldCheck,
  Ticket,
  Trash2,
  UserRound,
  Users,
  Wrench,
  X,
  Pencil,
} from "lucide-react";
import api from "@frontend/services/api";

const roleStyles = {
  admin: "bg-violet-50 text-violet-700 ring-violet-600/20",
  responsable: "bg-sky-50 text-sky-700 ring-sky-600/20",
  utilisateur: "bg-teal-50 text-teal-700 ring-teal-600/20",
};

const roleLabels = {
  admin: "Administrateur",
  responsable: "Responsable",
  utilisateur: "Utilisateur",
};

const inputClass = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const numberFormat = new Intl.NumberFormat("fr-FR");
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

function formatDate(value) {
  return value ? dateFormat.format(new Date(value)) : "Non renseignée";
}

function getErrorMessage(error, fallback) {
  return axios.isAxiosError(error) && error.response?.data?.error
    ? error.response.data.error
    : fallback;
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h3 className="flex items-center gap-2 font-semibold text-slate-800">
          <Icon size={17} className="text-teal-700" aria-hidden="true" />
          {title}
        </h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {numberFormat.format(count)}
        </span>
      </div>
      {children}
    </section>
  );
}

export default function AfficherUsers() {
  const [users, setUsers] = useState([]);
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", user_role: "utilisateur", password: "" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const reportRequest = useRef(0);

  const closeReport = useCallback(() => {
    reportRequest.current += 1;
    setReport(null);
    setReportError("");
    setEditing(false);
    setConfirmDelete(false);
  }, []);

  useEffect(() => {
    api.get("/users/AfficherUsers")
      .then((res) => {
        setUsers(res.data);
        setErreur("");
      })
      .catch((error) => setErreur(getErrorMessage(error, "Impossible de charger la liste des utilisateurs.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!report) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !saving && !deleting) closeReport();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [report, saving, deleting, closeReport]);

  async function openReport(user) {
    const requestId = reportRequest.current + 1;
    reportRequest.current = requestId;
    setReport(user);
    setReportError("");
    setReportLoading(true);
    setEditing(false);
    setConfirmDelete(false);
    try {
      const response = await api.get(`/users/${user.id}`);
      if (reportRequest.current === requestId) setReport(response.data);
    } catch (error) {
      if (reportRequest.current === requestId) {
        setReportError(getErrorMessage(error, "Impossible de charger le rapport utilisateur."));
      }
    } finally {
      if (reportRequest.current === requestId) setReportLoading(false);
    }
  }

  function startEditing() {
    setForm({
      name: report.name,
      email: report.email,
      user_role: report.user_role,
      password: "",
    });
    setReportError("");
    setEditing(true);
  }

  async function saveUser(event) {
    event.preventDefault();
    setSaving(true);
    setReportError("");
    try {
      const response = await api.patch(`/users/${report.id}`, form);
      setReport((current) => ({ ...current, ...response.data }));
      setUsers((current) => current.map((user) => user.id === response.data.id ? { ...user, ...response.data } : user));
      setEditing(false);
    } catch (error) {
      setReportError(getErrorMessage(error, "Impossible de modifier l'utilisateur."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    setDeleting(true);
    setReportError("");
    try {
      await api.delete(`/users/${report.id}`);
      setUsers((current) => current.filter((user) => user.id !== report.id));
      closeReport();
    } catch (error) {
      setReportError(getErrorMessage(error, "Impossible de supprimer l'utilisateur."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Gestion des comptes</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Liste des utilisateurs</h1>
            <p className="mt-2 text-sm text-slate-500">Sélectionnez un compte pour consulter son rapport d’activité.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="rounded-xl bg-teal-50 p-2 text-teal-700">
              <Users size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500">Comptes</p>
              <p className="text-lg font-bold leading-tight text-slate-900">{loading ? "—" : users.length}</p>
            </div>
          </div>
        </header>

        {erreur && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{erreur}</p>
          </div>
        )}

        <section aria-label="Utilisateurs" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 sm:px-6">
            <Users size={18} className="text-slate-400" aria-hidden="true" />
            <h2 className="font-semibold text-slate-800">Tous les comptes</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin text-teal-700" aria-hidden="true" />
              Chargement des utilisateurs…
            </div>
          ) : erreur ? null : users.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="rounded-2xl bg-slate-100 p-3 text-slate-500"><UserRound size={24} aria-hidden="true" /></span>
              <p className="mt-4 font-semibold text-slate-800">Aucun utilisateur</p>
              <p className="mt-1 text-sm text-slate-500">Les comptes apparaîtront ici lorsqu’ils seront créés.</p>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(150px,0.7fr)] gap-4 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
                <span>Nom</span><span>Adresse e-mail</span><span>Rôle</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {users.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => openReport(user)}
                      aria-label={`Afficher le rapport de ${user.name}`}
                      className="grid w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-teal-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(150px,0.7fr)] sm:items-center sm:gap-4 sm:px-6"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold uppercase text-teal-800 ring-1 ring-teal-700/10">
                          {user.name?.trim().charAt(0) || <UserRound size={18} aria-hidden="true" />}
                        </span>
                        <span className="truncate font-semibold text-slate-900">{user.name}</span>
                      </span>
                      <span className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
                        <Mail size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="truncate">{user.email}</span>
                      </span>
                      <span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleStyles[user.user_role] || "bg-slate-100 text-slate-700 ring-slate-600/20"}`}>
                          <ShieldCheck size={14} aria-hidden="true" />
                          {roleLabels[user.user_role] || user.user_role}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {report && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving && !deleting) closeReport();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-report-title"
            className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-slate-50 shadow-2xl sm:rounded-3xl"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-lg font-bold uppercase text-teal-800">
                  {report.name?.trim().charAt(0) || <UserRound size={22} aria-hidden="true" />}
                </span>
                <div className="min-w-0">
                  <h2 id="user-report-title" className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                    Rapport utilisateur
                  </h2>
                  <p className="truncate text-sm text-slate-500">{report.name} · {report.email}</p>
                </div>
              </div>
              <button type="button" onClick={closeReport} aria-label="Fermer le rapport" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <div className="space-y-5 p-4 sm:p-7">
              {reportError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <p>{reportError}</p>
                </div>
              )}

              {reportLoading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-sm text-slate-500">
                  <LoaderCircle size={20} className="animate-spin text-teal-700" aria-hidden="true" />
                  Chargement du rapport…
                </div>
              ) : (
                <>
                  {editing ? (
                    <form onSubmit={saveUser} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                      <h3 className="font-semibold text-slate-900">Modifier le compte</h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-medium text-slate-700">Nom
                          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} />
                        </label>
                        <label className="text-sm font-medium text-slate-700">Adresse e-mail
                          <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} />
                        </label>
                        <label className="text-sm font-medium text-slate-700">Rôle
                          <select value={form.user_role} onChange={(event) => setForm({ ...form, user_role: event.target.value })} className={inputClass}>
                            <option value="utilisateur">Utilisateur</option>
                            <option value="responsable">Responsable</option>
                            <option value="admin">Administrateur</option>
                          </select>
                        </label>
                        <label className="text-sm font-medium text-slate-700">Nouveau mot de passe <span className="font-normal text-slate-400">(facultatif)</span>
                          <input type="password" minLength={6} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={inputClass} />
                        </label>
                      </div>
                      <div className="mt-5 flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={() => setEditing(false)} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Annuler</button>
                        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
                          {saving ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                          {saving ? "Enregistrement…" : "Enregistrer"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rôle</p>
                          <p className="mt-2 font-semibold text-slate-900">{roleLabels[report.user_role] || report.user_role}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Matériel attribué</p>
                          <p className="mt-2 font-semibold text-slate-900">{numberFormat.format(report.equipmentCount || 0)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><CalendarDays size={14} aria-hidden="true" /> Compte créé</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(report.createdAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Dernière activité</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(report.lastSeenAt)}</p>
                        </div>
                      </div>

                      <Section icon={Package} title="Demandes d’équipement" count={report.equipmentRequests?.length || 0}>
                        {report.equipmentRequests?.length ? (
                          <ul className="divide-y divide-slate-100">
                            {report.equipmentRequests.map((request) => (
                              <li key={request.id} className="space-y-1 px-4 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-semibold text-slate-900">{request.product.marque} <span className="font-normal text-slate-500">· {request.product.bureau}</span></p>
                                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{request.status}</span>
                                </div>
                                <p className="text-xs text-slate-500">Demandé le {formatDate(request.createdAt)}{request.reason ? ` · ${request.reason}` : ""}</p>
                              </li>
                            ))}
                          </ul>
                        ) : <p className="px-4 py-5 text-sm text-slate-500">Aucune demande d’équipement.</p>}
                      </Section>

                      <Section icon={Ticket} title="Tickets créés" count={report.tickets?.length || 0}>
                        {report.tickets?.length ? (
                          <ul className="divide-y divide-slate-100">
                            {report.tickets.map((ticket) => (
                              <li key={ticket.id} className="space-y-3 px-4 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <p className="font-semibold text-slate-900">#{ticket.id} · {ticket.title}</p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{ticket.description}</p>
                                  </div>
                                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">{ticket.status}</span>
                                </div>
                                <p className="text-xs text-slate-500">Créé le {formatDate(ticket.createdAt)} · Mis à jour le {formatDate(ticket.updatedAt)}</p>
                                {ticket.attachments?.length > 0 && <p className="text-xs text-slate-500">Pièces jointes : {ticket.attachments.map((file) => file.fileName).join(", ")}</p>}
                                {ticket.messages?.length > 0 && (
                                  <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"><MessageSquare size={14} aria-hidden="true" /> Conversation</p>
                                    {ticket.messages.map((message, index) => (
                                      <div key={`${ticket.id}-${index}`} className="border-l-2 border-teal-200 pl-3">
                                        <p className="text-xs font-semibold text-slate-600">{message.senderRole} · {formatDate(message.createdAt)}</p>
                                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{message.content}</p>
                                        {message.attachments?.length > 0 && <p className="mt-1 text-xs text-slate-500">Pièces jointes : {message.attachments.map((file) => file.fileName).join(", ")}</p>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : <p className="px-4 py-5 text-sm text-slate-500">Aucun ticket créé.</p>}
                      </Section>

                      <Section icon={Wrench} title="Déclarations de panne" count={report.faultReports?.length || 0}>
                        {report.faultReports?.length ? (
                          <ul className="divide-y divide-slate-100">
                            {report.faultReports.map((fault) => (
                              <li key={fault.id} className="space-y-1 px-4 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-semibold text-slate-900">{fault.product.marque} <span className="font-normal text-slate-500">· {fault.product.bureau}</span></p>
                                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800">{fault.status}</span>
                                </div>
                                <p className="whitespace-pre-wrap text-sm text-slate-600">{fault.description}</p>
                                <p className="text-xs text-slate-500">Déclaré le {formatDate(fault.createdAt)} · Mis à jour le {formatDate(fault.updatedAt)}</p>
                              </li>
                            ))}
                          </ul>
                        ) : <p className="px-4 py-5 text-sm text-slate-500">Aucune déclaration de panne.</p>}
                      </Section>
                    </>
                  )}

                  {!editing && (
                    <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      {confirmDelete ? (
                        <div className="flex flex-1 flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-medium text-rose-800">Supprimer ce compte et ses données associées ? Cette action est définitive.</p>
                          <div className="flex shrink-0 gap-2">
                            <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-rose-100">Annuler</button>
                            <button type="button" onClick={deleteUser} disabled={deleting} className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60">
                              {deleting ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Trash2 size={15} aria-hidden="true" />}
                              {deleting ? "Suppression…" : "Confirmer"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                            <Trash2 size={16} aria-hidden="true" /> Supprimer
                          </button>
                          <button type="button" onClick={startEditing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">
                            <Pencil size={16} aria-hidden="true" /> Modifier
                          </button>
                        </>
                      )}
                    </footer>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
