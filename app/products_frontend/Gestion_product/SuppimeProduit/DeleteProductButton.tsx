"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import axios from "axios";

export default function DeleteProductButton({ productId }: { productId: number }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Supprimer ce produit ?")) return;

    const id = Number(productId);
    if (!Number.isInteger(id) || id <= 0) {
      alert("Produit invalide.");
      return;
    }

    setIsDeleting(true);

    try {
      const res = await axios.delete("/backend/GestionProduit/SupprimerProduit", {
        data: { productId: id },
      });

      if (!res || res.status < 200 || res.status >= 300) {
        throw new Error("Erreur lors de la suppression.");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={isDeleting ? "Suppression en cours" : "Supprimer le produit"}
      title={isDeleting ? "Suppression en cours" : "Supprimer le produit"}
      className="inline-flex h-8 w-8 items-center justify-center rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 size={16} aria-hidden="true" />
    </button>
  );
}