import { requireRole } from "@backend/auth/session";
import { getAdminEquipmentRequestPageData } from "@backend/features/equipment-requests/equipment-request.queries";
import EquipmentRequestsPanel from "@frontend/features/equipment-requests/EquipmentRequestsPanel";
export default async function EquipmentRequestsPage() {
    await requireRole("admin");
    const { requests, equipment } = await getAdminEquipmentRequestPageData();
    return (<main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm text-slate-500">Gestion matériel</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Demandes d&apos;équipement</h1>
      </div>
      <EquipmentRequestsPanel initialRequests={requests.map((request) => ({ ...request, createdAt: request.createdAt.toISOString() }))} initialEquipment={equipment.map((product) => ({ id: product.id, name: product.marque, type: product.bureau, available: product.stock > 0, stock: product.stock }))}/>
    </main>);
}
