"use client";

import { useEffect, useState } from "react";
import {
    CheckCircle2,
    ClipboardList,
    PackagePlus,
    TriangleAlert,
} from "lucide-react";

const requestFilters = ["Toutes", "En attente", "Acceptée", "Refusée"];

function feedbackStyles(type) {
    return type === "error"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-blue-200 bg-blue-50 text-blue-800";
}

export default function EquipmentRequestPanel() {
    const [equipment, setEquipment] = useState([]);
    const [requests, setRequests] = useState([]);
    const [productId, setProductId] = useState("");
    const [feedback, setFeedback] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestFilter, setRequestFilter] = useState("Toutes");
    const filteredRequests = requestFilter === "Toutes"
        ? requests
        : requests.filter((request) => request.status === requestFilter);

    useEffect(() => {
        async function loadData() {
            try {
                const [equipmentResponse, requestsResponse] = await Promise.all([
                    fetch("/backend/api/equipement"),
                    fetch("/backend/api/demandes-equipement"),
                ]);
                const [equipmentData, requestsData] = await Promise.all([
                    equipmentResponse.json(),
                    requestsResponse.json(),
                ]);

                if (!equipmentResponse.ok) {
                    throw new Error(equipmentData.error || "Impossible de charger le matériel.");
                }
                if (!requestsResponse.ok) {
                    throw new Error(requestsData.error || "Impossible de charger vos demandes.");
                }

                setEquipment(equipmentData);
                setRequests(requestsData);
            } catch (error) {
                setFeedback({
                    type: "error",
                    text: error instanceof Error ? error.message : "Impossible de charger les données.",
                });
            } finally {
                setIsLoading(false);
            }
        }

        void loadData();
    }, []);

    async function submitRequest(event) {
        event.preventDefault();
        if (!productId) return;

        setIsSubmitting(true);
        setFeedback(null);

        try {
            const response = await fetch("/backend/api/demandes-equipement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: Number(productId) }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Impossible d'envoyer la demande.");
            }

            const selectedEquipment = equipment.find((item) => item.id === Number(productId));
            setRequests((current) => [{
                ...data,
                product: {
                    marque: selectedEquipment?.name ?? "",
                    bureau: selectedEquipment?.type ?? "",
                },
            }, ...current]);
            setProductId("");
            setFeedback({ type: "success", text: "Votre demande a été envoyée pour validation." });
        } catch (error) {
            setFeedback({
                type: "error",
                text: error instanceof Error ? error.message : "Impossible d'envoyer la demande.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-start gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                        <PackagePlus size={22} aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Nouvelle demande</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-950">Choisir un équipement</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                            Sélectionnez un article disponible dans le stock pour envoyer votre demande.
                        </p>
                    </div>
                </div>

                <form onSubmit={submitRequest} className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <label htmlFor="equipment-request-product" className="block text-sm font-medium text-slate-700">
                        Équipement
                        <select
                            id="equipment-request-product"
                            required
                            value={productId}
                            onChange={(event) => setProductId(event.target.value)}
                            disabled={isLoading || equipment.every((item) => !item.available)}
                            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                        >
                            <option value="">Choisir un équipement</option>
                            {equipment.filter((item) => item.available).map((item) => (
                                <option key={item.id} value={item.id}>{item.name} ({item.type})</option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="submit"
                        disabled={isSubmitting || isLoading || !productId}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <PackagePlus size={17} aria-hidden="true" />
                        {isSubmitting ? "Envoi..." : "Envoyer la demande"}
                    </button>
                </form>

                {!isLoading && equipment.every((item) => !item.available) ? (
                    <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        Aucun équipement n&apos;est disponible dans le stock pour le moment.
                    </p>
                ) : null}
                {feedback ? (
                    <p
                        className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${feedbackStyles(feedback.type)}`}
                        role={feedback.type === "error" ? "alert" : "status"}
                    >
                        {feedback.type === "error"
                            ? <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                            : <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />}
                        {feedback.text}
                    </p>
                ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                            <ClipboardList size={19} aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suivi</p>
                            <h2 className="mt-0.5 text-lg font-semibold text-slate-950">Mes demandes</h2>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1" aria-label="Filtrer les demandes par statut">
                        {requestFilters.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                aria-pressed={requestFilter === filter}
                                onClick={() => setRequestFilter(filter)}
                                className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${requestFilter === filter
                                    ? "bg-white text-blue-800 shadow-sm ring-1 ring-slate-200"
                                    : "text-slate-600 hover:text-slate-950"}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <p className="mt-6 text-sm text-slate-500" role="status">Chargement de vos demandes...</p>
                ) : null}
                {!isLoading && requests.length === 0 ? (
                    <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                        Aucune demande envoyée pour le moment.
                    </p>
                ) : null}
                {!isLoading && requests.length > 0 && filteredRequests.length === 0 ? (
                    <p className="mt-6 text-sm text-slate-500">Aucune demande avec ce statut.</p>
                ) : null}

                {filteredRequests.length > 0 ? (
                    <ul className="mt-5 space-y-3">
                        {filteredRequests.map((request) => {
                            const statusStyle = request.status === "Acceptée"
                                ? "bg-blue-50 text-blue-800 ring-blue-200"
                                : request.status === "Refusée"
                                    ? "bg-rose-50 text-rose-800 ring-rose-200"
                                    : "bg-amber-50 text-amber-800 ring-amber-200";

                            return (
                                <li key={request.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {request.product?.marque} ({request.product?.bureau})
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Demandé le {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                                        </p>
                                    </div>
                                    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle}`}>
                                        {request.status}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                ) : null}
            </section>
        </div>
    );
}
