import { requireRole } from "@/lib/auth";
import EquipmentRequestPanel from "./EquipmentRequestPanel";

export default async function UtilisateurPage() {
  const user = await requireRole("utilisateur");
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div><p className="text-sm text-gray-500">Dashboard utilisateur</p><h1 className="text-3xl font-semibold">Bonjour {user.name}</h1></div>
      </div>
      <EquipmentRequestPanel />
    </main>
  );
}
