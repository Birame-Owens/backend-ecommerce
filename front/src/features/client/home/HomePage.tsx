import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { homeClientApi, type HomeData } from '@/api/client/home'
import { NProductCard } from '@/components/client/NProductCard'
import { NImage } from '@/components/client/NImage'
import { NIcon, WAGlyph, IGGlyph, TikTokGlyph, Stars } from '@/components/client/NIcon'
import { useShopStore, buildWaUrl } from '@/store/shopStore'
import { SeoHead } from '@/components/client/SeoHead'
import { Reveal } from '@/components/client/Reveal'
function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }


/* ── Hero slider ── */
const SLIDES = [
  {
    bg: 'from-[#3D2B1F] to-[#6B4423]',
    kicker: 'Nouveautés',
    title: 'Tout ce\nqu\'il vous\nfaut.',
    sub: 'Une large sélection de produits, livrés vite à Dakar',
    cta: 'Découvrir',
  },
  {
    bg: 'from-[#1A2E1A] to-[#2E4A2E]',
    kicker: 'Sélection',
    title: 'Qualité au\nmeilleur\nprix.',
    sub: 'Paiement sécurisé et livraison rapide',
    cta: 'Explorer',
  },
]

function Hero({ data }: { data: HomeData }) {
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIdx((v) => (v + 1) % SLIDES.length), 5200)
    return () => clearInterval(id)
  }, [])

  const s = SLIDES[idx]
  const heroTitle = idx === 0 && data.hero_banner.default_message.titre
    ? data.hero_banner.default_message.titre
    : s.title
  const heroSub = idx === 0 && data.hero_banner.default_message.description
    ? data.hero_banner.default_message.description
    : s.sub

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br ${s.bg}`}
      style={{ minHeight: 'min(75dvh, 620px)' }}
    >
      {/* Texture */}
      <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(115deg,transparent_0_13px,rgba(255,255,255,.08)_13px_14px)]" />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex items-center h-full">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-28 lg:py-32">
          <div className="max-w-[560px]">
            <p className="text-[10px] font-semibold tracking-[.2em] uppercase text-camel mb-3">{s.kicker}</p>
            <h1
              className="font-serif font-bold text-white leading-none whitespace-pre-line mb-5"
              style={{ fontSize: 'clamp(38px, 7vw, 72px)' }}
            >
              {heroTitle}
            </h1>
            <p className="text-[14px] md:text-[16px] text-white/85 leading-relaxed max-w-[340px] mb-8">{heroSub}</p>
            <button
              onClick={() => navigate('/categories')}
              className="inline-flex items-center gap-2.5 px-7 h-12 rounded-[10px] bg-btn text-white
                text-[12px] font-semibold tracking-widest uppercase hover:bg-btn-dark transition-colors"
            >
              {s.cta} <NIcon name="arrow" size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {SLIDES.map((_, k) => (
          <button key={k} onClick={() => setIdx(k)}
            className="h-1.5 rounded-full bg-white transition-all duration-300"
            style={{ width: k === idx ? 28 : 8, opacity: k === idx ? 1 : 0.5 }} />
        ))}
      </div>
    </section>
  )
}

/* ── Category circles ── */
function CatRow({ data }: { data: HomeData }) {
  const navigate = useNavigate()
  const cats = data.categories_preview.filter((c) => !c.parent_id).slice(0, 10)
  if (!cats.length) return null

  const circleItem = (c: (typeof cats)[0], size: number) => (
    <button key={c.id} onClick={() => navigate(`/categories/${c.slug}`)}
      className="flex flex-col items-center gap-2.5 flex-shrink-0 group">
      <div
        className="rounded-full overflow-hidden border-2 border-line-2 bg-sand
          transition-transform duration-300 group-hover:scale-105"
        style={{ width: size, height: size }}
      >
        {c.image
          ? <NImage src={c.image} alt={c.nom} className="w-full h-full" />
          : <div className="w-full h-full bg-gradient-to-br from-sand to-camel/40" />}
      </div>
      <span className="text-[11.5px] font-medium text-center leading-tight text-ink-2"
        style={{ maxWidth: size + 8 }}>
        {c.nom}
      </span>
    </button>
  )

  return (
    <section className="pt-8 md:pt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end justify-between mb-5">
        <h2 className="font-serif font-semibold text-[22px] md:text-[28px] text-ink">Catégories</h2>
        <button onClick={() => navigate('/categories')}
          className="text-[11px] font-semibold tracking-widest uppercase text-accent flex items-center gap-1">
          Voir tout <NIcon name="fwd" size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2">
        {cats.map((c) => circleItem(c, 76))}
      </div>

      {/* Desktop: grid row */}
      <div className="hidden md:flex gap-6 lg:gap-8 max-w-7xl mx-auto px-6 lg:px-8 justify-start flex-wrap">
        {cats.map((c) => circleItem(c, 90))}
      </div>
    </section>
  )
}

/* ── Service strip ── */
function ServiceStrip() {
  return (
    <div className="mt-10 border-t border-b border-line bg-white py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-8">
      {[
        { icon: 'truck', label: 'Livraison rapide' },
        { icon: 'lock', label: 'Paiement sécurisé' },
      ].map((it) => (
        <div key={it.icon} className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-2">
          <span className="text-accent"><NIcon name={it.icon} size={15} strokeWidth={1.6} /></span>
          {it.label}
        </div>
      ))}
      </div>
    </div>
  )
}

/* ── Product grid section ── */
function ProductSection({ title, kicker, products, linkLabel, linkPath }: {
  title: string
  kicker?: string
  products: HomeData['featured_products']
  linkLabel?: string
  linkPath?: string
}) {
  const navigate = useNavigate()
  if (!products.length) return null
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14">
      <div className="flex items-end justify-between mb-5 md:mb-7">
        <div>
          {kicker && <p className="text-[10px] font-semibold tracking-[.2em] uppercase text-accent mb-1.5">{kicker}</p>}
          <h2 className="font-serif font-semibold text-[22px] md:text-[28px] leading-none text-ink">{title}</h2>
        </div>
        {linkPath && (
          <button onClick={() => navigate(linkPath)}
            className="text-[11px] font-semibold tracking-widest uppercase text-accent flex items-center gap-1">
            {linkLabel ?? 'Voir tout'} <NIcon name="fwd" size={13} strokeWidth={2} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 md:gap-5">
        {products.map((p) => <NProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}

/* ── Promo banner ── */
function PromoBanner({ data }: { data: HomeData }) {
  const navigate = useNavigate()
  const promo = data.active_promotions[0]
  if (!promo) return null
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14">
      <div className="relative rounded-[18px] overflow-hidden bg-ink text-white p-8 md:p-12 min-h-[190px] flex flex-col justify-center">
        <div className="absolute inset-0 opacity-[.15] bg-gradient-to-br from-camel/40 to-transparent" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_18px,rgba(255,255,255,.015)_18px_19px)]" />
        <div className="relative max-w-lg">
          <p className="text-[10px] font-semibold tracking-[.2em] uppercase text-camel mb-3">Promotion en cours</p>
          <div className="flex flex-wrap items-baseline gap-3 mb-3">
            <span className="font-serif font-bold leading-none text-white"
              style={{ fontSize: 'clamp(48px, 8vw, 76px)' }}>
              {promo.type === 'pourcentage' ? `-${promo.valeur}%` : fmt(promo.valeur)}
            </span>
            <span className="text-[15px] text-white/75 max-w-[200px] leading-snug">
              {promo.description ?? 'sur les nouvelles collections'}
            </span>
          </div>
          {promo.code && (
            <p className="text-[11px] text-white/60 mb-4">
              Code : <span className="font-mono font-bold text-camel">{promo.code}</span>
            </p>
          )}
          <button
            onClick={() => navigate('/categories')}
            className="inline-flex items-center gap-2 px-6 h-11 rounded-[10px] bg-btn text-white
              text-[12px] font-semibold tracking-widest uppercase hover:bg-btn-dark transition-colors"
          >
            En profiter <NIcon name="arrow" size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ── Stats ── */
function StatsStrip({ data }: { data: HomeData }) {
  const stats = data.shop_stats
  // "Années d'expérience" retiré : la preuve sociale passe par les avis clients réels (section ci-dessous).
  const items = [
    { val: stats.produits_disponibles + '+', label: 'Produits' },
    { val: stats.clients_satisfaits + '+', label: 'Clients satisfaits' },
    { val: stats.note_moyenne.toFixed(1) + ' ★', label: 'Note moyenne' },
  ]
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14">
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {items.map((it) => (
          <div key={it.label} className="text-center bg-white border border-line rounded-card p-4 md:p-6 shadow-sm">
            <div className="font-serif font-bold text-[20px] md:text-[28px] text-ink">{it.val}</div>
            <div className="text-[10.5px] md:text-[12px] text-muted mt-1">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Testimonials ── */
function TestimonialsSection({ data }: { data: HomeData }) {
  if (!data.testimonials.length) return null
  const tms = data.testimonials.slice(0, 6)
  return (
    <section className="pt-10 md:pt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 md:mb-7">
        <h2 className="font-serif font-semibold text-[22px] md:text-[28px] text-ink">Avis clients</h2>
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden flex gap-3.5 overflow-x-auto no-scrollbar px-4 pb-2">
        {tms.map((tm, i) => (
          <div key={i} className="flex-shrink-0 w-[260px] bg-white border border-line rounded-[14px] p-4">
            <Stars value={tm.note} size={14} />
            <p className="text-[13.5px] leading-relaxed text-ink-2 my-2.5">"{tm.commentaire}"</p>
            {tm.photos?.length > 0 && (
              <div className="flex gap-1.5 mb-2">
                {tm.photos.slice(0, 3).map((src, k) => (
                  <img key={k} src={src} alt="" loading="lazy"
                    className="w-12 h-12 rounded-lg object-cover border border-line" />
                ))}
              </div>
            )}
            <div className="flex items-center gap-2.5 mt-3">
              <div className="w-8 h-8 rounded-full bg-sand flex-shrink-0" />
              <div className="text-[12.5px]">
                <span className="font-semibold text-ink">{tm.nom_client}</span>
                <span className="text-muted"> · {tm.produit_nom}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-5 max-w-7xl mx-auto px-6 lg:px-8">
        {tms.slice(0, 3).map((tm, i) => (
          <div key={i} className="bg-white border border-line rounded-[16px] p-5 shadow-sm">
            <Stars value={tm.note} size={15} />
            <p className="text-[14px] leading-relaxed text-ink-2 my-3">"{tm.commentaire}"</p>
            {tm.photos?.length > 0 && (
              <div className="flex gap-2 mb-2">
                {tm.photos.slice(0, 3).map((src, k) => (
                  <img key={k} src={src} alt="" loading="lazy"
                    className="w-14 h-14 rounded-lg object-cover border border-line" />
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-4">
              <div className="w-9 h-9 rounded-full bg-sand flex-shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-ink">{tm.nom_client}</p>
                <p className="text-[11.5px] text-muted">{tm.produit_nom}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Footer ── */
function Footer() {
  const navigate = useNavigate()
  const year = new Date().getFullYear()
  const { waNumber, instagram, tiktok, email } = useShopStore()
  function waLink(msg: string) { return buildWaUrl(waNumber, msg) }
  return (
    <footer className="bg-ink text-white mt-10 md:mt-16 pt-12 md:pt-16 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-10">
          {/* About */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <span className="block text-[8.5px] font-semibold tracking-[.22em] uppercase text-camel">ND</span>
              <span className="block text-[20px] font-serif font-bold leading-none">WORLD</span>
            </div>
            <p className="text-[13px] text-white/60 leading-relaxed">
              Votre boutique en ligne au Sénégal : une large sélection de produits, un paiement sécurisé et une livraison rapide à Dakar et partout au pays.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-[10px] font-semibold tracking-[.18em] uppercase text-camel mb-4">Navigation</h3>
            <ul className="space-y-2.5">
              {[['Accueil', '/'], ['Catégories', '/categories'], ['Nouveautés', '/produits'], ['Favoris', '/favoris']].map(([label, path]) => (
                <li key={path}>
                  <button onClick={() => navigate(path)}
                    className="text-[13px] text-white/65 hover:text-white transition-colors">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-[10px] font-semibold tracking-[.18em] uppercase text-camel mb-4">Services</h3>
            <ul className="space-y-2.5">
              {['Livraison rapide', 'Paiement sécurisé', 'Support client', 'Retours & échanges'].map((s) => (
                <li key={s} className="text-[13px] text-white/65">{s}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[10px] font-semibold tracking-[.18em] uppercase text-camel mb-4">Contact</h3>
            <ul className="space-y-2.5">
              <li>
                <a href={waLink('Bonjour ND WORLD 👋')} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-[13px] text-white/65 hover:text-wa transition-colors">
                  <WAGlyph size={15} /> WhatsApp
                </a>
              </li>
              <li className="text-[13px] text-white/65">Dakar, Sénégal</li>
              <li>
                <a href={`mailto:${email}`}
                  className="text-[13px] text-white/65 hover:text-white transition-colors">
                  {email}
                </a>
              </li>
            </ul>
            {(instagram || tiktok) && (
              <div className="flex items-center gap-2.5 mt-4">
                {instagram && (
                  <a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram"
                    className="p-2 rounded-lg bg-white/10 hover:bg-accent transition-colors"><IGGlyph size={16} /></a>
                )}
                {tiktok && (
                  <a href={tiktok} target="_blank" rel="noreferrer" aria-label="TikTok"
                    className="p-2 rounded-lg bg-white/10 hover:bg-accent transition-colors"><TikTokGlyph size={16} /></a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/35 tracking-wide">© {year} ND WORLD · Dakar, Sénégal</p>
          <p className="text-[11px] text-white/35">Fait avec ❤ au Sénégal</p>
        </div>
      </div>
    </footer>
  )
}

/* ── WhatsApp FAB ── */
function WAFab() {
  const waNumber = useShopStore((s) => s.waNumber)
  return (
    <a
      href={buildWaUrl(waNumber, "Bonjour ND WORLD 👋, j'aimerais des informations.")}
      target="_blank"
      rel="noreferrer"
      className="fixed right-4 z-40 inline-flex items-center gap-2.5 px-4 h-[52px] rounded-full
        bg-wa text-white text-[12px] font-bold tracking-widest uppercase
        shadow-[0_10px_24px_-8px_rgba(31,168,85,.6)] hover:-translate-y-0.5 transition-transform
        bottom-24 md:bottom-8"
    >
      <WAGlyph size={20} />
      WhatsApp
    </a>
  )
}

/* ── Page ── */
export function HomePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['client-home'],
    queryFn: () => homeClientApi.home().then((r) => r.data.data),
    retry: 2,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center" role="status" aria-label="Chargement">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center max-w-sm" role="alert">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <NIcon name="close" size={28} strokeWidth={1.5} className="text-red-400" />
          </div>
          <h2 className="font-serif font-bold text-[20px] text-ink mb-2">Impossible de charger la page</h2>
          <p className="text-[13px] text-muted mb-6">Vérifiez votre connexion et réessayez.</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-6 h-11 rounded-[10px] bg-accent text-white
              text-[12px] font-semibold tracking-wide hover:bg-accent-dark transition-colors"
          >
            <NIcon name="arrow" size={14} strokeWidth={2} />
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-paper">
      <SeoHead
        title="ND WORLD | Boutique en ligne au Senegal"
        description="Decouvrez ND WORLD, boutique en ligne au Senegal avec produits tendance, paiement securise et livraison rapide a Dakar et partout au pays."
        canonical="/"
        image="/ND-world.jpeg"
        keywords={['ND WORLD', 'boutique en ligne Senegal', 'Dakar', 'mode', 'accessoires', 'parfums']}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'ND WORLD',
          url: '/',
          potentialAction: {
            '@type': 'SearchAction',
            target: '/recherche?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      <Hero data={data} />
      <Reveal><CatRow data={data} /></Reveal>
      <Reveal><ServiceStrip /></Reveal>

      <Reveal>
        <ProductSection
          kicker="Fraîchement arrivé"
          title="Nouveautés"
          products={data.new_arrivals.slice(0, 8)}
          linkLabel="Voir tout"
          linkPath="/produits"
        />
      </Reveal>

      <Reveal><PromoBanner data={data} /></Reveal>

      <Reveal>
        <ProductSection
          kicker="Sélection"
          title="Populaires"
          products={data.featured_products.slice(0, 8)}
          linkLabel="Voir tout"
          linkPath="/produits"
        />
      </Reveal>

      <Reveal><StatsStrip data={data} /></Reveal>
      <Reveal><TestimonialsSection data={data} /></Reveal>
      <Footer />
      <WAFab />
    </div>
  )
}
