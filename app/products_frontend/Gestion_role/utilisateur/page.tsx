import { requireRole } from "@/lib/auth";
import { ClipboardList, Clock3, ShieldCheck } from "lucide-react";
import EquipmentRequestPanel from "./EquipmentRequestPanel";

export default async function UtilisateurPage() {
  const user = await requireRole("utilisateur");

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Dashboard utilisateur</p>
          <h1 className="text-3xl font-semibold">Bonjour {user.name}</h1>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.08em] text-teal-700">Déclaration</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Déclarer votre besoin matériel</h2>
          </div>
          <div className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700">
            Suivi des demandes
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 inline-flex rounded-lg bg-teal-100 p-2 text-teal-700">
              <ClipboardList size={18} />
            </div>
            <h3 className="font-semibold text-slate-900">1. Sélectionner</h3>
            <p className="mt-2 text-sm text-slate-600">Choisissez l&apos;équipement ou le produit dont vous avez besoin.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 inline-flex rounded-lg bg-amber-100 p-2 text-amber-700">
              <Clock3 size={18} />
            </div>
            <h3 className="font-semibold text-slate-900">2. Envoyer</h3>
            <p className="mt-2 text-sm text-slate-600">Soumettez votre demande pour validation par l&apos;administration.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 inline-flex rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <ShieldCheck size={18} />
            </div>
            <h3 className="font-semibold text-slate-900">3. Suivre</h3>
            <p className="mt-2 text-sm text-slate-600">Consultez l&apos;état de votre demande et les réponses reçues.</p>
          </div>
        </div>
      </section>

      <EquipmentRequestPanel />

    </main>
  );
}
