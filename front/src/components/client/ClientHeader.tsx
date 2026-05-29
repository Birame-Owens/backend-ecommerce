import { useState } from 'react'
import { Bell, Menu, Search, ShoppingCart, User, X } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Accueil' },
  { to: '/categories', label: 'Categories' },
  { to: '/produits', label: 'Boutique' },
  { to: '/promotions', label: 'Promotions' },
]

export function ClientHeader() {
  const [search, setSearch] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 bg-beige-50/95 backdrop-blur-md border-b border-beige-300 shadow-beige">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center gap-3 h-16">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-beige-300 shadow-beige">
              <img src="/logo rokia.jpg" alt="Rokia Shop" className="w-full h-full object-cover" />
            </div>
            <div className="leading-none">
              <span className="font-serif font-bold text-ink text-base block">Rokia</span>
              <span className="text-beige-500 text-[10px] font-bold tracking-widest uppercase">Shop</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? 'bg-beige-200 text-ink' : 'text-muted hover:bg-beige-100 hover:text-ink'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <form
            className="flex-1 relative mx-2 md:mx-4"
            onSubmit={(event) => {
              event.preventDefault()
              const query = search.trim()
              if (query) navigate(`/produits?search=${encodeURIComponent(query)}`)
            }}
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-2.5 bg-beige-100 border border-beige-300 rounded-2xl text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
            />
          </form>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button className="p-2 rounded-xl hover:bg-beige-200 transition-colors hidden sm:flex" aria-label="Notifications">
              <Bell className="w-5 h-5 text-muted" strokeWidth={1.5} />
            </button>
            <Link to="/panier" className="relative p-2 rounded-xl hover:bg-beige-200 transition-colors" aria-label="Panier">
              <ShoppingCart className="w-5 h-5 text-muted" strokeWidth={1.5} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-beige-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">0</span>
            </Link>
            <Link to="/profil" className="hidden sm:flex p-1.5 rounded-xl hover:bg-beige-200 transition-colors" aria-label="Profil">
              <div className="w-7 h-7 rounded-lg bg-beige-200 border border-beige-300 flex items-center justify-center">
                <User className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden p-2 rounded-xl hover:bg-beige-200 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen
                ? <X className="w-5 h-5 text-ink" strokeWidth={1.5} />
                : <Menu className="w-5 h-5 text-muted" strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-beige-300 py-3 space-y-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? 'bg-beige-200 text-ink' : 'text-muted hover:bg-beige-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
