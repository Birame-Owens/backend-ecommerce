import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Heart, ShoppingBag, Star,
  Package, Users, Award, Truck, Sparkles, ImageIcon, ArrowRight,
} from 'lucide-react'
import { homeClientApi, type HomeData, type CategoryPreview, type ProductClient } from '@/api/client/home'

function fmt(n: number | undefined | null) { return (n ?? 0).toLocaleString('fr-FR') }

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, linkTo }: { title: string; subtitle?: string; linkTo?: string }) {
  return (
    <div className="flex items-end justify-between mb-5 lg:mb-7">
      <div>
        <h2 className="font-serif font-bold text-ink text-xl sm:text-2xl lg:text-3xl">{title}</h2>
        {subtitle && <p className="text-xs sm:text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-beige-500 hover:text-beige-400 transition-colors">
          Voir tout <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: ProductClient }) {
  const [liked, setLiked] = useState(false)

  return (
    <Link
      to={`/produits/${product.slug}`}
      className="block bg-beige-50 rounded-2xl overflow-hidden border border-beige-200 shadow-beige hover:shadow-beige-lg transition-all group"
    >
      <div className="relative aspect-square bg-beige-200 overflow-hidden">
        {product.image_principale
          ? <img
              src={product.image_principale}
              alt={product.nom}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          : <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-beige-400" strokeWidth={1} />
            </div>
        }

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.en_promo && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full shadow-sm">Promo</span>
          )}
          {product.est_nouveaute && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-beige-500 text-white rounded-full shadow-sm">Nouveau</span>
          )}
        </div>

        <button
          onClick={e => { e.preventDefault(); setLiked(v => !v) }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
            liked ? 'bg-beige-500 text-white' : 'bg-beige-50/90 text-muted hover:bg-beige-200'
          }`}
        >
          <Heart className="w-4 h-4" strokeWidth={liked ? 0 : 1.5} fill={liked ? 'currentColor' : 'none'} />
        </button>

        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={e => e.preventDefault()}
            className="w-full py-2.5 bg-beige-500/95 backdrop-blur-sm text-white text-xs font-bold tracking-wide flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" strokeWidth={2} />
            Ajouter au panier
          </button>
        </div>
      </div>

      <div className="p-3">
        {product.categorie && (
          <p className="text-[10px] font-semibold text-beige-500 uppercase tracking-widest mb-0.5">{product.categorie.nom}</p>
        )}
        <h3 className="text-sm font-semibold text-ink truncate mb-1.5">{product.nom}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm text-ink">{fmt(product.prix_actuel)} F</span>
            {product.en_promo && product.prix_promo && (
              <span className="text-xs text-muted line-through">{fmt(product.prix)} F</span>
            )}
          </div>
          {product.note_moyenne != null && (
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" strokeWidth={0} />
              <span className="text-[11px] font-semibold text-muted">{product.note_moyenne}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function ProductSkeleton() {
  return (
    <div className="bg-beige-50 rounded-2xl overflow-hidden border border-beige-200">
      <div className="aspect-square bg-beige-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 bg-beige-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-beige-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-beige-200 rounded animate-pulse" />
      </div>
    </div>
  )
}

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({ cat }: { cat: CategoryPreview }) {
  return (
    <Link to={`/categories/${cat.slug}`} className="flex flex-col items-center gap-2 sm:gap-3 group">
      <div className="w-20 h-20 sm:w-full sm:aspect-square rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-beige-200 group-hover:border-beige-400 shadow-beige group-hover:shadow-beige-lg group-hover:scale-105 transition-all duration-200">
        {cat.image
          ? <img src={cat.image} alt={cat.nom} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-beige-200 flex items-center justify-center">
              <Package className="w-7 h-7 sm:w-9 sm:h-9 lg:w-11 lg:h-11 text-beige-400" strokeWidth={1.5} />
            </div>
        }
      </div>
      <span className="text-[11px] sm:text-sm lg:text-base font-semibold text-ink text-center leading-tight group-hover:text-beige-500 transition-colors">{cat.nom}</span>
    </Link>
  )
}

function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="w-20 h-20 sm:w-full sm:aspect-square rounded-2xl sm:rounded-3xl bg-beige-200 animate-pulse" />
      <div className="h-3 w-14 sm:w-20 bg-beige-200 rounded animate-pulse" />
    </div>
  )
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown() {
  const [time, setTime] = useState({ h: 4, m: 23, s: 47 })

  useEffect(() => {
    const t = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev
        s -= 1
        if (s < 0) { s = 59; m -= 1 }
        if (m < 0) { m = 59; h -= 1 }
        if (h < 0) { h = 23; m = 59; s = 59 }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-2">
      {[pad(time.h), pad(time.m), pad(time.s)].map((val, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl text-white font-mono">
            {val}
          </span>
          {i < 2 && <span className="text-white/70 font-bold text-lg">:</span>}
        </span>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ label, note }: { label: string; note?: string }) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 bg-beige-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-7 h-7 text-beige-400" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-ink mb-1">{label}</p>
      {note && <p className="text-xs text-muted">{note}</p>}
    </div>
  )
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

export function HomePage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    homeClientApi.home()
      .then(res => {
        const body = res.data as any
        setData(body?.data ?? body ?? null)
      })
      .catch(() => {/* show empty state */})
      .finally(() => setLoading(false))
  }, [])

  const categories = (data?.categories_preview ?? []).filter(c => c.parent_id == null)
  const featured = data?.featured_products ?? []
  const newArrivals = data?.new_arrivals ?? []
  const stats = data?.shop_stats
  const hero = data?.hero_banner?.default_message

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="pt-4 sm:pt-6 lg:pt-10 pb-6 lg:pb-10">
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #B68A64 0%, #C9A98A 50%, #D4B896 100%)' }}
        >
          {/* Blobs décoratifs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #FFFDF9, transparent)' }} />
          <div className="absolute -bottom-20 -left-8 w-48 h-48 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #EFE4D6, transparent)' }} />

          {/* Motif */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '24px 24px' }} />

          {/* Grille 2 colonnes sur desktop */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 min-h-[280px] sm:min-h-[360px] lg:min-h-[460px]">

            {/* Colonne gauche — texte */}
            <div className="p-6 sm:p-10 lg:p-14 flex flex-col justify-between">
              <div className="flex items-start justify-between lg:justify-start gap-4">
                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-bold text-white tracking-widest uppercase">
                  ✨ Nouvelle Collection
                </span>
                {/* Logo mini — masqué sur desktop (apparaît dans la colonne droite) */}
                <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg lg:hidden flex-shrink-0">
                  <img src="/logo rokia.jpg" alt="" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="mt-6 lg:mt-auto">
                <h1 className="font-serif font-bold text-white text-2xl sm:text-4xl lg:text-5xl leading-tight mb-3 drop-shadow-sm">
                  {hero?.titre ?? 'Élégance moderne\npour votre style'}
                </h1>
                <p className="text-white/80 text-sm sm:text-base lg:text-lg mb-6 max-w-md">
                  {hero?.description ?? 'Découvrez nos collections premium inspirées de la mode africaine moderne.'}
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Link
                    to="/produits"
                    className="flex items-center gap-2 px-5 py-3 bg-white text-ink text-sm font-bold rounded-2xl shadow-lg hover:bg-beige-100 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" strokeWidth={2} />
                    Découvrir
                  </Link>
                  <Link
                    to="/promotions"
                    className="flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm border border-white/40 text-white text-sm font-bold rounded-2xl hover:bg-white/30 transition-colors"
                  >
                    Promotions
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Colonne droite — décorative, desktop uniquement */}
            <div className="hidden lg:flex items-center justify-center p-10 relative">
              <div className="w-72 h-72 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl">
                <img src="/logo rokia.jpg" alt="Rokia Shop" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-16 right-16 w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/40 shadow-xl rotate-6">
                <img src="/logo rokia.jpg" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-16 right-40 w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg -rotate-3">
                <img src="/logo rokia.jpg" alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      {stats && (
        <div className="pb-8 lg:pb-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-5">
            {[
              { icon: Package, val: fmt(stats.produits_disponibles), label: 'Produits disponibles' },
              { icon: Users, val: fmt(stats.clients_satisfaits), label: 'Clients satisfaits' },
              { icon: Award, val: `${stats.annees_experience} ans`, label: "D'expérience" },
              { icon: Truck, val: `${fmt(stats.livraison_gratuite_seuil / 1000)}k F`, label: 'Livraison gratuite dès' },
            ].map(({ icon: Icon, val, label }) => (
              <div key={label} className="bg-beige-50 rounded-2xl p-4 lg:p-6 text-center border border-beige-200 shadow-beige">
                <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-beige-500 mx-auto mb-2" strokeWidth={1.5} />
                <p className="font-bold text-ink text-sm sm:text-base lg:text-xl">{val}</p>
                <p className="text-[10px] sm:text-xs text-muted mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CATÉGORIES ───────────────────────────────────────────────────── */}
      <div className="pb-8 lg:pb-12">
        <SectionHeader title="Catégories" subtitle="Explorez nos collections" linkTo="/categories" />

        {loading ? (
          <>
            {/* Skeleton mobile scroll */}
            <div className="flex gap-4 overflow-x-auto pb-2 sm:hidden" style={{ scrollbarWidth: 'none' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0"><CategorySkeleton /></div>
              ))}
            </div>
            {/* Skeleton tablet/desktop grid */}
            <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 lg:gap-8">
              {Array.from({ length: 5 }).map((_, i) => <CategorySkeleton key={i} />)}
            </div>
          </>
        ) : categories.length === 0 ? (
          <EmptyState label="Aucune catégorie disponible" note="Les catégories seront affichées ici." />
        ) : (
          <>
            {/* Mobile: scroll horizontal */}
            <div
              className="flex gap-4 overflow-x-auto pb-2 sm:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              {categories.map(cat => (
                <div key={cat.id} className="flex-shrink-0">
                  <CategoryCard cat={cat} />
                </div>
              ))}
            </div>

            {/* Tablette / Desktop: grille */}
            <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 lg:gap-8">
              {categories.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
            </div>
          </>
        )}
      </div>

      {/* ── PRODUITS POPULAIRES ───────────────────────────────────────────── */}
      <div className="pb-8 lg:pb-12">
        <SectionHeader title="Populaires" subtitle="Nos best-sellers du moment" linkTo="/produits" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : featured.length === 0
            ? <div className="col-span-2 sm:col-span-3 lg:col-span-4 xl:col-span-5">
                <EmptyState label="Produits populaires bientôt" note="Revenez bientôt !" />
              </div>
            : featured.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </div>

      {/* ── BANNIÈRE PROMO ────────────────────────────────────────────────── */}
      <div className="pb-8 lg:pb-12">
        <div
          className="relative rounded-3xl overflow-hidden p-6 sm:p-10 lg:p-14"
          style={{ background: 'linear-gradient(135deg, #1E1E1E 0%, #3a2e26 60%, #B68A64 100%)' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #C9A98A, transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #C9A98A, transparent)', transform: 'translate(-30%, 30%)' }} />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 lg:gap-12">
            <div>
              <span className="inline-block px-3 py-1 bg-beige-400/30 rounded-full text-[11px] font-bold text-beige-300 tracking-widest uppercase mb-3">
                Offre limitée
              </span>
              <h2 className="font-serif font-bold text-white text-2xl sm:text-3xl lg:text-4xl mb-2">
                Jusqu'à <span className="text-beige-400">-40%</span>
              </h2>
              <p className="text-white/60 text-sm lg:text-base mb-5">Sur la nouvelle collection. Offre valable aujourd'hui.</p>
              <Countdown />
            </div>
            <Link
              to="/promotions"
              className="flex items-center gap-2 self-start sm:self-auto px-6 py-4 bg-beige-400 hover:bg-beige-300 text-ink text-sm font-bold rounded-2xl transition-colors shadow-lg whitespace-nowrap"
            >
              Acheter maintenant
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── NOUVEAUTÉS ────────────────────────────────────────────────────── */}
      <div className="pb-8 lg:pb-12">
        <SectionHeader title="Nouveautés" subtitle="Arrivages de la semaine" linkTo="/produits?nouveautes=1" />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
            {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : newArrivals.length === 0 ? (
          <div className="bg-beige-50 rounded-2xl border border-dashed border-beige-400 p-10 text-center">
            <Sparkles className="w-8 h-8 text-beige-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-ink mb-0.5">Nouveautés bientôt</p>
            <p className="text-xs text-muted">De nouvelles pièces arrivent très prochainement.</p>
          </div>
        ) : (
          <>
            {/* Mobile: scroll horizontal */}
            <div
              className="flex gap-3 overflow-x-auto pb-2 sm:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              {newArrivals.map(p => (
                <div key={p.id} className="flex-shrink-0 w-44">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>

            {/* Tablette / Desktop: grille */}
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
              {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </div>

      {/* ── BRAND STRIP ──────────────────────────────────────────────────── */}
      <div className="pb-8 lg:pb-12">
        <div className="bg-beige-50 rounded-3xl border border-beige-200 p-6 lg:p-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl lg:rounded-3xl overflow-hidden border-2 border-beige-300 shadow-beige flex-shrink-0">
            <img src="/logo rokia.jpg" alt="Rokia Shop" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif font-bold text-ink text-xl lg:text-2xl mb-1.5">Rokia Shop</h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-lg">
              Mode africaine moderne et authentique. Pièces uniques, qualité premium, livraison rapide.
              {stats?.annees_experience ? ` ${stats.annees_experience} ans d'expertise à votre service.` : ''}
            </p>
          </div>
          <Link
            to="/a-propos"
            className="flex items-center gap-1.5 px-5 py-3 bg-beige-500 text-white text-sm font-bold rounded-xl hover:bg-beige-400 transition-colors shadow-beige whitespace-nowrap"
          >
            Notre histoire <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  )
}
