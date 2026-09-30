import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EquipmentRequestsPanel from "../EquipmentRequestsPanel";

export default async function EquipmentRequestsPage() {
  await requireRole("admin");
  const [requests, equipment] = await Promise.all([
    prisma.equipmentRequest.findMany({
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { marque: true, bureau: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { stock: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      select: { id: true, marque: true, bureau: true, stock: true },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm text-slate-500">Gestion matériel</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Demandes d&apos;équipement</h1>
      </div>
      <EquipmentRequestsPanel
        initialRequests={requests.map((request) => ({ ...request, createdAt: request.createdAt.toISOString() }))}
        initialEquipment={equipment.map((product) => ({ id: product.id, name: product.marque, type: product.bureau, available: product.stock > 0, stock: product.stock }))}
      />
    </main>
  );
}