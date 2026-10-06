import { requireRole } from "@/lib/auth";
import FaultReportsPanel from "./FaultReportsPanel";

export default async function FaultReportsAdminPage() {
  await requireRole("admin");

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm text-slate-500">Gestion matériel</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Déclarations de pannes ...</h1>
      </div>
      <FaultReportsPanel />
    </main>
  );
}