import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Package, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      equipmentRequests: {
        where: { status: "Acceptée" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!product) notFound();

  const recipients = new Map<number, { name: string; email: string; quantity: number; lastAssigned: Date }>();
  for (const request of product.equipmentRequests) {
    const recipient = recipients.get(request.user.id);
    if (recipient) recipient.quantity += 1;
    else recipients.set(request.user.id, {
      name: request.user.name,
      email: request.user.email,
      quantity: 1,
      lastAssigned: request.createdAt,
    });
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <Link href="/products_frontend/Gestion_product/AffichageProduit" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700">
        <ArrowLeft size={16} aria-hidden="true" />
        Retour au stock
      </Link>

      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Détail du produit · #{product.id}</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">{product.marque}</h1>
          <p className="mt-1 text-sm text-slate-600">Bureau {product.bureau} · {Number(product.prix).toLocaleString("fr-MA")} DH</p>
        </div>
        <Link href={`/products_frontend/Gestion_product/ModifierProduit?id=${product.id}`} className="text-sm font-medium text-teal-700 hover:text-teal-900">
          Modifier le produit
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Résumé du stock">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <Package size={19} className="text-teal-700" aria-hidden="true" />
          <p className="mt-4 text-sm text-slate-500">Quantité initiale</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{product.initialStock}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <Package size={19} className="text-emerald-700" aria-hidden="true" />
          <p className="mt-4 text-sm text-slate-500">Stock restant</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{product.stock}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <Users size={19} className="text-amber-700" aria-hidden="true" />
          <p className="mt-4 text-sm text-slate-500">Unités attribuées</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{product.equipmentRequests.length}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Utilisateurs ayant reçu ce produit</h2>
        </div>
        {recipients.size === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">Aucune demande acceptée pour ce produit.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Utilisateur</th>
                  <th className="px-5 py-3 font-medium">E-mail</th>
                  <th className="px-5 py-3 font-medium">Unités</th>
                  <th className="px-5 py-3 font-medium">Dernière attribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...recipients.values()].map((recipient) => (
                  <tr key={recipient.email}>
                    <td className="px-5 py-4 font-medium text-slate-900">{recipient.name}</td>
                    <td className="px-5 py-4 text-slate-600">{recipient.email}</td>
                    <td className="px-5 py-4 text-slate-600">{recipient.quantity}</td>
                    <td className="px-5 py-4 text-slate-600">{recipient.lastAssigned.toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}