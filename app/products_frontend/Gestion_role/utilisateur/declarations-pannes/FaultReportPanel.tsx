"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/axios";

type Equipment = { id: number; name: string; type: string };
type EquipmentRequest = { status: string };
type FaultReportStatus = "a_faire" | "en_cours" | "termine";
type FaultReport = {
  id: number;
  description: string;
  status: FaultReportStatus;
  createdAt: string;
  product: { id: number; marque: string; bureau: string };
};

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

export default function FaultReportPanel() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [reports, setReports] = useState<FaultReport[]>([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [productId, setProductId] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [equipmentResponse, reportsResponse, requestsResponse] = await Promise.all([
          api.get<Equipment[]>("/equipment?type=panne"),
          api.get<FaultReport[]>("/fault-reports"),
          api.get<EquipmentRequest[]>("/equipment-requests"),
        ]);
        setEquipment(equipmentResponse.data);
        setReports(reportsResponse.data);
        setHasPendingRequest(requestsResponse.data.some((request) => request.status === "En attente"));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Impossible de charger les déclarations.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productId || !description.trim()) return;

    setIsSubmitting(true);
    setMessage("");
    try {
      const reportData = {
        productId: Number(productId),
        description: description.trim(),
      };
      if (editingId !== null) {
        const response = await api.patch<FaultReport>(`/fault-reports/${editingId}`, reportData);
        setReports((current) => current.map((report) => report.id === editingId ? response.data : report));
        setEditingId(null);
        setMessage("Votre déclaration a été modifiée.");
      } else {
        const response = await api.post<FaultReport>("/fault-reports", reportData);
        setReports((current) => [response.data, ...current]);
        setMessage("Votre déclaration a été enregistrée.");
      }
      setProductId("");
      setDescription("");
    } catch (error) {
      const apiError = axios.isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined;
      const fallbackMessage = editingId === null
        ? "Impossible d'enregistrer la déclaration."
        : "Impossible de modifier la déclaration.";
      setMessage(apiError || (error instanceof Error ? error.message : fallbackMessage));
    } finally {
      setIsSubmitting(false);
    }
  }

  function editReport(report: FaultReport) {
    setEditingId(report.id);
    setProductId(String(report.product.id));
    setDescription(report.description);
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setProductId("");
    setDescription("");
  }

  async function deleteReport(id: number) {
    if (!window.confirm("Supprimer définitivement cette déclaration de panne ?")) return;

    setIsDeleting(id);
    setMessage("");
    try {
      await api.delete(`/fault-reports/${id}`);
      setReports((current) => current.filter((report) => report.id !== id));
      if (editingId === id) cancelEdit();
      setMessage("Votre déclaration a été supprimée.");
    } catch (error) {
      const apiError = axios.isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined;
      setMessage(apiError || (error instanceof Error ? error.message : "Impossible de supprimer la déclaration."));
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">{editingId === null ? "Déclarer une panne" : "Modifier la déclaration"}</h2>
        <form onSubmit={submitReport} className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
          <label className="block text-sm font-medium text-slate-700">
            Équipement
            <select
              required
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Choisir un équipement</option>
              {equipment.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.type})</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Description de la panne
            <textarea
              required
              rows={2}
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1.5 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="PC ne démarre plus"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting || !equipment.length}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Envoi..." : editingId === null ? "Déclarer" : "Enregistrer"}
          </button>
          {editingId !== null ? (
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isSubmitting}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:col-start-3"
            >
              Annuler
            </button>
          ) : null}
        </form>
        {equipment.length === 0 && !isLoading ? (
          <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900" role="status">
            {hasPendingRequest
              ? "Votre demande est en attente de validation. Aucun équipement n’est disponible pour déclarer une panne pour le moment."
              : "Aucun équipement accepté n’est disponible pour déclarer une panne pour le moment."}
          </p>
        ) : null}
        {message ? <p className="mt-3 text-sm text-slate-600" role="status">{message}</p> : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Historique</h2>
        {isLoading ? <p className="mt-4 text-sm text-slate-500">Chargement...</p> : null}
        {!isLoading && reports.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aucune déclaration pour le moment.</p> : null}
        <ul className="mt-4 divide-y divide-slate-100">
          {reports.map((report) => (
            <li key={report.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{report.product.marque} ({report.product.bureau})</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{report.description}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(report.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStyles[report.status]}`}>
                  {labels[report.status]}
                </span>
                <button
                  type="button"
                  onClick={() => editReport(report)}
                  disabled={isSubmitting || isDeleting !== null}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => void deleteReport(report.id)}
                  disabled={isSubmitting || isDeleting !== null}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting === report.id ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}