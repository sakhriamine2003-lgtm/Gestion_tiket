import { requireRole } from "@/lib/auth";
import { LogoutButton } from "@/app/components/LogoutButton";
import Link from "next/link";
import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import EquipmentRequestsPanel from "./EquipmentRequestsPanel";

export default async function AdminPage() {
  const user = await requireRole("admin");
  const [requests, equipment] = await Promise.all([
    prisma.equipmentRequest.findMany({ include: { user: { select: { name: true, email: true } }, equipment: { select: { name: true, type: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.equipment.findMany({ where: { available: true }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, type: true, available: true } }),
  ]);
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div><p className="text-sm text-gray-500">Dashboard admin</p><h1 className="text-3xl font-semibold">Bonjour {user.name}</h1></div>
        <LogoutButton />
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
      <EquipmentRequestsPanel initialRequests={requests.map((request) => ({ ...request, createdAt: request.createdAt.toISOString() }))} initialEquipment={equipment} />
    </main>
  );
}
