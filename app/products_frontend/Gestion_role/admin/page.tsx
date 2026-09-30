import { requireRole } from "@/lib/auth";
import Link from "next/link";
import { Package } from "lucide-react";

export default async function AdminPage() {
  const user = await requireRole("admin");
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <div><p className="text-sm text-gray-500">Dashboard admin</p><h1 className="text-3xl font-semibold">Bonjour {user.name}</h1></div>
      </div>
      <section className="rounded-xl border border-gray-200 p-6">
        <p>Vous êtes connecté en tant qu’administrateur.</p>
        <Link
          href="/products_frontend/Gestion_product/AffichageProduit"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          <Package size={18} aria-hidden="true" />
          Gérer le stock et les produits
        </Link>
      </section>
    </main>
  );
}
