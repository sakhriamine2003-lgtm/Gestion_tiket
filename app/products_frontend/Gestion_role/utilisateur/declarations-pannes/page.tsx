import { requireRole } from "@/lib/auth";
import FaultReportPanel from "./FaultReportPanel";

export default async function MyFaultReportsPage() {
  await requireRole("utilisateur");

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm text-slate-500">Espace utilisateur</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Mes déclarations de pannes</h1>
      </div>
      <FaultReportPanel />
    </main>
  );
}