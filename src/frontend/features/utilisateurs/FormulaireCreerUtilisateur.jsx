"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { UserPlus } from "lucide-react";
import api from "@frontend/services/api";

const emptyForm = { name: "", email: "", password: "", user_role: "utilisateur" };
const inputClass = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

export default function CreateUserForm() {
    const router = useRouter();
    const [form, setForm] = useState(emptyForm);
    const [pending, setPending] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
    async function handleSubmit(event) {
        event.preventDefault();
        setPending(true);
        setFeedback(null);
        try {
            const response = await api.post("/utilisateurs", form);
            setFeedback({ type: "success", text: `Utilisateur « ${response.data.name} » créé.` });
            setForm(emptyForm);
            router.refresh();
        }
        catch (error) {
            const text = axios.isAxiosError(error) && error.response?.data?.error
                ? error.response.data.error
                : "Impossible de créer l'utilisateur.";
            setFeedback({ type: "error", text });
        }
        finally {
            setPending(false);
        }
    }
    return (<article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-sm font-medium text-slate-500">Gestion des comptes</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Ajouter un utilisateur</h2></div>
        <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><UserPlus size={18} aria-hidden="true"/></span>
      </div>
      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Nom<input required value={form.name} onChange={update("name")} className={inputClass}/></label>
        <label className="text-sm font-medium text-slate-700">E-mail<input required type="email" value={form.email} onChange={update("email")} className={inputClass}/></label>
        <label className="text-sm font-medium text-slate-700">Mot de passe (6 caractères min.)<input required type="password" minLength={6} autoComplete="new-password" value={form.password} onChange={update("password")} className={inputClass}/></label>
        <label className="text-sm font-medium text-slate-700">Rôle<select value={form.user_role} onChange={update("user_role")} className={inputClass}><option value="utilisateur">Utilisateur</option><option value="responsable">Responsable</option><option value="admin">Administrateur</option></select></label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={pending} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Création…" : "Créer l'utilisateur"}</button>
          {feedback && <p role={feedback.type === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-2.5 text-sm ${feedback.type === "success" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{feedback.text}</p>}
        </div>
      </form>
    </article>);
}