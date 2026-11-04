import { requireRole } from "@backend/authentification/session";
import AdminTicketsPanel from "@frontend/features/tickets/PanneauTicketsAdmin";
export default async function AdminTicketsPage() {
    await requireRole("admin");
    return (<main className="mx-auto w-full max-w-6xl space-y-6 p-4 pt-16 sm:p-8 sm:pt-8">
      <div>
        <p className="text-sm font-medium text-blue-700">Gestion des tickets</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Tickets des utilisateurs</h1>
      </div>
      <AdminTicketsPanel />
    </main>);
}
