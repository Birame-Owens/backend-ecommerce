import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { catalogClientApi } from '@/api/client/catalog'
import type { CategoryPreview } from '@/api/client/home'
import { NProductCard } from '@/components/client/NProductCard'
import { NIcon } from '@/components/client/NIcon'
import { SeoHead } from '@/components/client/SeoHead'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }

const QUICK_FILTERS = [
  { value: 'all',       label: 'Trier par' },
  { value: 'populaire', label: 'Populaire' },
  { value: 'nouveaute', label: 'Nouveauté' },
  { value: 'promo',     label: 'Promotion' },
] as const
type QuickFilter = (typeof QUICK_FILTERS)[number]['value']

/* ── Filter drawer (price only) ── */
function FilterDrawer({
  open, onClose,
  priceMin, priceMax,
  onChange, onApply, onReset,
}: {
  open: boolean
  onClose: () => void
  priceMin: string
  priceMax: string
  onChange: (k: string, v: string) => void
  onApply: () => void
  onReset: () => void
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[300px] sm:w-[340px] bg-white shadow-card-lg flex flex-col
          transition-transform duration-[320ms] ease-[cubic-bezier(.22,.61,.36,1)]
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-line flex-shrink-0">
          <h3 className="font-serif font-semibold text-[17px] text-ink">Filtres</h3>
          <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-full hover:bg-paper transition-colors">
            <NIcon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="text-[12px] font-semibold tracking-wide uppercase text-ink-2 mb-3">Prix (F CFA)</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-muted mb-1 block">Min</label>
              <input type="number" placeholder="0" value={priceMin}
                onChange={(e) => onChange('priceMin', e.target.value)}
                className="w-full h-10 px-3 border border-line rounded-[8px] text-[13px] text-ink focus:outline-none focus:border-accent bg-paper" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-muted mb-1 block">Max</label>
              <input type="number" placeholder="Sans limite" value={priceMax}
                onChange={(e) => onChange('priceMax', e.target.value)}
                className="w-full h-10 px-3 border border-line rounded-[8px] text-[13px] text-ink focus:outline-none focus:border-accent bg-paper" />
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-5 py-4 border-t border-line flex gap-3">
          <button onClick={onReset}
            className="flex-1 h-10 rounded-[8px] border border-line text-[12px] font-semibold text-ink-2 hover:bg-paper transition-colors">
            Réinitialiser
          </button>
          <button onClick={() => { onApply(); onClose() }}
            className="flex-1 h-10 rounded-[8px] bg-accent text-white text-[12px] font-semibold hover:bg-accent-dark transition-colors">
            Appliquer
          </button>
        </div>
      </div>
    </>
  )
}

/* ── Page ── */
export function CategoryDetailPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const toolbarRef = useRef<HTMLDivElement>(null)

  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [pendingMin, setPendingMin] = useState('')
  const [pendingMax, setPendingMax] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [extraProducts, setExtraProducts] = useState<import('@/api/client/home').ProductClient[]>([])
  const [selectedSubcat, setSelectedSubcat] = useState<string | null>(null)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')

  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ['client-category', slug],
    queryFn: () => catalogClientApi.category(slug).then((r) => r.data.data),
    enabled: !!slug,
  })

  const subcats = category?.subcategories ?? []
  const isParent = subcats.length > 0

  const { data: allCats = [] } = useQuery({
    queryKey: ['client-categories'],
    queryFn: () => catalogClientApi.categories().then((r) => r.data.data),
    staleTime: 300_000,
  })
  const parentCat = category?.parent_id
    ? allCats.find((c) => c.id === category.parent_id) ?? null
    : null

  useEffect(() => {
    setCurrentPage(1)
    setExtraProducts([])
  }, [priceMin, priceMax, slug, selectedSubcat, quickFilter])

  useEffect(() => {
    setSelectedSubcat(null)
    setQuickFilter('all')
  }, [slug])

  const activeSlug = selectedSubcat ?? slug

  /* Build extra API params from quickFilter */
  function quickParams() {
    if (quickFilter === 'populaire') return { est_populaire: true }
    if (quickFilter === 'nouveaute') return { est_nouveaute: true }
    if (quickFilter === 'promo') return { on_sale: true }
    return {}
  }

  const { data: productsData, isLoading: productsLoading, isError: productsError } = useQuery({
    queryKey: ['client-category-products', activeSlug, priceMin, priceMax, quickFilter],
    queryFn: () =>
      catalogClientApi.categoryProducts(activeSlug, {
        min_price: priceMin || undefined,
        max_price: priceMax || undefined,
        per_page: 24,
        page: 1,
        ...quickParams(),
      }).then((r) => r.data.data),
    enabled: !!slug && !!category,
  })

  const loadMore = useCallback(async () => {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const next = currentPage + 1
      const qp = quickFilter === 'populaire' ? { est_populaire: true }
        : quickFilter === 'nouveaute' ? { est_nouveaute: true }
        : quickFilter === 'promo' ? { on_sale: true }
        : {}
      const res = await catalogClientApi.categoryProducts(selectedSubcat ?? slug, {
        min_price: priceMin || undefined, max_price: priceMax || undefined,
        per_page: 24, page: next, ...qp,
      })
      setExtraProducts((prev) => [...prev, ...res.data.data.products])
      setCurrentPage(next)
    } finally {
      setLoadingMore(false)
    }
  }, [selectedSubcat, slug, priceMin, priceMax, quickFilter, currentPage, loadingMore])

  /* Nouveautés highlight — leaf only, admin-flagged products */
  const { data: newData } = useQuery({
    queryKey: ['client-cat-new', slug],
    queryFn: () =>
      catalogClientApi.categoryProducts(slug, { est_nouveaute: true, per_page: 4, page: 1 }).then((r) => r.data.data),
    enabled: !!slug && !!category && !isParent,
    staleTime: 300_000,
  })

  const products = [...(productsData?.products ?? []), ...extraProducts]
  const total = productsData?.pagination.total ?? 0
  const hasMore = productsData?.pagination.has_more && extraProducts.length < (total - (productsData?.products.length ?? 0))
  const newArrivals = newData?.products.slice(0, 4) ?? []
  const priceFilterActive = !!(priceMin || priceMax)

  function openFilter() {
    setPendingMin(priceMin); setPendingMax(priceMax)
    setFilterOpen(true)
  }
  function applyFilter() { setPriceMin(pendingMin); setPriceMax(pendingMax) }
  function resetFilter() { setPendingMin(''); setPendingMax('') }

  if (catLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-[15px] text-muted">Catégorie introuvable.</p>
        <button onClick={() => navigate('/categories')}
          className="mt-4 text-[13px] font-semibold text-accent underline">
          Voir toutes les catégories
        </button>
      </div>
    )
  }

  const activeFilterLabel = quickFilter === 'all' ? null
    : QUICK_FILTERS.find((f) => f.value === quickFilter)?.label
  const categoryDescription = category.description
    ?? `Decouvrez les produits ${category.nom} chez ND WORLD, disponibles en ligne avec livraison au Senegal.`
  const categorySeo = (
    <SeoHead
      title={`${category.nom} | ND WORLD`}
      description={categoryDescription}
      canonical={`/categories/${category.slug}`}
      image={category.image}
      keywords={[category.nom, 'ND WORLD', 'boutique en ligne Senegal', 'Dakar']}
      structuredData={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: category.nom,
        description: categoryDescription,
        url: `/categories/${category.slug}`,
      }}
    />
  )

  /* ── Shared header (centered, white bg) ── */
  const pageHeader = (
    <header className="bg-white border-b border-line pt-8 pb-10 md:pt-14 md:pb-12 text-center">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted mb-4 flex items-center justify-center gap-2">
          <button onClick={() => navigate('/')} className="hover:text-ink transition-colors">Accueil</button>
          <span>/</span>
          <button onClick={() => navigate('/categories')} className="hover:text-ink transition-colors">Catégories</button>
          {parentCat && (
            <>
              <span>/</span>
              <button onClick={() => navigate(`/categories/${parentCat.slug}`)} className="hover:text-ink transition-colors">{parentCat.nom}</button>
            </>
          )}
          <span>/</span>
          <span className="text-ink">{category.nom}</span>
        </div>
        <h1 className="text-[32px] md:text-[52px] font-light uppercase tracking-widest mb-3 text-ink">
          {category.nom}
        </h1>
        {category.description && (
          <p className="text-[13px] text-muted max-w-xl mx-auto leading-relaxed">{category.description}</p>
        )}
      </div>
    </header>
  )

  /* ── Shared toolbar ── */
  const toolbar = (
    <div className="sticky top-14 md:top-[66px] z-20 bg-white/95 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">

        {/* Left: Filtres + count */}
        <div className="flex items-center gap-5">
          <button
            onClick={openFilter}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest hover:text-muted transition-colors"
          >
            <NIcon name="filter" size={15} strokeWidth={2} />
            Filtres
            {priceFilterActive && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
          </button>
          <span className="hidden md:inline text-[10px] text-muted uppercase tracking-widest border-l border-line pl-5">
            {total} produit{total > 1 ? 's' : ''}
          </span>
        </div>

        {/* Right: active price chips + Trier par + view mode */}
        <div className="flex items-center gap-5">
          {priceMin && (
            <button onClick={() => setPriceMin('')}
              className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-accent uppercase tracking-widest">
              Min: {fmt(Number(priceMin))} <NIcon name="close" size={10} />
            </button>
          )}
          {priceMax && (
            <button onClick={() => setPriceMax('')}
              className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-accent uppercase tracking-widest">
              Max: {fmt(Number(priceMax))} <NIcon name="close" size={10} />
            </button>
          )}

          {/* Trier par — text label + hidden select */}
          <div className="relative flex items-center gap-1.5 cursor-pointer">
            <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${activeFilterLabel ? 'text-accent' : 'text-ink'}`}>
              {activeFilterLabel ?? 'Trier par'}
            </span>
            <NIcon name="fwd" size={11} strokeWidth={2} className="rotate-90 text-muted" />
            <select
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value as QuickFilter)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              {QUICK_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* View mode */}
          <div className="hidden sm:flex items-center gap-2 border-l border-line pl-5">
            <button onClick={() => setViewMode('grid')}
              className={`transition-colors ${viewMode === 'grid' ? 'text-ink' : 'text-muted hover:text-ink'}`}>
              <NIcon name="grid" size={15} strokeWidth={2} />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`transition-colors ${viewMode === 'list' ? 'text-ink' : 'text-muted hover:text-ink'}`}>
              <NIcon name="filter" size={15} strokeWidth={2} />
            </button>
          </div>
        </div>

      </div>
    </div>
  )

  const productList = productsError ? (
    <div className="py-20 text-center" role="alert">
      <p className="text-[15px] text-muted mb-3">Impossible de charger les produits.</p>
      <button onClick={() => window.location.reload()}
        className="text-[13px] font-semibold text-accent underline">Réessayer</button>
    </div>
  ) : productsLoading ? (
    <div className={viewMode === 'grid'
      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 md:gap-5'
      : 'space-y-3'}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={viewMode === 'grid'
          ? 'aspect-[3/4] bg-sand rounded-[14px] animate-pulse'
          : 'h-24 bg-sand rounded-[12px] animate-pulse'} />
      ))}
    </div>
  ) : products.length === 0 ? (
    <div className="py-20 text-center">
      <p className="text-[15px] text-muted">Aucun produit trouvé.</p>
      {(priceFilterActive || quickFilter !== 'all') && (
        <button onClick={() => { setPriceMin(''); setPriceMax(''); setQuickFilter('all') }}
          className="mt-4 text-[13px] font-semibold text-accent underline">
          Effacer les filtres
        </button>
      )}
    </div>
  ) : viewMode === 'list' ? (
    <div className="space-y-3 pb-8">
      {products.map((p) => (
        <button key={p.id} onClick={() => navigate(`/produits/${p.slug}`)}
          className="w-full flex items-center gap-4 p-3.5 bg-white rounded-[12px] border border-line shadow-sm
            hover:border-accent/30 hover:shadow-card transition-all text-left">
          <div className="w-16 h-20 rounded-[10px] overflow-hidden bg-sand flex-shrink-0">
            {p.image_principale
              ? <img src={p.image_principale} alt={p.nom} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-sand to-line" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-medium text-ink line-clamp-2">{p.nom}</p>
            <p className="text-[13px] font-semibold text-accent mt-1">
              {fmt(p.prix_promo ?? p.prix)}
              {p.prix_promo && (
                <span className="ml-2 text-[11px] text-muted line-through font-normal">{fmt(p.prix)}</span>
              )}
            </p>
            {p.note_moyenne ? (
              <p className="text-[11.5px] text-muted mt-0.5">★ {p.note_moyenne.toFixed(1)}</p>
            ) : null}
          </div>
          <NIcon name="fwd" size={16} strokeWidth={2} className="text-muted flex-shrink-0" />
        </button>
      ))}
    </div>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 md:gap-5">
      {products.map((p) => <NProductCard key={p.id} product={p} />)}
    </div>
  )

  const loadMoreBtn = !productsLoading && !productsError && hasMore && (
    <div className="flex justify-center pt-6 pb-8">
      <button
        onClick={loadMore}
        disabled={loadingMore}
        className="inline-flex items-center gap-2.5 px-8 h-12 rounded-full border border-line
          text-[13px] font-semibold text-ink hover:border-accent hover:text-accent
          transition-colors disabled:opacity-50"
      >
        {loadingMore
          ? <><span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />Chargement...</>
          : <>Charger plus <NIcon name="arrow" size={14} strokeWidth={2} /></>}
      </button>
    </div>
  )

  const filterDrawer = (
    <FilterDrawer
      open={filterOpen}
      onClose={() => setFilterOpen(false)}
      priceMin={pendingMin}
      priceMax={pendingMax}
      onChange={(k, v) => {
        if (k === 'priceMin') setPendingMin(v)
        if (k === 'priceMax') setPendingMax(v)
      }}
      onApply={applyFilter}
      onReset={resetFilter}
    />
  )

  const productContent = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      <p className="text-[11px] text-muted uppercase tracking-widest py-4">{total} produit{total > 1 ? 's' : ''}</p>
      {productList}
      {loadMoreBtn}
      {!productsLoading && !hasMore && products.length > 0 && (
        <p className="text-center text-[11px] text-muted py-6">{total} produit{total > 1 ? 's' : ''} au total</p>
      )}
    </div>
  )

  /* ════════════════════════════════════════════
     PARENT MODE — has subcategories
  ════════════════════════════════════════════ */
  if (isParent) {
    return (
      <>
        {categorySeo}

        {/* Mobile back header */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-line">
          <div className="flex items-center h-14 px-4 gap-3">
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors">
              <NIcon name="back" size={20} strokeWidth={1.8} />
            </button>
            <span className="font-semibold text-[16px] text-ink flex-1 truncate uppercase tracking-wide">{category.nom}</span>
          </div>
        </header>

        {/* Centered page header */}
        <div className="hidden md:block">{pageHeader}</div>

        {/* Subcategory tabs — own full-width row */}
        <div className="bg-white border-b border-line overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-0">
            <button
              onClick={() => setSelectedSubcat(null)}
              className={`flex-shrink-0 px-5 py-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${
                selectedSubcat === null ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              Tout
            </button>
            {subcats.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedSubcat(sc.slug)}
                className={`flex-shrink-0 px-5 py-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${
                  selectedSubcat === sc.slug ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {sc.nom}
              </button>
            ))}
          </div>
        </div>

        {toolbar}
        {productContent}
        {filterDrawer}
      </>
    )
  }

  /* ════════════════════════════════════════════
     LEAF MODE — no subcategories
  ════════════════════════════════════════════ */
  return (
    <>
      {categorySeo}

      {/* Mobile back header */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-line">
        <div className="flex items-center h-14 px-4 gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors">
            <NIcon name="back" size={20} strokeWidth={1.8} />
          </button>
          <span className="font-semibold text-[16px] text-ink flex-1 truncate uppercase tracking-wide">{category.nom}</span>
        </div>
      </header>

      {pageHeader}

      {/* Nouveautés highlight — only when no filter active */}
      {newArrivals.length > 0 && quickFilter === 'all' && !priceFilterActive && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 border-b border-line">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-semibold text-[17px] md:text-[20px] text-ink">Nouveautés</h2>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Derniers arrivages</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {newArrivals.map((p) => <NProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {toolbar}
      {productContent}
      {filterDrawer}
    </>
  )
}
