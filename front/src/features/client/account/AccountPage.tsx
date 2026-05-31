import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { NIcon, WAGlyph } from '@/components/client/NIcon'
import { NAuthModal } from '@/components/client/NAuthModal'
import { useCartStore, cartCount } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useClientAuthStore } from '@/store/clientAuthStore'
import { useShopStore, buildWaUrl } from '@/store/shopStore'
import { useToastStore } from '@/store/toastStore'
import { checkoutApi } from '@/api/client/checkout'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }

const STATUS_LABEL: Record<string, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  en_preparation: 'En préparation',
  prete: 'Prête',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
}

const STATUS_COLOR: Record<string, string> = {
  en_attente: 'text-amber-600 bg-amber-50',
  confirmee: 'text-ok bg-ok/10',
  en_preparation: 'text-blue-600 bg-blue-50',
  prete: 'text-ok bg-ok/10',
  en_livraison: 'text-blue-600 bg-blue-50',
  livree: 'text-ok bg-ok/10',
  annulee: 'text-red-500 bg-red-50',
}

function OrderHistory() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['client-orders'],
    queryFn: () => checkoutApi.getOrders().then((r) => r.data.data),
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="space-y-2" aria-label="Chargement des commandes">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-sand rounded-[12px] animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-[12.5px] text-muted text-center py-4">
        Impossible de charger vos commandes.
      </p>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-6">
        <NIcon name="bag" size={28} strokeWidth={1.4} className="text-accent/40 mx-auto mb-2" />
        <p className="text-[12.5px] text-muted">Aucune commande pour l'instant.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2" role="list">
      {data.slice(0, 5).map((order) => (
        <div
          key={order.numero_commande}
          role="listitem"
          className="flex items-center justify-between gap-3 px-4 py-3 bg-paper rounded-[12px] border border-line"
        >
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold text-ink font-mono truncate">#{order.numero_commande}</p>
            <p className="text-[11px] text-muted mt-0.5">
              {order.items_count} article{order.items_count > 1 ? 's' : ''}
              {order.created_at && ` · ${new Date(order.created_at).toLocaleDateString('fr-FR')}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[order.statut] ?? 'text-muted bg-paper'}`}>
              {STATUS_LABEL[order.statut] ?? order.statut}
            </span>
            {order.montant_total > 0 && (
              <span className="text-[12px] font-bold text-ink tabular-nums">{fmt(order.montant_total)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AccountPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const cnt = cartCount(items)
  const wishCount = useWishlistStore((s) => s.items.length)
  const { user, isAuthenticated, logout } = useClientAuthStore()
  const waNumber = useShopStore((s) => s.waNumber)
  const toast = useToastStore((s) => s.show)

  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [loggingOut, setLoggingOut] = useState(false)

  const waUrl = buildWaUrl(waNumber, 'Bonjour ND WORLD 👋, je voudrais des informations.')

  async function handleLogout() {
    if (!window.confirm('Voulez-vous vraiment vous déconnecter ?')) return
    setLoggingOut(true)
    await logout()
    toast('Déconnexion réussie', 'check')
    setLoggingOut(false)
  }

  function openLogin() { setAuthTab('login'); setAuthOpen(true) }
  function openRegister() { setAuthTab('register'); setAuthOpen(true) }

  const menuItems = [
    { icon: 'bag', label: 'Mon panier', sub: `${cnt} article${cnt !== 1 ? 's' : ''}`, path: '/panier' },
    { icon: 'heart', label: 'Mes favoris', sub: `${wishCount} produit${wishCount !== 1 ? 's' : ''}`, path: '/favoris' },
    { icon: 'truck', label: 'Livraison', sub: 'Dakar · 24-48h', path: '/categories' },
    { icon: 'card', label: 'Paiement', sub: 'Wave · Orange Money', path: '/checkout' },
  ]

  return (
    <>
      <NAuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialTab={authTab} />

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur-xl border-b border-line">
        <div className="flex items-center h-14 px-4 gap-3">
          <div className="flex flex-col leading-none" aria-hidden="true">
            <span className="text-[8.5px] font-semibold tracking-[.22em] uppercase text-accent">ND</span>
            <span className="text-[15px] font-serif font-bold text-ink leading-none">WORLD</span>
          </div>
          <span className="flex-1 font-serif font-semibold text-[17px] text-ink">Compte</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* Desktop title */}
        <div className="hidden md:block mb-7">
          <p className="text-[10px] font-semibold tracking-[.2em] uppercase text-accent mb-2">Espace personnel</p>
          <h1 className="font-serif font-bold text-[34px] text-ink">Mon compte</h1>
        </div>

        {/* Profile card */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-4 p-5 bg-white rounded-[16px] border border-line shadow-sm mb-5">
            <div
              className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/30 to-camel/40 flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <span className="text-[18px] font-bold text-accent">
                {user.nom_complet?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[15px] text-ink truncate">{user.nom_complet}</p>
              <p className="text-[12.5px] text-muted truncate">{user.email}</p>
              {user.type_client && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10.5px] font-semibold capitalize">
                  {user.type_client === 'nouveau' ? 'Nouveau client' : user.type_client}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Not logged in — auth CTA */
          <section aria-label="Connexion" className="bg-white rounded-[16px] border border-line shadow-sm p-6 mb-5 text-center">
            <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <NIcon name="user" size={30} strokeWidth={1.4} className="text-accent/60" />
            </div>
            <h2 className="font-serif font-semibold text-[18px] text-ink mb-1">Bienvenue</h2>
            <p className="text-[13px] text-muted mb-5 max-w-xs mx-auto">
              Connectez-vous pour accéder à vos commandes et gérer votre compte.
            </p>
            <div className="flex gap-3">
              <button onClick={openLogin}
                className="flex-1 h-11 rounded-[10px] bg-accent text-white text-[13px] font-semibold
                  hover:bg-accent-dark transition-colors">
                Se connecter
              </button>
              <button onClick={openRegister}
                className="flex-1 h-11 rounded-[10px] border border-line text-[13px] font-semibold text-ink
                  hover:bg-paper transition-colors">
                S'inscrire
              </button>
            </div>
          </section>
        )}

        {/* Order history — only when logged in */}
        {isAuthenticated && (
          <section aria-labelledby="orders-heading" className="bg-white rounded-[16px] border border-line shadow-sm overflow-hidden mb-5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h2 id="orders-heading" className="font-serif font-semibold text-[16px] text-ink">Mes commandes</h2>
            </div>
            <div className="px-5 py-4">
              <OrderHistory />
            </div>
          </section>
        )}

        {/* Menu items */}
        <nav aria-label="Raccourcis" className="bg-white rounded-[16px] border border-line shadow-sm overflow-hidden mb-5">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              className={`w-full flex items-center gap-4 px-5 py-4 transition-colors text-left
                hover:bg-paper cursor-pointer
                ${i > 0 ? 'border-t border-line' : ''}`}
            >
              <span className="w-9 h-9 rounded-full bg-paper flex items-center justify-center flex-shrink-0 text-accent" aria-hidden="true">
                <NIcon name={item.icon} size={18} strokeWidth={1.7} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">{item.label}</p>
                <p className="text-[11.5px] text-muted mt-0.5">{item.sub}</p>
              </div>
              <NIcon name="fwd" size={16} strokeWidth={2} className="text-muted flex-shrink-0" aria-hidden="true" />
            </button>
          ))}
        </nav>

        {/* Logout button (only if logged in) */}
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-[12px]
              border border-red-200 text-red-500 text-[13px] font-semibold
              hover:bg-red-50 transition-colors disabled:opacity-50 mb-5"
          >
            {loggingOut
              ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" aria-hidden="true" />
              : <NIcon name="back" size={15} strokeWidth={2} aria-hidden="true" />}
            Se déconnecter
          </button>
        )}

        {/* WhatsApp CTA */}
        <section aria-label="Contact" className="bg-ink rounded-[16px] p-5 text-white">
          <p className="font-serif font-semibold text-[16px] mb-1">Une question ?</p>
          <p className="text-[13px] text-white/65 mb-4">Contactez-nous directement sur WhatsApp, nous répondons rapidement.</p>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Contacter ND WORLD sur WhatsApp"
            className="inline-flex items-center gap-2.5 px-5 h-11 rounded-[10px] bg-wa text-white
              text-[12px] font-semibold hover:bg-wa-d transition-colors"
          >
            <WAGlyph size={18} aria-hidden="true" /> WhatsApp
          </a>
        </section>

        <p className="text-center text-[11px] text-muted mt-8">ND WORLD · Dakar, Sénégal</p>
      </main>
    </>
  )
}
