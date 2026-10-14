import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditProductForm from "./EditProductForm";
export default async function EditProductPage({ searchParams }) {
    const { id: idParam } = await searchParams;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
        notFound();
    }
    const product = await prisma.product.findUnique({
        where: { id },
    });
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
