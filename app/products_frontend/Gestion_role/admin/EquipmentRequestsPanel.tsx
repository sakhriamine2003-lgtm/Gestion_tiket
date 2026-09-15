"use client";

import { useState } from "react";

type EquipmentRequest = {
  id: number;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  equipment: { name: string; type: string };
};

type Equipment = { id: number; name: string; type: string; available: boolean };

export default function EquipmentRequestsPanel({ initialRequests, initialEquipment }: { initialRequests: EquipmentRequest[]; initialEquipment: Equipment[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [equipment, setEquipment] = useState(initialEquipment);
  const [form, setForm] = useState({ name: "", type: "", description: "", condition: "Bon état" });
  const [message, setMessage] = useState("");

  async function decide(id: number, status: "Acceptée" | "Refusée") {
    const response = await fetch(`/api/equipment-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Impossible de traiter la demande."); return; }
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
    if (status === "Acceptée") {
      const acceptedRequest = requests.find((request) => request.id === id);
      if (acceptedRequest) setEquipment((current) => current.filter((item) => item.name !== acceptedRequest.equipment.name));
    }
    setMessage(`Demande ${status.toLowerCase()}.`);
  }

  async function addEquipment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/equipment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Impossible d'ajouter l'équipement."); return; }
    setEquipment((current) => [data, ...current]);
    setForm({ name: "", type: "", description: "", condition: "Bon état" });
    setMessage("Équipement ajouté.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Ajouter un équipement</h2>
        <form onSubmit={addEquipment} className="mt-4 grid gap-3 md:grid-cols-2">
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nom de l'équipement" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input required value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} placeholder="Type (machine, écran...)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input required value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })} placeholder="État" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <button type="submit" className="w-fit rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Ajouter à la disponibilité</button>
        </form>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Demandes d&apos;équipement</h2>
        {requests.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aucune demande reçue.</p> : <div className="mt-4 space-y-3">{requests.map((request) => <div key={request.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold text-slate-900">{request.equipment.name} <span className="font-normal text-slate-500">({request.equipment.type})</span></p><p className="text-sm text-slate-600">{request.user.name} · {request.user.email}</p><p className="text-xs text-slate-400">Demandé le {new Date(request.createdAt).toLocaleDateString("fr-FR")}</p></div><div className="flex items-center gap-2">{request.status === "En attente" ? <><button type="button" onClick={() => decide(request.id, "Acceptée")} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">Accepter</button><button type="button" onClick={() => decide(request.id, "Refusée")} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700">Refuser</button></> : <span className="text-sm font-medium text-slate-600">{request.status}</span>}</div></div>)}</div>}
        {message ? <p className="mt-4 text-sm text-slate-600" role="status">{message}</p> : null}
      </section>
      <p className="text-sm text-slate-500">Équipements actuellement disponibles : {equipment.length}</p>
    </div>
  );
}