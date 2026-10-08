import { requireRole } from "@/lib/auth";
import UserTicketsPanel from "./UserTicketsPanel";

export default async function UserTicketsPage() {
  await requireRole("utilisateur");

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm text-slate-500">Espace utilisateur</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Mes tickets</h1>
        <p className="mt-2 text-sm text-slate-600">Créez un ticket et joignez des photos ou une vidéo pour décrire votre demande.</p>
      </div>
      <UserTicketsPanel />
    </main>
  );
}
