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
import { reviewsClientApi } from '@/api/client/reviews'

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

// Statuts à partir desquels un client peut laisser un avis (aligné sur le backend)
const REVIEWABLE = new Set(['confirmee', 'en_preparation', 'prete', 'en_livraison', 'livree'])

type OrderItem = {
  id: number
  numero_commande: string
  statut: string
  montant_total: number
  created_at: string
  items_count?: number
  articles?: Array<{ produit_id: number; nom_produit: string; quantite: number }>
}

/* ── Modale : laisser un avis sur un produit d'une commande ── */
function ReviewModal({ order, onClose }: { order: OrderItem | null; onClose: () => void }) {
  const toast = useToastStore((s) => s.show)
  const articles = order?.articles ?? []
  const [produitId, setProduitId] = useState<number | null>(null)
  const [note, setNote] = useState(5)
  const [commentaire, setCommentaire] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  if (!order) return null
  const selected = produitId ?? articles[0]?.produit_id ?? null

  async function submit() {
    if (!order || !selected) return
    if (commentaire.trim().length < 10) {
      toast('Votre avis doit faire au moins 10 caractères.', 'close')
      return
    }
    setSubmitting(true)
    try {
      const res = await reviewsClientApi.submit({
        commande_id: order.id,
        produit_id: selected,
        note_globale: note,
        commentaire: commentaire.trim(),
        photos,
      })
      toast(res.data.message ?? 'Merci pour votre avis !', 'check')
      onClose()
    } catch (e: any) {
      toast(e?.response?.data?.message ?? "Erreur lors de l'envoi de votre avis.", 'close')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full sm:max-w-md rounded-t-[20px] sm:rounded-[18px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-white">
          <h3 className="font-serif font-semibold text-[16px] text-ink">Laisser un avis</h3>
          <button onClick={onClose} aria-label="Fermer" className="text-muted hover:text-ink">
            <NIcon name="close" size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-ink mb-1.5">Produit</label>
            <select
              value={selected ?? ''}
              onChange={(e) => setProduitId(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-[10px] border border-line text-[13px] text-ink bg-paper"
            >
              {articles.map((a) => (
                <option key={a.produit_id} value={a.produit_id}>{a.nom_produit}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-ink mb-1.5">Note</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setNote(n)} aria-label={`${n} sur 5`}
                  className={`text-[26px] leading-none ${n <= note ? 'text-amber-400' : 'text-line-2'}`}>★</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-ink mb-1.5">Votre avis</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={4}
              maxLength={1500}
              placeholder="Partagez votre expérience sur ce produit…"
              className="w-full px-3 py-2.5 rounded-[10px] border border-line text-[13px] text-ink bg-paper resize-none"
            />
            <p className="text-[11px] text-muted mt-1">{commentaire.trim().length}/1500 · minimum 10 caractères</p>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-ink mb-1.5">Photos (optionnel, max 3)</label>
            <input
              type="file" accept="image/*" multiple
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 3))}
              className="block w-full text-[12px] text-muted file:mr-3 file:py-2 file:px-3 file:rounded-[8px] file:border-0 file:bg-accent/10 file:text-accent file:text-[12px] file:font-semibold"
            />
            {photos.length > 0 && (
              <div className="flex gap-2 mt-2">
                {photos.map((f, k) => (
                  <img key={k} src={URL.createObjectURL(f)} alt="" className="w-14 h-14 rounded-lg object-cover border border-line" />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full h-12 rounded-[12px] bg-accent text-white text-[13px] font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
            Envoyer mon avis
          </button>
          <p className="text-[11px] text-muted text-center">Votre avis sera publié après validation par la boutique.</p>
        </div>
      </div>
    </div>
  )
}

function OrderHistory() {
  const [reviewOrder, setReviewOrder] = useState<OrderItem | null>(null)
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
    <>
      <div className="space-y-2" role="list">
        {data.slice(0, 5).map((order) => {
          const itemsCount = order.items_count ?? order.articles?.length ?? 0
          const canReview = REVIEWABLE.has(order.statut) && (order.articles?.length ?? 0) > 0
          return (
            <div
              key={order.numero_commande}
              role="listitem"
              className="px-4 py-3 bg-paper rounded-[12px] border border-line"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-ink font-mono truncate">#{order.numero_commande}</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {itemsCount} article{itemsCount > 1 ? 's' : ''}
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
              {canReview && (
                <button
                  onClick={() => setReviewOrder(order)}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-accent hover:underline"
                >
                  <span aria-hidden="true" className="text-amber-400">★</span> Laisser un avis
                </button>
              )}
            </div>
          )
        })}
      </div>

      <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} />
    </>
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
