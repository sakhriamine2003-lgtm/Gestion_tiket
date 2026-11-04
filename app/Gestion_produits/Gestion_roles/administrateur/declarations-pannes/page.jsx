import { requireRole } from "@backend/authentification/session";
import FaultReportsPanel from "@frontend/features/declarations-pannes/PanneauDeclarationsPannes";
export default async function FaultReportsAdminPage() {
    await requireRole("admin");
    return (<main className="mx-auto w-full max-w-6xl space-y-6 p-4 pt-16 sm:p-8 sm:pt-8">
      <div>
        <p className="text-sm font-medium text-blue-700">Gestion du matériel</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Déclarations de pannes</h1>
      </div>
      <FaultReportsPanel />
    </main>);
}
