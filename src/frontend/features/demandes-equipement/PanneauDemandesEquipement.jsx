"use client";

import { useState } from "react";
import { CheckCircle2, PackageCheck, TriangleAlert } from "lucide-react";

export default function EquipmentRequestsPanel({ initialRequests, initialEquipment }) {
    const [requests, setRequests] = useState(initialRequests);
    const [equipment, setEquipment] = useState(initialEquipment);
    const [feedback, setFeedback] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    async function decide(id, status) {
        setUpdatingId(id);
        setFeedback(null);

        try {
            const response = await fetch(`/backend/api/demandes-equipement/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Impossible de traiter la demande.");
            }

            setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
            if (status === "Acceptée") {
                const acceptedRequest = requests.find((request) => request.id === id);
                if (acceptedRequest) {
                    setEquipment((current) => current
                        .map((item) => item.name === acceptedRequest.product.marque
                            ? { ...item, stock: item.stock - 1, available: item.stock > 1 }
                            : item)
                        .filter((item) => item.stock > 0));
                }
            }
            setFeedback({ type: "success", text: `Demande ${status.toLowerCase()}.` });
        } catch (error) {
            setFeedback({
                type: "error",
                text: error instanceof Error ? error.message : "Impossible de traiter la demande.",
            });
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
                        <PackageCheck size={20} aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Gestion du matériel</p>
                        <h2 className="text-lg font-semibold text-slate-950">Demandes reçues</h2>
                    </div>
                </div>

                {feedback ? (
                    <p
                        className={`mt-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${feedback.type === "error"
                            ? "border-rose-200 bg-rose-50 text-rose-800"
                            : "border-blue-200 bg-blue-50 text-blue-800"}`}
                        role={feedback.type === "error" ? "alert" : "status"}
                    >
                        {feedback.type === "error"
                            ? <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                            : <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />}
                        {feedback.text}
                    </p>
                ) : null}

                {requests.length === 0 ? (
                    <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                        Aucune demande reçue.
                    </p>
                ) : (
                    <ul className="mt-5 space-y-3">
                        {requests.map((request) => {
                            const isPanne = request.status === "Panne signalée" || Boolean(request.reason?.trim());
                            const problemDetail = request.reason?.trim() || (isPanne ? "Aucun détail supplémentaire n’a été fourni." : "");
                            const isPending = updatingId === request.id;

                            return (
                                <li key={request.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 sm:p-5">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-slate-900">
                                                    {request.product.marque} <span className="font-normal text-slate-500">({request.product.bureau})</span>
                                                </p>
                                                {isPanne ? (
                                                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">Panne signalée</span>
                                                ) : null}
                                            </div>
                                            <p className="mt-1 text-sm text-slate-700">{request.user.name} · {request.user.email}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {isPanne ? "Déclarée le" : "Demandé le"} {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                                            </p>
                                            {isPanne ? (
                                                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900">
                                                    <span className="font-semibold">Problème signalé :</span> {problemDetail}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                            {request.status === "En attente" || request.status === "Panne signalée" ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => void decide(request.id, "Acceptée")}
                                                        className="min-h-10 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isPending ? "Traitement..." : isPanne ? "Traiter" : "Accepter"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => void decide(request.id, "Refusée")}
                                                        className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Refuser
                                                    </button>
                                                </>
                                            ) : (
                                                <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${request.status === "Acceptée"
                                                    ? "bg-blue-50 text-blue-800 ring-blue-200"
                                                    : request.status === "Refusée"
                                                        ? "bg-rose-50 text-rose-800 ring-rose-200"
                                                        : "bg-slate-100 text-slate-700 ring-slate-200"}`}
                                                >
                                                    {request.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
            <p className="text-sm text-slate-500">
                Équipements actuellement disponibles : <span className="font-semibold text-slate-700">{equipment.length}</span>
            </p>
        </div>
    );
}
