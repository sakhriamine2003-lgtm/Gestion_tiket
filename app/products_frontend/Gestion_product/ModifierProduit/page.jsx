import { notFound } from "next/navigation";
import { requireRole } from "@backend/auth/session";
import { getProductForEdit } from "@backend/features/products/product.queries";
import EditProductForm from "@frontend/features/products/EditProductForm";
export default async function EditProductPage({ searchParams }) {
    await requireRole("admin");
    const { id: idParam } = await searchParams;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
        notFound();
    }
    const product = await getProductForEdit(id);
    if (!product) {
        notFound();
    }
    return (<EditProductForm product={{
            id: product.id,
            marque: product.marque,
            bureau: product.bureau,
            prix: product.prix,
            stock: product.stock,
        }}/>);
}
