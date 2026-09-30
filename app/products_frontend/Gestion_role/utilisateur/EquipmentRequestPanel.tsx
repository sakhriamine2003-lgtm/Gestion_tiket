"use client";

import { useEffect, useState } from "react";
import { PackagePlus } from "lucide-react";

type Equipment = { id: number; name: string; type: string; available: boolean };
type EquipmentRequest = {
  id: number;
  status: string;
  createdAt: string;
  product: { marque: string; bureau: string };
};
type RequestFilter = "Toutes" | "En attente" | "Acceptée" | "Refusée";

const requestFilters: RequestFilter[] = ["Toutes", "En attente", "Acceptée", "Refusée"];

export default function EquipmentRequestPanel() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [productId, setProductId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestFilter, setRequestFilter] = useState<RequestFilter>("Toutes");

  const filteredRequests = requestFilter === "Toutes"
    ? requests
    : requests.filter((request) => request.status === requestFilter);
  useEffect(() => {
    async function loadData() {
      try {
        const [equipmentResponse, requestsResponse] = await Promise.all([
          fetch("/backend/api/equipment"),
          fetch("/backend/api/equipment-requests"),
        ]);
        const equipmentData = await equipmentResponse.json();
        const requestsData = await requestsResponse.json();
        if (!equipmentResponse.ok) throw new Error(equipmentData.error || "Impossible de charger le matériel.");
        if (!requestsResponse.ok) throw new Error(requestsData.error || "Impossible de charger vos demandes.");
        setEquipment(equipmentData);
        setRequests(requestsData);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Impossible de charger les données.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productId) return;

    setIsSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/backend/api/equipment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: Number(productId) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d'envoyer la demande.");
      const selectedEquipment = equipment.find((item) => item.id === Number(productId));
      setRequests((current) => [{
        ...data,
        product: { marque: selectedEquipment?.name ?? "", bureau: selectedEquipment?.type ?? "" },
      }, ...current]);
      setProductId("");
      setMessage("Votre demande a été envoyée pour validation.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'envoyer la demande.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-teal-100 text-teal-800">
            <PackagePlus size={19} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-teal-800">Nouvelle demande</p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-950">Demander un équipement</h2>
          </div>
        </div>
        <form onSubmit={submitRequest} className="mt-5 space-y-4">
          <label className="block flex-1 text-sm font-medium text-slate-700">
            Équipement
            <select
              required
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Choisir un équipement</option>
              {equipment.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.type}){item.available ? "" : " - indisponible"}</option>)}
            </select>
          </label>
          <button
            type="submit"
            disabled={isSubmitting || !productId}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Envoi..." : "Envoyer la demande"}
          </button>
        </form>
        {!isLoading && equipment.length === 0 ? <p className="mt-3 text-sm text-slate-500">Aucun équipement dans le catalogue.</p> : null}
        {message ? <p className="mt-3 text-sm text-slate-600" role="status">{message}</p> : null}
      </section>

      <section className="rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Suivi</p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-950">Mes demandes</h2>
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1" aria-label="Filtrer les demandes par statut">
            {requestFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                aria-pressed={requestFilter === filter}
                onClick={() => setRequestFilter(filter)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${requestFilter === filter ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? <p className="mt-4 text-sm text-slate-500">Chargement...</p> : null}
        {!isLoading && requests.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aucune demande envoyée.</p> : null}
        {!isLoading && requests.length > 0 && filteredRequests.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aucune demande avec ce statut.</p> : null}
        <ul className="mt-3 divide-y divide-slate-100">
          {filteredRequests.map((request) => (
            <li key={request.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-900">{request.product.marque} ({request.product.bureau})</p>
                <p className="text-xs text-slate-500">Demandé le {new Date(request.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
              <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${request.status === "Acceptée" ? "bg-emerald-100 text-emerald-800" : request.status === "Refusée" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                {request.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}