import { useLocation, useNavigate } from 'react-router-dom'
import { NIcon } from './NIcon'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore, cartCount } from '@/store/cartStore'

const TABS = [
  { id: 'home',     icon: 'home',   label: 'Accueil',    path: '/' },
  { id: 'cats',     icon: 'grid',   label: 'Catégories', path: '/categories' },
  { id: 'search',   icon: 'search', label: 'Recherche',  path: '/recherche' },
  { id: 'wishlist', icon: 'heart',  label: 'Favoris',    path: '/favoris' },
  { id: 'account',  icon: 'user',   label: 'Compte',     path: '/compte' },
]

const ACTIVE_MAP: Record<string, string> = {
  '/': 'home',
  '/categories': 'cats',
  '/recherche': 'search',
  '/favoris': 'wishlist',
  '/compte': 'account',
  '/commandes': 'account',
  '/panier': 'home',
  '/checkout': 'home',
}

export function NBottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const wishCount = useWishlistStore((s) => s.items.length)
  const items = useCartStore((s) => s.items)
  const cnt = cartCount(items)

  const activeId = ACTIVE_MAP[pathname]
    ?? (pathname.startsWith('/categories') ? 'cats'
      : pathname.startsWith('/produits') ? 'cats'
      : 'home')

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5
        border-t border-line bg-white/90 backdrop-blur-xl
        pb-[env(safe-area-inset-bottom,0px)]"
    >
      {TABS.map((tab) => {
        const on = activeId === tab.id
        const badge = tab.id === 'wishlist' ? wishCount : tab.id === 'home' ? cnt : 0
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 py-3 text-[9.5px] font-semibold tracking-widest uppercase
              transition-colors relative font-sans
              ${on ? 'text-ink' : 'text-muted'}`}
          >
            {on && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-accent rounded-full" aria-hidden="true" />
            )}
            <span className="relative">
              <NIcon name={tab.icon} size={22} fill={on && (tab.id === 'wishlist' || tab.id === 'home')} />
              {badge > 0 && (
                <span
                  aria-label={`${badge} ${tab.id === 'wishlist' ? 'favoris' : 'articles'}`}
                  className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-1 bg-accent text-white text-[9px] font-bold rounded-full grid place-items-center"
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            <span aria-hidden="true">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
