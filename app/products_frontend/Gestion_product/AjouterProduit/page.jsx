import { requireRole } from "@backend/auth/session";
import ProductCreateForm from "@frontend/features/products/ProductCreateForm";

export default async function AjouterProduitPage() {
    await requireRole("admin");
    return <ProductCreateForm />;
}
