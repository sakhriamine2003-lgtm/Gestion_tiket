"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

type FaultReportStatus = "a_faire" | "en_cours" | "termine";
type FaultReport = {
  id: number;
  description: string;
  status: FaultReportStatus;
  createdAt: string;
  emailSent?: boolean;
  user: { name: string; email: string };
  product: { marque: string; bureau: string };
};

const statuses: FaultReportStatus[] = ["a_faire", "en_cours", "termine"];
const labels: Record<FaultReportStatus, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
};
const badgeStyles: Record<FaultReportStatus, string> = {
  a_faire: "bg-amber-100 text-amber-800",
  en_cours: "bg-sky-100 text-sky-800",
  termine: "bg-emerald-100 text-emerald-800",
};

export default function FaultReportsPanel() {
  const [reports, setReports] = useState<FaultReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        const response = await api.get<FaultReport[]>("/fault-reports");
        setReports(response.data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Impossible de charger les déclarations.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadReports();
  }, []);

  async function changeStatus(id: number, status: FaultReportStatus) {
    setUpdatingId(id);
    setMessage("");
    try {
      const response = await api.patch<FaultReport>(`/fault-reports/${id}`, { status });
      setReports((current) => current.map((report) => report.id === id ? response.data : report));
      setMessage(response.data.emailSent === false
        ? "Statut mis à jour, mais l'email n'a pas pu être envoyé. Vérifiez la configuration SMTP."
        : "Statut mis à jour et email envoyé.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de modifier le statut.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      {isLoading ? <p className="text-sm text-slate-500">Chargement...</p> : null}
      {!isLoading && reports.length === 0 ? <p className="text-sm text-slate-500">Aucune déclaration de panne.</p> : null}
      {reports.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="px-3 py-3 font-medium">Utilisateur</th>
                <th className="px-3 py-3 font-medium">Équipement</th>
                <th className="px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Statut</th>
                <th className="px-3 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="px-3 py-4">
                    <p className="font-medium text-slate-900">{report.user.name}</p>
                    <p className="text-xs text-slate-500">{report.user.email}</p>
                  </td>
                  <td className="px-3 py-4 text-slate-700">{report.product.marque} ({report.product.bureau})</td>
                  <td className="max-w-sm whitespace-normal px-3 py-4 text-slate-700">{report.description}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-slate-600">{new Date(report.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStyles[report.status]}`}>
                      {labels[report.status]}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <label className="sr-only" htmlFor={`status-${report.id}`}>Modifier le statut</label>
                    <select
                      id={`status-${report.id}`}
                      value={report.status}
                      disabled={updatingId === report.id}
                      onChange={(event) => void changeStatus(report.id, event.target.value as FaultReportStatus)}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 disabled:opacity-60"
                    >
                      {statuses.map((status) => <option key={status} value={status}>{labels[status]}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {message ? <p className="mt-4 text-sm text-slate-600" role="status">{message}</p> : null}
    </section>
  );
}