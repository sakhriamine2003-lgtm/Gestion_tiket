"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton({ className = "" }) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    async function logout() {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            const response = await fetch("/backend/api/deconnexion", { method: "POST", headers: { "Content-Type": "application/json" } });
            if (!response.ok) throw new Error("Logout failed");
        }
        finally {
            router.replace("/Gestion_produits/Gestion_roles/connexion");
            router.refresh();
        }
    }
    return (<button className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 ${className}`} onClick={logout} type="button" disabled={isLoggingOut} aria-busy={isLoggingOut}><LogOut size={16} aria-hidden="true"/>{isLoggingOut ? "Déconnexion..." : "Se déconnecter"}</button>);
}