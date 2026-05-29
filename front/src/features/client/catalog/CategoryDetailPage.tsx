import { useEffect, useState } from 'react'
import { ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { catalogClientApi, type ProductsResult } from '@/api/client/catalog'
import type { CategoryPreview } from '@/api/client/home'
import { EmptyState } from '@/components/client/EmptyState'
import { ProductCard, ProductSkeleton } from '@/components/client/ProductCard'

export function CategoryDetailPage() {
  const { slug = '' } = useParams()
  const [category, setCategory] = useState<CategoryPreview | null>(null)
  const [result, setResult] = useState<ProductsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('recent')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      catalogClientApi.category(slug),
      catalogClientApi.categoryProducts(slug, { sort, per_page: 24 }),
    ])
      .then(([categoryRes, productsRes]) => {
        setCategory(categoryRes.data.data)
        setResult(productsRes.data.data)
      })
      .catch(() => {
        setCategory(null)
        setResult(null)
      })
      .finally(() => setLoading(false))
  }, [slug, sort])

  const products = result?.products ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <Link to="/categories" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink mb-5">
        <ArrowLeft className="w-4 h-4" /> Categories
      </Link>

      <div className="bg-beige-50 border border-beige-200 rounded-3xl overflow-hidden shadow-beige mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
          <div className="p-6 lg:p-8">
            <p className="text-xs font-bold text-beige-500 uppercase tracking-widest mb-2">Categorie</p>
            <h1 className="font-serif font-bold text-ink text-3xl lg:text-4xl">{category?.nom ?? 'Categorie'}</h1>
            <p className="text-sm text-muted mt-3 max-w-2xl">
              {category?.description ?? 'Retrouvez tous les produits disponibles dans cette collection.'}
            </p>
            <p className="text-xs font-bold text-beige-500 mt-5">{result?.pagination.total ?? category?.produits_count ?? 0} produits</p>
          </div>
          <div className="hidden lg:block h-60 bg-beige-200">
            {category?.image && <img src={category.image} alt={category.nom} className="w-full h-full object-cover" />}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="font-serif font-bold text-ink text-xl">Produits</h2>
        <label className="flex items-center gap-2 text-sm text-muted">
          <SlidersHorizontal className="w-4 h-4" />
          <select
            value={sort}
            onChange={event => setSort(event.target.value)}
            className="bg-beige-50 border border-beige-300 rounded-xl py-2 pl-3 pr-8 text-sm text-ink focus:ring-beige-400"
          >
            <option value="recent">Recents</option>
            <option value="popular">Populaires</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix decroissant</option>
            <option value="rating">Meilleures notes</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
          {Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState label="Aucun produit dans cette categorie" note="De nouvelles pieces seront ajoutees bientot." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
          {products.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  )
}
