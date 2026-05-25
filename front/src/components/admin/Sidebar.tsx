import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, CreditCard,
  Percent, Star, BarChart3, LogOut, X, Menu, Send, Truck,
} from 'lucide-react'
import { useAdminAuthStore } from '@/store/adminAuthStore'
import { adminAuthApi } from '@/api/admin/auth'

const menuItems = [
  { name: 'Dashboard',    icon: LayoutDashboard, path: '/admin/dashboard' },
  { name: 'Catégories',  icon: Tag,              path: '/admin/categories' },
  { name: 'Produits',    icon: Package,          path: '/admin/produits' },
  { name: 'Commandes',   icon: ShoppingCart,     path: '/admin/commandes' },
  { name: 'Clients',     icon: Users,            path: '/admin/clients' },
  { name: 'Paiements',   icon: CreditCard,       path: '/admin/paiements' },
  { name: 'Promotions',  icon: Percent,          path: '/admin/promotions' },
  { name: 'Livraison',   icon: Truck,            path: '/admin/livraison' },
  { name: 'Avis Clients',icon: Star,             path: '/admin/avis-clients' },
  { name: 'Messages',    icon: Send,             path: '/admin/messages' },
  { name: 'Rapports',    icon: BarChart3,        path: '/admin/rapports' },
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { clearAuth, user } = useAdminAuthStore()

  const handleLogout = async () => {
    try { await adminAuthApi.logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/admin/login', { replace: true })
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64
        bg-white border-r border-stone-200
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 border-b border-stone-100 flex items-center justify-between px-5 flex-shrink-0">
          <button
            onClick={() => { navigate('/admin/dashboard'); setIsOpen(false) }}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="w-9 h-9 bg-stone-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div className="text-left min-w-0">
              <p className="font-bold text-stone-900 text-sm tracking-tight leading-none truncate">
                NDEYA SHOP
              </p>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5">
                Administration
              </p>
            </div>
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 hover:bg-stone-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setIsOpen(false) }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-xs font-medium uppercase tracking-wider
                  transition-all duration-150 text-left
                  ${active
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                <span>{item.name}</span>
              </button>
            )
          })}
        </nav>

        {/* Profil + Déconnexion */}
        <div className="border-t border-stone-100 p-3 flex-shrink-0 space-y-1">
          {user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-medium text-stone-900 truncate">{user.name}</p>
              <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-xs font-medium uppercase tracking-wider
              text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Bouton hamburger mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2.5 bg-stone-900 text-white rounded-full shadow-lg"
      >
        <Menu className="w-4 h-4" />
      </button>
    </>
  )
}
