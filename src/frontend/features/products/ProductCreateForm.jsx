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
    return (<div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"><div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md"><h2 className="text-2xl font-bold text-gray-800 mb-6">Ajouter un Produit</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="marque" className="block text-sm font-semibold text-gray-700 mb-1">Marque</label><input type="text" id="marque" name="marque" value={formData.marque} onChange={handleChange} placeholder="Ex: CLAVIER, PC..." required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"/></div>
        <div><label htmlFor="bureau" className="block text-sm font-semibold text-gray-700 mb-1">Bureau</label><input type="number" id="bureau" name="bureau" value={formData.bureau} onChange={handleChange} placeholder="Ex: 14" required min="0" step="1" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"/></div>
        <div><label htmlFor="prix" className="block text-sm font-semibold text-gray-700 mb-1">Prix (DH)</label><input type="number" id="prix" name="prix" step="0.01" value={formData.prix} onChange={handleChange} placeholder="Ex: 2000" required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"/></div>
        <div><label htmlFor="stock" className="block text-sm font-semibold text-gray-700 mb-1">Stock</label><input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} placeholder="Ex: 100" required min="0" step="1" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"/></div>
        <div className="flex justify-end space-x-3 pt-4"><Link href="/products_frontend/Gestion_product/AffichageProduit" className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition duration-150 text-center">Annuler</Link><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition duration-150">{isSubmitting ? "Enregistrement..." : "Enregistrer"}</button></div>
        {successMessage && <p className="text-sm text-green-700" role="status">{successMessage}</p>}{errorMessage && <p className="text-sm text-red-700" role="alert">{errorMessage}</p>}
      </form></div></div>);
}