import { Grid, Heart, Home, ShoppingCart, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function BottomNav() {
  const { pathname } = useLocation()

  const items = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/categories', icon: Grid, label: 'Categories' },
    { to: '/favoris', icon: Heart, label: 'Favoris' },
    { to: '/panier', icon: ShoppingCart, label: 'Panier' },
    { to: '/profil', icon: User, label: 'Profil' },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-beige-50/98 backdrop-blur-md border-t border-beige-200 shadow-[0_-4px_24px_rgba(180,138,100,0.10)] rounded-t-[28px]">
      <div className="flex items-center justify-around px-2 pt-2 pb-3">
        {items.map(({ to, icon: Icon, label }) => {
          const active = pathname === to
          return (
            <Link key={to} to={to} className="flex flex-col items-center gap-0.5 min-w-[52px]">
              <div className={`p-2.5 rounded-2xl transition-all duration-200 ${active ? 'bg-beige-500 shadow-beige' : 'hover:bg-beige-200'}`}>
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-muted'}`} strokeWidth={active ? 2 : 1.5} />
              </div>
              <span className={`text-[10px] font-semibold ${active ? 'text-beige-500' : 'text-muted'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
