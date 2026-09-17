"use client";

import { useState } from "react";

type EquipmentRequest = {
  id: number;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  product: { marque: string; bureau: string };
};

type Equipment = { id: number; name: string; type: string; available: boolean; stock: number };

export default function EquipmentRequestsPanel({ initialRequests, initialEquipment }: { initialRequests: EquipmentRequest[]; initialEquipment: Equipment[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [equipment, setEquipment] = useState(initialEquipment);
  const [message, setMessage] = useState("");

  async function decide(id: number, status: "Acceptée" | "Refusée") {
    const response = await fetch(`/backend/api/equipment-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Impossible de traiter la demande."); return; }
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
    if (status === "Acceptée") {
      const acceptedRequest = requests.find((request) => request.id === id);
      if (acceptedRequest) setEquipment((current) => current.map((item) => item.name === acceptedRequest.product.marque ? { ...item, stock: item.stock - 1, available: item.stock > 1 } : item).filter((item) => item.stock > 0));
    }
    setMessage(`Demande ${status.toLowerCase()}.`);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Demandes d&apos;équipement</h2>
        {requests.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aucune demande reçue.</p> : <div className="mt-4 space-y-3">{requests.map((request) => {
          const isPanne = request.status === "Panne signalée";
          return (
            <div key={request.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{request.product.marque} <span className="font-normal text-slate-500">({request.product.bureau})</span></p>
                  {isPanne ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">Panne</span> : null}
                </div>
                <p className="text-sm text-slate-600">{request.user.name} · {request.user.email}</p>
                <p className="text-xs text-slate-400">{isPanne ? "Déclarée le" : "Demandé le"} {new Date(request.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="flex items-center gap-2">
                {request.status === "En attente" || request.status === "Panne signalée" ? (
                  <>
                    <button type="button" onClick={() => decide(request.id, "Acceptée")} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">{isPanne ? "Traiter" : "Accepter"}</button>
                    <button type="button" onClick={() => decide(request.id, "Refusée")} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700">Refuser</button>
                  </>
                ) : (
                  <span className={`text-sm font-medium ${request.status === "Acceptée" ? "text-emerald-600" : request.status === "Refusée" ? "text-rose-600" : "text-slate-600"}`}>
                    {request.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}</div>}
        {message ? <p className="mt-4 text-sm text-slate-600" role="status">{message}</p> : null}
      </section>
      <p className="text-sm text-slate-500">Équipements actuellement disponibles : {equipment.length}</p>
    </div>
  );
}