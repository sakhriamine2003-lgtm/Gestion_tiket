import { requireRole } from "@backend/authentification/session";
import { getAdminEquipmentRequestPageData } from "@backend/features/demandes-equipement/demandeEquipement.queries";
import EquipmentRequestsPanel from "@frontend/features/demandes-equipement/PanneauDemandesEquipement";
export default async function EquipmentRequestsPage() {
    await requireRole("admin");
    const { requests, equipment } = await getAdminEquipmentRequestPageData();
    return (<main className="mx-auto w-full max-w-5xl space-y-6 p-4 pt-16 sm:p-8 sm:pt-8">
      <div>
        <p className="text-sm font-medium text-blue-700">Gestion du matériel</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Demandes d&apos;équipement</h1>
      </div>
      <EquipmentRequestsPanel initialRequests={requests.map((request) => ({ ...request, createdAt: request.createdAt.toISOString() }))} initialEquipment={equipment.map((product) => ({ id: product.id, name: product.marque, type: product.bureau, available: product.stock > 0, stock: product.stock }))}/>
    </main>);
}
