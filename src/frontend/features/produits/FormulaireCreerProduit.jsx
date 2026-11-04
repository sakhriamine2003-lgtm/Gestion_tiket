"use client";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";

export default function ProductCreateForm() {
    const [formData, setFormData] = useState({ marque: "", bureau: "", prix: "", stock: "" });
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        const marque = formData.marque.trim();
        const bureauValue = formData.bureau.trim();
        const prixValue = formData.prix.trim();
        const stockValue = formData.stock.trim();
        const bureau = Number(bureauValue);
        const prix = Number(prixValue);
        const stock = Number(stockValue);
        if (!marque) return setErrorMessage("La marque est obligatoire.");
        if (!bureauValue || !Number.isInteger(bureau) || bureau < 0) return setErrorMessage("Le bureau doit être un entier positif ou nul.");
        if (!prixValue || !Number.isFinite(prix) || prix < 0) return setErrorMessage("Le prix doit être un nombre positif ou nul.");
        if (!stockValue || !Number.isInteger(stock) || stock < 0) return setErrorMessage("Le stock doit être un entier positif ou nul.");
        setIsSubmitting(true);
        try {
            const response = await axios.post("/backend/GestionProduit/AjouterProduit", { marque, bureau: String(bureau), prix, stock });
            console.log("Produit ajouté :", response.data);
            setSuccessMessage("Produit ajouté avec succès.");
            setFormData({ marque: "", bureau: "", prix: "", stock: "" });
        }
        catch (error) {
            console.error("Erreur lors de l'ajout :", error);
            if (axios.isAxiosError(error)) setErrorMessage(error.response?.data?.error ?? "Impossible d'ajouter le produit.");
            else setErrorMessage("Une erreur inattendue est survenue.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="mx-auto w-full max-w-3xl p-4 pt-16 sm:p-8 sm:pt-8"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><div className="mb-6"><p className="text-sm font-medium text-blue-700">Gestion du stock</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Ajouter un équipement</h2><p className="mt-2 text-sm text-slate-600">Renseignez les informations de l’article à ajouter au catalogue.</p></div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="marque" className="block text-sm font-semibold text-gray-700 mb-1">Marque</label><input type="text" id="marque" name="marque" value={formData.marque} onChange={handleChange} placeholder="Ex: CLAVIER, PC..." required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"/></div>
        <div><label htmlFor="bureau" className="block text-sm font-semibold text-gray-700 mb-1">Bureau</label><input type="number" id="bureau" name="bureau" value={formData.bureau} onChange={handleChange} placeholder="Ex: 14" required min="0" step="1" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"/></div>
        <div><label htmlFor="prix" className="block text-sm font-semibold text-gray-700 mb-1">Prix (DH)</label><input type="number" id="prix" name="prix" step="0.01" value={formData.prix} onChange={handleChange} placeholder="Ex: 2000" required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"/></div>
        <div><label htmlFor="stock" className="block text-sm font-semibold text-gray-700 mb-1">Stock</label><input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} placeholder="Ex: 100" required min="0" step="1" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"/></div>
        <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end"><Link href="/Gestion_produits/Gestion_produit/AffichageProduit" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Annuler</Link><button type="submit" disabled={isSubmitting} className="min-h-11 rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Enregistrement..." : "Enregistrer"}</button></div>
        {successMessage && <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800" role="status">{successMessage}</p>}{errorMessage && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{errorMessage}</p>}
      </form></div></div>);
}