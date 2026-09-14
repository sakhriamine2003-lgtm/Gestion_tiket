import { requireRole } from "@/lib/auth";
import { LogoutButton } from "@/app/components/LogoutButton";

export default async function ResponsablePage() {
  const user = await requireRole("responsable");
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div><p className="text-sm text-gray-500">Dashboard responsable</p><h1 className="text-3xl font-semibold">Bonjour {user.name}</h1></div>
        <LogoutButton />
      </div>
      <section className="rounded-xl border border-gray-200 p-6"><p>Vous êtes connecté en tant que responsable.</p></section>
    </main>
  );
}
