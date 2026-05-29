import { useEffect, useState } from 'react'
import { ImageIcon, Package, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { catalogClientApi } from '@/api/client/catalog'
import type { CategoryPreview } from '@/api/client/home'
import { EmptyState } from '@/components/client/EmptyState'

export function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    catalogClientApi.categories()
      .then(res => setCategories(res.data.data ?? []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = categories.filter(category =>
    category.nom.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
        <div>
          <p className="text-xs font-bold text-beige-500 uppercase tracking-widest mb-2">Collections</p>
          <h1 className="font-serif font-bold text-ink text-3xl lg:text-4xl">Categories</h1>
          <p className="text-sm text-muted mt-2">Explorez les collections disponibles dans la boutique.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" strokeWidth={1.5} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-beige-50 border border-beige-300 rounded-2xl text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40"
            placeholder="Rechercher une categorie"
            type="search"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-beige-50 border border-beige-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState label="Aucune categorie trouvee" note="Essayez une autre recherche." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(category => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              className="group bg-beige-50 border border-beige-200 rounded-3xl overflow-hidden shadow-beige hover:shadow-beige-lg transition-all"
            >
              <div className="relative h-48 bg-beige-200 overflow-hidden">
                {category.image ? (
                  <img src={category.image} alt={category.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-beige-400" strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                <div className="absolute left-4 bottom-4">
                  <h2 className="font-serif font-bold text-white text-2xl">{category.nom}</h2>
                  <p className="text-xs font-semibold text-white/80">{category.produits_count ?? 0} produits</p>
                </div>
              </div>
              <div className="p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-beige-200 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-beige-500" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-muted leading-relaxed line-clamp-2">
                  {category.description ?? 'Decouvrez les pieces selectionnees pour cette collection.'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
