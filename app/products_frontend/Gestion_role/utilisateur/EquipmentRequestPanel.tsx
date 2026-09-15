"use client";

import { useState } from "react";

type Equipment = {
  id: number;
  name: string;
  type: string;
  description: string;
  condition: string;
};

export default function EquipmentRequestPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function openPanel() {
    setIsOpen(true);
    setMessage("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/equipment");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger les équipements.");
      setEquipment(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitRequest() {
    if (!selectedId) return;
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/equipment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d'envoyer la demande.");
      setMessage("Votre demande a été envoyée et est en attente de validation.");
      setSelectedId(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Ressources disponibles</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Besoin d&apos;un équipement ?</h2>
          <p className="mt-1 text-sm text-slate-500">Consultez le matériel disponible et soumettez votre demande.</p>
        </div>
        <button type="button" onClick={openPanel} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
          Demander un équipement
        </button>
      </div>

      {isOpen && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Équipements disponibles</h3>
            <button type="button" onClick={() => setIsOpen(false)} className="text-sm text-slate-500 hover:text-slate-900">Fermer</button>
          </div>
          {isLoading && equipment.length === 0 ? <p className="text-sm text-slate-500">Chargement...</p> : null}
          {!isLoading && equipment.length === 0 ? <p className="text-sm text-slate-500">Aucun équipement disponible pour le moment.</p> : null}
          <div className="grid gap-3 md:grid-cols-2">
            {equipment.map((item) => (
              <label key={item.id} className={`cursor-pointer rounded-xl border p-4 transition ${selectedId === item.id ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-teal-300"}`}>
                <div className="flex gap-3">
                  <input type="radio" name="equipment" value={item.id} checked={selectedId === item.id} onChange={() => setSelectedId(item.id)} className="mt-1 accent-teal-600" />
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-teal-700">{item.type} · État : {item.condition}</p>
                    <p className="mt-2 text-slate-500">{item.description}</p>
                    <p className="mt-2 font-medium text-emerald-600">Disponible</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
          <button type="button" disabled={!selectedId || isLoading} onClick={submitRequest} className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-700">
            Envoyer la demande
          </button>
          {message ? <p className="mt-3 text-sm text-slate-600" role="status">{message}</p> : null}
        </div>
      )}
    </section>
  );
}