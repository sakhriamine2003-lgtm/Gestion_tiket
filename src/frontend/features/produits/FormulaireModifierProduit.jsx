"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";

export default function EditProductForm({ product }) {
    const router = useRouter();
    const [formData, setFormData] = useState({ marque: product.marque, bureau: product.bureau, prix: product.prix, stock: product.stock });
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    function handleChange(event) {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    }
    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage("");
        setIsSubmitting(true);
        try {
            await axios.put("/backend/GestionProduit/ModifierProduit", { productId: product.id, marque: formData.marque, bureau: formData.bureau, prix: Number(formData.prix), stock: Number(formData.stock) });
            router.push("/Gestion_produits/Gestion_produit/AffichageProduit");
            router.refresh();
        }
        catch (error) {
            setErrorMessage(error.response?.data?.message || "Une erreur est survenue lors de la mise à jour du produit.");
            setIsSubmitting(false);
        }
    }
    return (<div className="mx-auto w-full max-w-3xl p-4 pt-16 sm:p-8 sm:pt-8"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><div className="mb-6"><p className="text-sm font-medium text-blue-700">Gestion du stock</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Modifier l&apos;équipement</h1><p className="mt-2 text-sm text-slate-600">Mettez à jour les informations de l’article.</p></div>
      <form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-semibold text-gray-700 mb-1">Marque</label><input type="text" name="marque" value={formData.marque} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none text-sm"/></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Bureau</label><input type="text" name="bureau" value={formData.bureau} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none text-sm"/></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Prix (DH)</label><input type="number" name="prix" step="0.01" min="0" value={formData.prix} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none text-sm"/></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Stock</label><input type="number" name="stock" min="0" step="1" value={formData.stock} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none text-sm"/></div>
        {errorMessage && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{errorMessage}</p>}<div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => router.push("/Gestion_produits/Gestion_produit/AffichageProduit")} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Annuler</button><button type="submit" disabled={isSubmitting} className="min-h-11 rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Enregistrement..." : "Enregistrer"}</button></div>
      </form></div></div>);
}