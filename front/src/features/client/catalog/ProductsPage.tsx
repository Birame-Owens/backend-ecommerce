import { useEffect, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { catalogClientApi, type ProductsResult } from '@/api/client/catalog'
import { EmptyState } from '@/components/client/EmptyState'
import { ProductCard, ProductSkeleton } from '@/components/client/ProductCard'

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [result, setResult] = useState<ProductsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'recent')

  useEffect(() => {
    setLoading(true)
    catalogClientApi.products({
      search: searchParams.get('search') ?? undefined,
      sort: searchParams.get('sort') ?? 'recent',
      on_sale: searchParams.get('promos') ? true : undefined,
      per_page: 30,
    })
      .then(res => setResult(res.data.data))
      .catch(() => setResult(null))
      .finally(() => setLoading(false))
  }, [searchParams])

  function applyFilters() {
    const next = new URLSearchParams()
    if (search.trim()) next.set('search', search.trim())
    if (sort !== 'recent') next.set('sort', sort)
    setSearchParams(next)
  }

  const products = result?.products ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-7">
        <div>
          <p className="text-xs font-bold text-beige-500 uppercase tracking-widest mb-2">Boutique</p>
          <h1 className="font-serif font-bold text-ink text-3xl lg:text-4xl">Produits</h1>
          <p className="text-sm text-muted mt-2">{result?.pagination.total ?? 0} produits disponibles</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" strokeWidth={1.5} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') applyFilters() }}
              className="w-full pl-10 pr-4 py-3 bg-beige-50 border border-beige-300 rounded-2xl text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40"
              placeholder="Rechercher"
              type="search"
            />
          </div>
          <label className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted" />
            <select
              value={sort}
              onChange={event => setSort(event.target.value)}
              className="bg-beige-50 border border-beige-300 rounded-2xl py-3 pl-3 pr-8 text-sm text-ink focus:ring-beige-400"
            >
              <option value="recent">Recents</option>
              <option value="popular">Populaires</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix decroissant</option>
              <option value="rating">Meilleures notes</option>
            </select>
          </label>
          <button onClick={applyFilters} className="px-5 py-3 bg-ink text-white text-sm font-bold rounded-2xl hover:bg-beige-500 transition-colors">
            Filtrer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
          {Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState label="Aucun produit trouve" note="Essayez de modifier votre recherche." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
          {products.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  )
}
