import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { NIcon, WAGlyph } from './NIcon'
import { useCartStore, cartCount } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useShopStore, buildWaUrl } from '@/store/shopStore'
import { useClientAuthStore } from '@/store/clientAuthStore'
import { catalogClientApi } from '@/api/client/catalog'
import type { ProductClient } from '@/api/client/home'
const LINKS = [
  { label: 'Accueil', path: '/' },
  { label: 'Catégories', path: '/categories' },
]

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }

export function NNavBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const items = useCartStore((s) => s.items)
  const cnt = cartCount(items)
  const wishCount = useWishlistStore((s) => s.items.length)
  const waNumber = useShopStore((s) => s.waNumber)
  const shopName = useShopStore((s) => s.shopName)
  const logo = useShopStore((s) => s.logo)
  const { isAuthenticated, user } = useClientAuthStore()

  const isProductDetail = /^\/produits\/.+/.test(pathname)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductClient[] | null>(null)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  /* scroll shadow */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  /* close drawer on route change */
  useEffect(() => { setMenuOpen(false) }, [pathname])

  /* body lock when drawer open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  /* click outside search */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const outsideDesktop = searchRef.current && !searchRef.current.contains(target)
      const outsideMobile = mobileSearchRef.current && !mobileSearchRef.current.contains(target)
      if (outsideDesktop && outsideMobile) setSearchResults(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* debounced search */
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    clearTimeout(searchTimer.current)
    if (q.length < 2) { setSearchResults(null); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await catalogClientApi.products({ search: q, per_page: 5 })
        setSearchResults(res.data.data.products)
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 380)
  }, [])

  function goSearch(q?: string) {
    const term = q ?? searchQuery
    if (!term.trim()) return
    setSearchResults(null)
    setSearchQuery('')
    navigate(`/recherche?q=${encodeURIComponent(term.trim())}`)
  }

  return (
    <>
      {/* ── NAV ── */}
      <header
        className={`sticky top-0 z-30 bg-paper/95 backdrop-blur-xl border-b border-line transition-shadow duration-200
          ${scrolled ? 'shadow-sm' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 md:h-[66px] gap-3">

            {/* ── HAMBURGER (mobile, hidden when search open) ── */}
            {!mobileSearchOpen && (
              <button
                onClick={() => setMenuOpen(true)}
                className="md:hidden w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors text-ink flex-shrink-0"
                aria-label="Menu"
              >
                <NIcon name="menu" size={22} strokeWidth={1.8} />
              </button>
            )}

            {/* ── BACK button (mobile, visible when search open) ── */}
            {mobileSearchOpen && (
              <button
                onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); setSearchResults(null) }}
                className="md:hidden w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors text-ink flex-shrink-0"
                aria-label="Fermer la recherche"
              >
                <NIcon name="back" size={22} strokeWidth={1.8} />
              </button>
            )}

            {/* ── LOGO (hidden on mobile when search open) ── */}
            <button
              onClick={() => navigate('/')}
              aria-label={shopName}
              className={`flex-shrink-0 flex items-center leading-none ${mobileSearchOpen ? 'hidden md:flex' : ''}`}
            >
              {logo
                ? <img src={logo} alt={shopName} className="h-9 md:h-10 w-auto object-contain" />
                : <span className="text-[16px] md:text-[18px] font-serif font-bold text-ink leading-none">{shopName}</span>}
            </button>

            {/* ── NAV LINKS (desktop) ── */}
            <nav className="hidden md:flex items-center gap-7 flex-1 ml-6">
              {LINKS.map((l) => {
                const active = pathname === l.path
                return (
                  <button key={l.path} onClick={() => navigate(l.path)}
                    className={`relative text-[13.5px] font-semibold pb-1 transition-colors
                      ${active ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}
                  >
                    {l.label}
                    {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
                  </button>
                )
              })}
            </nav>

            {/* ── MOBILE SEARCH INPUT (visible when open) ── */}
            {mobileSearchOpen && (
              <div className="flex md:hidden flex-1 relative" ref={mobileSearchRef}>
                <div className="relative w-full">
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && goSearch()}
                    placeholder="Rechercher…"
                    className="w-full h-9 bg-sand rounded-full pl-9 pr-3 text-[12.5px] text-ink placeholder-muted
                      focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
                  />
                  <NIcon name="search" size={16} strokeWidth={1.8}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {/* Mobile search dropdown */}
                {searchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[14px] border border-line shadow-card-lg z-50 overflow-hidden">
                    {searchResults.map((p) => (
                      <button key={p.id}
                        onClick={() => { setSearchResults(null); setSearchQuery(''); setMobileSearchOpen(false); navigate(`/produits/${p.slug}`) }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-paper transition-colors text-left border-b border-line last:border-0"
                      >
                        <div className="w-10 h-12 rounded-[8px] overflow-hidden bg-sand flex-shrink-0">
                          {p.image_principale
                            ? <img src={p.image_principale} alt={p.nom} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-gradient-to-br from-sand to-line" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-medium text-ink line-clamp-1">{p.nom}</p>
                          <p className="text-[11.5px] text-accent font-semibold mt-0.5">{fmt(p.prix_promo ?? p.prix)}</p>
                        </div>
                      </button>
                    ))}
                    <button onClick={() => { setMobileSearchOpen(false); goSearch() }}
                      className="w-full py-2.5 text-center text-[11.5px] font-semibold text-accent hover:bg-paper transition-colors">
                      Voir tous les résultats →
                    </button>
                  </div>
                )}
                {searchResults && searchResults.length === 0 && !searching && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[14px] border border-line shadow-card-lg z-50 px-4 py-4 text-center">
                    <p className="text-[12.5px] text-muted">Aucun résultat pour « {searchQuery} »</p>
                  </div>
                )}
              </div>
            )}

            {/* ── MOBILE SPACER (when search closed) ── */}
            {!mobileSearchOpen && <div className="flex-1 md:hidden" />}

            {/* ── DESKTOP ACTIONS ── */}
            <div className="hidden md:flex items-center gap-1 ml-auto">
              {/* Expandable search */}
              <div className="relative mr-1" ref={searchRef}>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && goSearch()}
                    placeholder="Rechercher…"
                    className="w-32 focus:w-52 h-9 bg-sand rounded-full pl-9 pr-3 text-[12.5px] text-ink placeholder-muted
                      focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all duration-300"
                  />
                  <NIcon name="search" size={15} strokeWidth={1.8}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {/* Desktop search dropdown */}
                {searchResults && searchResults.length > 0 && (
                  <div className="absolute top-full right-0 w-72 mt-2 bg-white rounded-[14px] border border-line shadow-card-lg z-50 overflow-hidden">
                    {searchResults.map((p) => (
                      <button key={p.id}
                        onClick={() => { setSearchResults(null); setSearchQuery(''); navigate(`/produits/${p.slug}`) }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-paper transition-colors text-left border-b border-line last:border-0"
                      >
                        <div className="w-10 h-12 rounded-[8px] overflow-hidden bg-sand flex-shrink-0">
                          {p.image_principale
                            ? <img src={p.image_principale} alt={p.nom} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-gradient-to-br from-sand to-line" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-medium text-ink line-clamp-1">{p.nom}</p>
                          <p className="text-[11.5px] text-accent font-semibold mt-0.5">{fmt(p.prix_promo ?? p.prix)}</p>
                        </div>
                      </button>
                    ))}
                    <button onClick={() => goSearch()}
                      className="w-full py-2.5 text-center text-[11.5px] font-semibold text-accent hover:bg-paper transition-colors">
                      Voir tous les résultats →
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => navigate('/favoris')}
                className="relative w-10 h-10 grid place-items-center rounded-full hover:bg-sand transition-colors text-ink-2 hover:text-ink">
                <NIcon name="heart" size={20} strokeWidth={1.7} />
                {wishCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-0.5 bg-accent text-white text-[9px] font-bold rounded-full grid place-items-center">
                    {wishCount}
                  </span>
                )}
              </button>

              <button onClick={() => navigate('/compte')}
                className="relative w-10 h-10 grid place-items-center rounded-full hover:bg-sand transition-colors text-ink-2 hover:text-ink"
                title={isAuthenticated && user ? user.nom_complet : 'Mon compte'}>
                {isAuthenticated && user ? (
                  <span className="w-7 h-7 rounded-full bg-accent/20 text-accent text-[10px] font-bold grid place-items-center">
                    {user.nom_complet?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                ) : (
                  <NIcon name="user" size={20} strokeWidth={1.7} />
                )}
              </button>

              <button onClick={() => navigate('/panier')}
                className="relative w-10 h-10 grid place-items-center rounded-full hover:bg-sand transition-colors text-ink-2 hover:text-ink">
                <NIcon name="bag" size={20} strokeWidth={1.7} />
                {cnt > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-0.5 bg-accent text-white text-[9px] font-bold rounded-full grid place-items-center">
                    {cnt}
                  </span>
                )}
              </button>

              <a
                href={buildWaUrl(waNumber, 'Bonjour ND WORLD 👋')}
                target="_blank" rel="noreferrer"
                className="ml-2 inline-flex items-center gap-2 px-4 h-9 rounded-full bg-wa text-white
                  text-[11px] font-bold tracking-wide hover:bg-wa-d transition-colors"
              >
                <WAGlyph size={15} /> WhatsApp
              </a>
            </div>

            {/* ── MOBILE SEARCH ICON (when search closed) ── */}
            {!mobileSearchOpen && (
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="md:hidden w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors text-ink-2 hover:text-ink flex-shrink-0"
                aria-label="Rechercher"
              >
                <NIcon name="search" size={21} strokeWidth={1.8} />
              </button>
            )}

            {/* ── MOBILE CART ICON (masqué sur page produit car son header a le sien) ── */}
            <button onClick={() => navigate('/panier')}
              className={`relative w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors text-ink flex-shrink-0 ${isProductDetail ? 'hidden' : 'md:hidden'}`}>
              <NIcon name="bag" size={21} strokeWidth={1.7} />
              {cnt > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-accent text-white text-[9px] font-bold rounded-full grid place-items-center">
                  {cnt}
                </span>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 left-0 bottom-0 z-50 w-[80%] max-w-[300px] bg-paper shadow-card-lg flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-line flex-shrink-0">
              <div className="flex items-center leading-none">
                {logo
                  ? <img src={logo} alt={shopName} className="h-9 w-auto object-contain" />
                  : <span className="text-[16px] font-serif font-bold text-ink leading-none">{shopName}</span>}
              </div>
              <button onClick={() => setMenuOpen(false)}
                className="w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors text-ink-2">
                <NIcon name="close" size={20} strokeWidth={1.8} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-4 py-5">
              <div className="space-y-1">
                {LINKS.map((l) => {
                  const active = pathname === l.path
                  return (
                    <button key={l.path} onClick={() => navigate(l.path)}
                      className={`w-full flex items-center justify-between px-3 h-12 rounded-[10px] text-[14px] font-semibold transition-colors text-left
                        ${active ? 'bg-sand text-ink' : 'text-ink-2 hover:bg-sand hover:text-ink'}`}
                    >
                      {l.label}
                      <NIcon name="fwd" size={14} strokeWidth={2} className="text-muted" />
                    </button>
                  )
                })}
              </div>

              <div className="border-t border-line mt-5 pt-5 space-y-1">
                <button onClick={() => navigate('/favoris')}
                  className="w-full flex items-center gap-3 px-3 h-12 rounded-[10px] text-[14px] font-semibold text-ink-2 hover:bg-sand hover:text-ink transition-colors">
                  <NIcon name="heart" size={18} strokeWidth={1.7} />
                  Mes favoris
                  {wishCount > 0 && (
                    <span className="ml-auto text-[11px] font-bold text-white bg-accent rounded-full px-2 py-0.5">{wishCount}</span>
                  )}
                </button>
                <button onClick={() => navigate('/panier')}
                  className="w-full flex items-center gap-3 px-3 h-12 rounded-[10px] text-[14px] font-semibold text-ink-2 hover:bg-sand hover:text-ink transition-colors">
                  <NIcon name="bag" size={18} strokeWidth={1.7} />
                  Mon panier
                  {cnt > 0 && (
                    <span className="ml-auto text-[11px] font-bold text-white bg-accent rounded-full px-2 py-0.5">{cnt}</span>
                  )}
                </button>
                <button onClick={() => navigate('/compte')}
                  className="w-full flex items-center gap-3 px-3 h-12 rounded-[10px] text-[14px] font-semibold text-ink-2 hover:bg-sand hover:text-ink transition-colors">
                  <NIcon name="user" size={18} strokeWidth={1.7} />
                  Mon compte
                </button>
              </div>
            </nav>

            {/* WhatsApp bottom */}
            <div className="px-4 py-4 border-t border-line flex-shrink-0">
              <a
                href={buildWaUrl(waNumber, 'Bonjour ND WORLD 👋')}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2.5 w-full h-11 rounded-[10px] bg-wa text-white
                  text-[12px] font-bold tracking-wide hover:bg-wa-d transition-colors"
              >
                <WAGlyph size={18} /> Commander via WhatsApp
              </a>
            </div>
          </div>
        </>
      )}
    </>
  )
}
