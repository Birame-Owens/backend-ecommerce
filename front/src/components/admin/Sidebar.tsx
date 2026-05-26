import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, CreditCard,
  Percent, Star, BarChart3, LogOut, X, Menu, Send, Truck, Settings,
} from 'lucide-react'
import { useAdminAuthStore } from '@/store/adminAuthStore'
import { adminAuthApi } from '@/api/admin/auth'

const menuItems = [
  { name: 'Tableau de bord', icon: LayoutDashboard, path: '/admin/dashboard' },
  { name: 'Catégories',     icon: Tag,              path: '/admin/categories' },
  { name: 'Produits',        icon: Package,          path: '/admin/produits' },
  { name: 'Commandes',      icon: ShoppingCart,     path: '/admin/commandes' },
  { name: 'Clients',        icon: Users,            path: '/admin/clients' },
  { name: 'Promotions',     icon: Percent,          path: '/admin/promotions' },
  { name: 'Avis clients',   icon: Star,             path: '/admin/avis-clients' },
  { name: 'Paiements',      icon: CreditCard,       path: '/admin/paiements' },
  { name: 'Livraison',      icon: Truck,            path: '/admin/livraison' },
  { name: 'Rapports',       icon: BarChart3,        path: '/admin/rapports' },
  { name: 'Messages',       icon: Send,             path: '/admin/messages' },
  { name: 'Paramètres',     icon: Settings,         path: '/admin/parametres' },
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation()
  const navigate  = useNavigate()
  const { clearAuth, user } = useAdminAuthStore()

  const handleLogout = async () => {
    try { await adminAuthApi.logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/admin/login', { replace: true })
  }

  const isActive = (path: string) => location.pathname === path

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A'

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64
          flex flex-col
          border-r border-beige-300
          bg-beige-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ── Header / Logo ── */}
        <div className="px-5 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => { navigate('/admin/dashboard'); setIsOpen(false) }}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-beige-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white font-serif font-bold text-lg leading-none">N</span>
            </div>
            <div className="text-left min-w-0">
              <p className="font-serif font-bold text-ink text-[15px] leading-tight truncate">
                Ndeya Shop
              </p>
              <span className="inline-block text-[9px] font-semibold tracking-[0.22em] text-beige-500 uppercase">
                ADMIN
              </span>
            </div>
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-beige-300 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-beige-300 mb-2 flex-shrink-0" />

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          <p className="text-[9px] font-bold tracking-[0.2em] text-beige-500 uppercase px-4 pt-1 pb-2.5">
            Navigation
          </p>

          {menuItems.map((item) => {
            const Icon   = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setIsOpen(false) }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-[14px]
                  text-sm font-medium text-left
                  transition-all duration-200
                  ${active
                    ? 'bg-beige-400 text-white shadow-beige'
                    : 'text-muted hover:bg-beige-300 hover:text-ink'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                <span>{item.name}</span>
              </button>
            )
          })}
        </nav>

        {/* ── Profil bas ── */}
        <div className="flex-shrink-0 p-3">
          <div className="bg-beige-50 rounded-2xl p-3.5 border border-beige-300 shadow-beige">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-beige-400 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate leading-tight">
                  {user?.name ?? 'Administrateur'}
                </p>
                <p className="text-[11px] text-muted truncate">Administrateur</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                text-xs font-medium text-muted
                hover:bg-beige-300 hover:text-red-500
                transition-all duration-200"
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Bouton hamburger mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2.5 bg-beige-500 text-white rounded-xl shadow-beige-lg"
      >
        <Menu className="w-4 h-4" />
      </button>
    </>
  )
}
