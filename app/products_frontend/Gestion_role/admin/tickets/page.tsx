import { requireRole } from "@/lib/auth";
import AdminTicketsPanel from "./AdminTicketsPanel";

export default async function AdminTicketsPage() {
  await requireRole("admin");

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm text-slate-500">Gestion des tickets</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Tickets des utilisateurs</h1>
      </div>
      <AdminTicketsPanel />
    </main>
  );
}
