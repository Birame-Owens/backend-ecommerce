import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { catalogClientApi } from '@/api/client/catalog'
import type { CategoryPreview } from '@/api/client/home'
import { NIcon } from '@/components/client/NIcon'

/* ── Mobile header ── */
function PageHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur-xl border-b border-line">
      <div className="flex items-center h-14 px-4 gap-3">
        {onBack && (
          <button onClick={onBack} className="w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors">
            <NIcon name="back" size={20} strokeWidth={1.8} />
          </button>
        )}
        <span className="font-serif font-semibold text-[17px] text-ink flex-1">
          {onBack ? title : 'Catégories'}
        </span>
      </div>
    </header>
  )
}

/* ── Category card ── */
function CatCard({ cat, onClick }: { cat: CategoryPreview; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-[16px] overflow-hidden bg-sand border border-line
        shadow-sm hover:shadow-card-lg transition-all duration-300 text-left"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-sand to-camel/30">
        {cat.image ? (
          <img src={cat.image} alt={cat.nom}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sand to-camel/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute left-4 bottom-4 right-4">
          <h2 className="font-serif font-bold text-white text-[18px] md:text-[20px] leading-tight">{cat.nom}</h2>
          <p className="text-[11px] text-white/75 mt-0.5">{cat.produits_count ?? 0} produits</p>
        </div>
      </div>
      {/* Description */}
      {cat.description && (
        <div className="px-4 py-3">
          <p className="text-[12.5px] text-muted leading-relaxed line-clamp-2">{cat.description}</p>
        </div>
      )}
    </button>
  )
}

/* ── Subcategory small card ── */
function SubCatCard({ cat }: { cat: CategoryPreview }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/categories/${cat.slug}`)}
      className="group flex items-center gap-3.5 p-3.5 bg-white rounded-[12px] border border-line
        shadow-sm hover:border-accent/40 hover:shadow-card transition-all text-left"
    >
      <div className="w-12 h-12 rounded-full overflow-hidden bg-sand flex-shrink-0 border border-line-2
        transition-transform duration-300 group-hover:scale-105">
        {cat.image
          ? <img src={cat.image} alt={cat.nom} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-sand to-camel/40" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13.5px] text-ink truncate">{cat.nom}</p>
        <p className="text-[11.5px] text-muted mt-0.5">{cat.produits_count ?? 0} produits</p>
      </div>
      <NIcon name="fwd" size={16} strokeWidth={2} className="text-muted flex-shrink-0" />
    </button>
  )
}

/* ── Page ── */
export function CategoriesPage() {
  const navigate = useNavigate()
  const [selectedParent, setSelectedParent] = useState<CategoryPreview | null>(null)

  // Précharge les chunks JS des pages suivantes pour éviter l'écran blanc au clic
  // (le chunk est téléchargé en arrière-plan pendant que l'utilisateur regarde les catégories).
  useEffect(() => {
    import('@/features/client/catalog/CategoryDetailPage')
    import('@/features/client/catalog/ProductDetailPage')
  }, [])

  const { data: allCats = [], isLoading } = useQuery({
    queryKey: ['client-categories'],
    queryFn: () => catalogClientApi.categories().then((r) => r.data.data),
  })

  const parents = allCats.filter((c) => !c.parent_id)
  const subcats = selectedParent
    ? allCats.filter((c) => c.parent_id === selectedParent.id)
    : []

  if (isLoading) {
    return (
      <>
        <PageHeader title="" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-sand rounded-[16px] animate-pulse" />
            ))}
          </div>
        </div>
      </>
    )
  }

  /* ─ Subcategories view ─ */
  if (selectedParent) {
    return (
      <>
        <PageHeader title={selectedParent.nom} onBack={() => setSelectedParent(null)} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          {/* Desktop back link */}
          <button onClick={() => setSelectedParent(null)}
            className="hidden md:inline-flex items-center gap-2 text-[13px] font-semibold text-muted hover:text-ink mb-6 transition-colors">
            <NIcon name="back" size={16} strokeWidth={2} /> Toutes les catégories
          </button>

          {/* Category header */}
          <div className="flex items-start gap-5 mb-7">
            {selectedParent.image && (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-line-2 flex-shrink-0">
                <img src={selectedParent.image} alt={selectedParent.nom} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <p className="text-[10px] font-semibold tracking-[.2em] uppercase text-accent mb-1">Catégorie</p>
              <h1 className="font-serif font-bold text-[24px] md:text-[32px] text-ink leading-none">{selectedParent.nom}</h1>
              {selectedParent.description && (
                <p className="text-[13px] text-muted mt-2 max-w-lg">{selectedParent.description}</p>
              )}
            </div>
          </div>

          {subcats.length > 0 ? (
            <>
              <h2 className="font-serif font-semibold text-[18px] md:text-[22px] text-ink mb-4">
                Sous-catégories
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subcats.map((sc) => <SubCatCard key={sc.id} cat={sc} />)}
              </div>
              <div className="mt-6 pt-5 border-t border-line">
                <button
                  onClick={() => navigate(`/categories/${selectedParent.slug}`)}
                  className="inline-flex items-center gap-2 px-6 h-11 rounded-[10px] bg-accent text-white
                    text-[12px] font-semibold tracking-widest uppercase hover:bg-accent-dark transition-colors"
                >
                  Tous les produits <NIcon name="arrow" size={14} strokeWidth={2} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted text-[14px]">Aucune sous-catégorie · </p>
              <button
                onClick={() => navigate(`/categories/${selectedParent.slug}`)}
                className="mt-4 inline-flex items-center gap-2 px-6 h-11 rounded-[10px] bg-accent text-white
                  text-[12px] font-semibold tracking-widest uppercase hover:bg-accent-dark transition-colors"
              >
                Voir les produits <NIcon name="arrow" size={14} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </>
    )
  }

  /* ─ Parent categories view ─ */
  return (
    <>
      <PageHeader title="" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Desktop page title */}
        <div className="hidden md:block mb-8">
          <p className="text-[10px] font-semibold tracking-[.2em] uppercase text-accent mb-2">Collections</p>
          <h1 className="font-serif font-bold text-[34px] text-ink">Catégories</h1>
          <p className="text-[14px] text-muted mt-2">Explorez toutes nos collections.</p>
        </div>

        {parents.length === 0 ? (
          <div className="text-center py-16 text-muted">Aucune catégorie disponible.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {parents.map((cat) => {
              const hasSubs = allCats.some((c) => c.parent_id === cat.id)
              return (
                <CatCard
                  key={cat.id}
                  cat={cat}
                  onClick={() => hasSubs ? setSelectedParent(cat) : navigate(`/categories/${cat.slug}`)}
                />
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
