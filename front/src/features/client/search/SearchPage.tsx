import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { catalogClientApi } from '@/api/client/catalog'
import { NProductCard } from '@/components/client/NProductCard'
import { NIcon } from '@/components/client/NIcon'

export function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['client-search', submitted],
    queryFn: () => catalogClientApi.products({ search: submitted, per_page: 24 }).then((r) => r.data.data),
    enabled: submitted.length >= 2,
  })

  const products = data?.products ?? []

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim().length >= 2) setSubmitted(query.trim())
  }

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur-xl border-b border-line">
        <div className="flex items-center h-14 px-4 gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors">
            <NIcon name="back" size={20} strokeWidth={1.8} />
          </button>
          <span className="font-serif font-semibold text-[17px] text-ink">Recherche</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Desktop title */}
        <div className="hidden md:block mb-6">
          <h1 className="font-serif font-bold text-[32px] text-ink">Recherche</h1>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <NIcon name="search" size={18} strokeWidth={1.7}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit, wax, bazin…"
              className="w-full h-12 pl-11 pr-4 border border-line-2 rounded-full bg-white text-[14px] text-ink
                placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button type="submit"
            className="px-6 h-12 rounded-full bg-accent text-white text-[13px] font-semibold hover:bg-accent-dark transition-colors">
            Chercher
          </button>
        </form>

        {/* Results */}
        {!submitted && (
          <div className="text-center py-16 text-muted">
            <NIcon name="search" size={40} strokeWidth={1.4} className="mx-auto mb-3 opacity-30" />
            <p className="text-[14px]">Tapez un mot-clé pour rechercher</p>
          </div>
        )}

        {submitted && isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-sand rounded-[14px] animate-pulse" />
            ))}
          </div>
        )}

        {submitted && !isLoading && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[15px] text-ink font-semibold">Aucun résultat pour "{submitted}"</p>
            <p className="text-[13px] text-muted mt-1">Essayez un autre terme.</p>
          </div>
        )}

        {products.length > 0 && (
          <>
            <p className="text-[12px] text-muted mb-4">{data?.pagination.total} résultats pour "{submitted}"</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 md:gap-5">
              {products.map((p) => <NProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </div>
    </>
  )
}
