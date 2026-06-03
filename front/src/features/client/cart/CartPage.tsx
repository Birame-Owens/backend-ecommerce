import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NIcon, WAGlyph } from '@/components/client/NIcon'
import { useCartStore, cartTotal, cartSubtotal, cartCount, type CartItem } from '@/store/cartStore'
import { checkoutApi } from '@/api/client/checkout'
import { useToastStore } from '@/store/toastStore'
import { useShopStore, buildWaUrl } from '@/store/shopStore'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }

function variantLabels(item: CartItem) {
  const tv = item.type_variante
  const l1 = tv === 'parfum' ? 'Senteur' : 'Couleur'
  const l2 = tv === 'parfum' ? 'Contenance' : tv === 'chaussure' ? 'Pointure' : 'Taille'
  return { l1, l2 }
}

/* ─── Confirm-delete modal ─────────────────────────────────────── */
function DeleteModal({ name, onConfirm, onCancel }: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="w-full max-w-sm bg-white rounded-[20px] p-6 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
          <NIcon name="trash" size={22} strokeWidth={1.8} className="text-red-400" />
        </div>
        <h3 id="delete-modal-title" className="font-serif font-bold text-[18px] text-ink text-center mb-1">Retirer l'article ?</h3>
        <p className="text-[13px] text-muted text-center mb-6 line-clamp-2 px-2">{name}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            autoFocus
            className="flex-1 h-11 rounded-[10px] border border-line text-[13px] font-semibold text-ink
              hover:bg-paper transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 rounded-[10px] bg-red-500 text-white text-[13px] font-semibold
              hover:bg-red-600 transition-colors"
          >
            Retirer
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Single cart row ──────────────────────────────────────────── */
function CartItemRow({ item, onRemoveRequest }: {
  item: CartItem
  onRemoveRequest: (item: CartItem) => void
}) {
  const { updateQty } = useCartStore()

  return (
    <div className="flex gap-4 py-5 border-b border-line last:border-0">
      {/* Image */}
      <div
        className="w-[80px] h-[100px] sm:w-[90px] sm:h-[112px] flex-shrink-0
          rounded-[12px] overflow-hidden cursor-pointer"
      >
        {item.image
          ? <img src={item.image} alt={item.nom} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-sand to-camel/30" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13.5px] font-semibold text-ink line-clamp-2 leading-snug">{item.nom}</p>
          <button
            onClick={() => onRemoveRequest(item)}
            className="flex-shrink-0 w-7 h-7 grid place-items-center rounded-full
              text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Retirer"
          >
            <NIcon name="close" size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Variants */}
        {(item.couleur || item.taille) && (() => {
          const { l1, l2 } = variantLabels(item)
          return (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {item.couleur && (
                <span className="text-[10.5px] text-muted bg-paper border border-line px-2 py-0.5 rounded-full">
                  <span className="font-semibold text-ink-2">{l1} :</span> {item.couleur}
                </span>
              )}
              {item.taille && (
                <span className="text-[10.5px] text-muted bg-paper border border-line px-2 py-0.5 rounded-full">
                  <span className="font-semibold text-ink-2">{l2} :</span> {item.taille}
                </span>
              )}
            </div>
          )
        })()}

        <div className="flex-1" />

        {/* Price + qty */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[14px] font-bold text-ink tabular-nums">{fmt(item.prix * item.qty)}</span>

          <div
            role="group"
            aria-label={`Quantité pour ${item.nom}`}
            className="flex items-center rounded-[8px] border border-line-2 overflow-hidden bg-white"
          >
            <button
              onClick={() => {
                if (item.qty <= 1) { onRemoveRequest(item); return }
                updateQty(item.key, -1)
              }}
              aria-label={`Diminuer la quantité de ${item.nom}`}
              className="w-9 h-9 grid place-items-center hover:bg-paper transition-colors"
            >
              <NIcon name="minus" size={13} strokeWidth={2} />
            </button>
            <span
              aria-live="polite"
              aria-atomic="true"
              className="w-8 text-center text-[13px] font-bold text-ink select-none"
            >
              {item.qty}
            </span>
            <button
              onClick={() => updateQty(item.key, 1)}
              aria-label={`Augmenter la quantité de ${item.nom}`}
              disabled={item.stock_max != null && item.qty >= item.stock_max}
              className="w-9 h-9 grid place-items-center hover:bg-paper transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <NIcon name="plus" size={13} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Coupon section ───────────────────────────────────────────── */
function CouponSection() {
  const { coupon, applyCoupon, removeCoupon, items } = useCartStore()
  const toast = useToastStore((s) => s.show)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApply() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setError('')
    setLoading(true)
    try {
      const sub = cartSubtotal(items)
      const res = await checkoutApi.validateCoupon(trimmed, sub)
      if (res.data.success) {
        applyCoupon({ code: res.data.data.code, nom: res.data.data.nom, discount: res.data.data.discount })
        toast('Code promo appliqué !', 'check')
        setCode('')
      } else {
        setError(res.data.message ?? 'Code invalide ou expiré')
      }
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      if (status === 422) setError(msg ?? 'Ce code ne peut pas être appliqué à votre panier')
      else if (status === 404) setError('Code promo introuvable')
      else setError(msg ?? 'Erreur lors de la validation du code')
    } finally {
      setLoading(false)
    }
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-2 p-3 rounded-[10px] bg-ok/10 border border-ok/30">
        <div className="flex items-center gap-2 min-w-0">
          <NIcon name="shield" size={14} strokeWidth={2} className="text-ok flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[11.5px] font-bold text-ok uppercase tracking-wide">{coupon.code}</p>
            <p className="text-[11px] text-ok/80 truncate">{coupon.nom} — -{fmt(coupon.discount)}</p>
          </div>
        </div>
        <button
          onClick={removeCoupon}
          className="flex-shrink-0 w-6 h-6 grid place-items-center rounded-full hover:bg-red-100 text-muted hover:text-red-500 transition-colors"
        >
          <NIcon name="close" size={12} strokeWidth={2} />
        </button>
      </div>
    )
  }

  const errId = 'coupon-error'
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          id="coupon-input"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Code promo"
          aria-label="Code promotionnel"
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          autoCapitalize="characters"
          className="flex-1 h-10 px-3 rounded-[8px] border border-line text-[13px] bg-white
            focus:outline-none focus:border-accent transition-colors placeholder:text-muted/60"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          aria-label="Appliquer le code promo"
          className="h-10 px-4 rounded-[8px] bg-ink text-white text-[12px] font-semibold
            hover:bg-ink/80 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" aria-hidden="true" />
            : 'Appliquer'}
        </button>
      </div>
      {error && <p id={errId} role="alert" className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}

/* ─── Page ─────────────────────────────────────────────────────── */
export function CartPage() {
  const navigate = useNavigate()
  const { items, clearCart, removeItem, coupon } = useCartStore()
  const subtotal = cartSubtotal(items)
  const total = cartTotal(items, coupon)
  const count = cartCount(items)
  const waNumber = useShopStore((s) => s.waNumber)

  const [pendingItem, setPendingItem] = useState<CartItem | null>(null)

  /* WhatsApp message */
  const waMsg = [
    'Bonjour ND WORLD 👋, je voudrais passer cette commande :',
    '',
    ...items.map((i) => {
      const { l1, l2 } = variantLabels(i)
      return `• ${i.nom}${i.couleur ? ` — ${l1}: ${i.couleur}` : ''}${i.taille ? `, ${l2}: ${i.taille}` : ''} ×${i.qty} — ${fmt(i.prix * i.qty)}`
    }),
    ...(coupon ? [`\nCode promo: ${coupon.code} (-${fmt(coupon.discount)})`] : []),
    '',
    `*Total : ${fmt(total)}*`,
  ].join('\n')
  const waUrl = buildWaUrl(waNumber, waMsg)

  function handleRemoveRequest(item: CartItem) {
    setPendingItem(item)
  }

  function confirmRemove() {
    if (pendingItem) removeItem(pendingItem.key)
    setPendingItem(null)
  }

  return (
    <>
      {/* Delete modal */}
      {pendingItem && (
        <DeleteModal
          name={pendingItem.nom}
          onConfirm={confirmRemove}
          onCancel={() => setPendingItem(null)}
        />
      )}

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur-xl border-b border-line">
        <div className="flex items-center h-14 px-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors"
          >
            <NIcon name="back" size={20} strokeWidth={1.8} />
          </button>
          <span className="flex-1 font-serif font-semibold text-[17px] text-ink">
            Mon panier{count > 0 && <span className="text-[13px] font-normal text-muted ml-2">({count})</span>}
          </span>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11.5px] font-semibold text-muted hover:text-red-500 transition-colors"
            >
              Vider
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

        {/* Desktop heading */}
        <div className="hidden md:block mb-8">
          <p className="text-[10px] font-semibold tracking-[.2em] uppercase text-accent mb-2">Commande</p>
          <div className="flex items-end justify-between">
            <h1 className="font-serif font-bold text-[34px] text-ink leading-none">
              Mon panier
              {count > 0 && (
                <span className="ml-3 text-[18px] font-normal text-muted">— {count} article{count > 1 ? 's' : ''}</span>
              )}
            </h1>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="flex items-center gap-2 px-4 h-9 rounded-full border border-line
                  text-[12px] font-semibold text-muted hover:text-red-500 hover:border-red-200
                  hover:bg-red-50 transition-colors"
              >
                <NIcon name="trash" size={14} strokeWidth={2} />
                Vider le panier
              </button>
            )}
          </div>
        </div>

        {/* ─── Empty state ─── */}
        {items.length === 0 ? (
          <div className="text-center py-20 md:py-28">
            <div className="w-20 h-20 rounded-full bg-sand flex items-center justify-center mx-auto mb-5">
              <NIcon name="bag" size={36} strokeWidth={1.3} className="text-accent opacity-50" />
            </div>
            <h2 className="font-serif font-bold text-[22px] text-ink mb-2">Votre panier est vide</h2>
            <p className="text-[14px] text-muted mb-7 max-w-xs mx-auto">
              Ajoutez des produits depuis nos collections pour commencer.
            </p>
            <button
              onClick={() => navigate('/categories')}
              className="inline-flex items-center gap-2 px-7 h-12 rounded-[10px] bg-accent text-white
                text-[12px] font-semibold tracking-widest uppercase hover:bg-accent-dark transition-colors"
            >
              Explorer les collections <NIcon name="arrow" size={14} strokeWidth={2} />
            </button>
          </div>
        ) : (
          /* ─── Cart layout ─── */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">

            {/* Left — item list */}
            <div className="bg-white rounded-[18px] border border-line shadow-sm px-5 sm:px-6">
              {items.map((item) => (
                <CartItemRow key={item.key} item={item} onRemoveRequest={handleRemoveRequest} />
              ))}

              {/* Continue shopping */}
              <div className="py-4">
                <button
                  onClick={() => navigate('/categories')}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-muted
                    hover:text-accent transition-colors"
                >
                  <NIcon name="back" size={14} strokeWidth={2} />
                  Continuer mes achats
                </button>
              </div>
            </div>

            {/* Right — sticky summary */}
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-[18px] border border-line shadow-sm p-5 sm:p-6">
                <h2 className="font-serif font-bold text-[20px] text-ink mb-4">Récapitulatif</h2>

                {/* Item lines */}
                <div className="space-y-2 mb-4">
                  {items.map((item) => {
                    const { l1, l2 } = variantLabels(item)
                    return (
                      <div key={item.key} className="flex justify-between items-start gap-2 text-[13px]">
                        <span className="text-ink-2 leading-snug line-clamp-2 flex-1">
                          {item.nom}
                          {item.couleur ? ` · ${l1}: ${item.couleur}` : ''}
                          {item.taille ? ` · ${l2}: ${item.taille}` : ''}
                          <span className="text-muted"> ×{item.qty}</span>
                        </span>
                        <span className="text-ink font-medium tabular-nums flex-shrink-0">{fmt(item.prix * item.qty)}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Coupon input */}
                <div className="border-t border-line pt-3 mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">Code promo</p>
                  <CouponSection />
                </div>

                {/* Subtotal / discount / shipping */}
                <div className="border-t border-line pt-3 mb-3 space-y-1.5">
                  <div className="flex justify-between text-[13px] text-muted">
                    <span>Sous-total</span>
                    <span className="tabular-nums">{fmt(subtotal)}</span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-[13px] text-ok font-medium">
                      <span>Réduction ({coupon.code})</span>
                      <span className="tabular-nums">-{fmt(coupon.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px] text-muted">
                    <span>Livraison</span>
                    <span className="font-medium text-ok">À confirmer</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-baseline border-t border-line pt-3 mb-5">
                  <span className="font-semibold text-[15px] text-ink">Total estimé</span>
                  <span className="font-bold text-[22px] text-accent tabular-nums">{fmt(total)}</span>
                </div>

                {/* Payer en ligne CTA */}
                <button
                  onClick={() => navigate('/checkout')}
                  className="flex items-center justify-center gap-2.5 w-full h-12 rounded-[10px]
                    bg-accent text-white text-[13px] font-semibold tracking-wide
                    hover:bg-accent-dark transition-colors mb-3"
                >
                  <NIcon name="lock" size={16} strokeWidth={2} />
                  Payer en ligne
                </button>

                {/* WhatsApp CTA */}
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full h-11 rounded-[10px]
                    bg-wa text-white text-[13px] font-semibold tracking-wide
                    hover:bg-wa-d transition-colors"
                >
                  <WAGlyph size={18} />
                  Commander via WhatsApp
                </a>

                <p className="text-[11px] text-muted text-center leading-relaxed mt-3">
                  Paiement sécurisé · Wave · Orange Money
                </p>
              </div>

              {/* Reassurance pills */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: 'shield', label: 'Qualité garantie' },
                  { icon: 'truck', label: 'Livraison rapide' },
                  { icon: 'lock', label: 'Commande sécurisée' },
                ].map((it) => (
                  <div key={it.icon}
                    className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-[12px] border border-line text-center">
                    <span className="text-accent"><NIcon name={it.icon} size={17} strokeWidth={1.6} /></span>
                    <span className="text-[10px] font-semibold text-ink leading-tight">{it.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
