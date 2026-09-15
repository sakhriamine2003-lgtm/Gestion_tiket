"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const response = await fetch("/backend/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Logout failed");
    } finally {
      router.replace("/products_frontend/Gestion_role/login");
      router.refresh();
    }
  }

  return (
    <button
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
      onClick={logout}
      type="button"
      disabled={isLoggingOut}
      aria-busy={isLoggingOut}
    >
      <LogOut size={16} aria-hidden="true" />
      {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}
