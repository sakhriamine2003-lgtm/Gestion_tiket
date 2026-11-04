import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { requireRole } from "@backend/auth/session";
import CreateUserForm from "@frontend/features/users/CreateUserForm";

export default async function AddUserPage() {
  await requireRole("admin");

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <Link
        href="/products_frontend/Gestion_role/admin"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Retour au tableau de bord
      </Link>

      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex items-center gap-4">
          <span className="rounded-2xl bg-white/10 p-3 text-teal-300">
            <UserPlus size={24} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">Gestion des comptes</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Ajouter un utilisateur</h1>
          </div>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
          Créez un compte et choisissez son rôle dans l’application.
        </p>
      </section>

      <CreateUserForm />
    </main>
  );
}
