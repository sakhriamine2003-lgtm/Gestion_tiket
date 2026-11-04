import { requireRole } from "@backend/authentification/session";
import EquipmentRequestPanel from "@frontend/features/demandes-equipement/PanneauDemandeEquipement";

export default async function UserEquipmentRequestsPage() {
    await requireRole("utilisateur");

    return (
        <main className="mx-auto w-full max-w-5xl space-y-6 p-4 pt-16 sm:p-6 sm:pt-8 lg:p-8">
            <header>
                <p className="text-sm font-medium text-blue-700">Espace utilisateur</p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">Demande d&apos;équipement</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Consultez les équipements disponibles, envoyez une demande et suivez son traitement.
                </p>
            </header>
            <EquipmentRequestPanel />
        </main>
    );
}
