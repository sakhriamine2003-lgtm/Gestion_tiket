import { requireRole } from "@backend/authentification/session";
import ProductCreateForm from "@frontend/features/produits/FormulaireCreerProduit";

export default async function AjouterProduitPage() {
    await requireRole("admin");
    return <ProductCreateForm />;
}
