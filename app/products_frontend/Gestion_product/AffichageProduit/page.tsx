import { prisma } from '@/lib/prisma';
import { Pencil, Plus, PackageX } from 'lucide-react';
import DeleteProductButton from '../SuppimeProduit/DeleteProductButton';



export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  }
);



  return (
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Gestion des Produits
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Sofimed • Catalogue et inventaire en temps réel
            </p>
          </div>
          <a 
            href="/products_frontend/Gestion_product/AjouterProduit" 
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 text-sm"
          >
            <Plus size={18} />
            Ajouter un produit
          </a>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs uppercase tracking-wider font-semibold text-slate-500">
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Marque</th>
                  <th className="py-3.5 px-6">Bureau</th>
                  <th className="py-3.5 px-6">Prix</th>
                  <th className="py-3.5 px-6">Stock</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <PackageX size={32} className="text-slate-300" />
                        <p className="text-base font-medium text-slate-600">Aucun produit trouvé</p>
                        <p className="text-xs text-slate-400">Commencez par ajouter un produit au catalogue.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 text-xs font-mono text-slate-400">
                        {product.id}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {product.marque}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {product.bureau}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900">
                        {Number(product.prix).toLocaleString('fr-MA')} <span className="text-xs text-slate-500">DH</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.stock > 10 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                            : product.stock > 0 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}>
                          {product.stock} en stock
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/products_frontend/Gestion_product/ModifierProduit?id=${product.id}`}
                            aria-label={`Modifier ${product.marque}`}
                            title={`Modifier ${product.marque}`}
                            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <Pencil size={16} />
                          </a>
                          <DeleteProductButton productId={product.id} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}