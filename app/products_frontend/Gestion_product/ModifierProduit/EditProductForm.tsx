"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";

export default function EditProductForm({ product }: { product: any }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    marque: product.marque,
    bureau: product.bureau,
    prix: product.prix,
    stock: product.stock,
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await axios.put("/backend/GestionProduit/ModifierProduit", {
        productId: product.id,
        marque: formData.marque,
        bureau: formData.bureau,
        prix: Number(formData.prix),
        stock: Number(formData.stock),
      });

     
      router.push("/products_frontend/Gestion_product/AffichageProduit");
      router.refresh();

    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "Une erreur est survenue lors de la mise à jour du produit.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Modifier le produit</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Marque</label>
            <input
              type="text"
              name="marque"
              value={formData.marque}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Bureau</label>
            <input
              type="text"
              name="bureau"
              value={formData.bureau}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Prix (DH)</label>
            <input
              type="number"
              name="prix"
              step="0.01"
              min="0"
              value={formData.prix}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              name="stock"
              min="0"
              step="1"
              value={formData.stock}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none text-sm"
            />
          </div>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/products_frontend/Gestion_product/AffichageProduit")}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Enregistrer..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}