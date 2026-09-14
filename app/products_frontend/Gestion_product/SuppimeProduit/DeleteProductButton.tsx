"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function DeleteProductButton({ productId }: { productId: number }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Supprimer ce produit ?")) return;

    setIsDeleting(true);

    try {
      const res = await fetch("/backend/GestionProduit/SupprimerProduit", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) throw new Error("Erreur lors de la suppression.");

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur inconnue.");
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