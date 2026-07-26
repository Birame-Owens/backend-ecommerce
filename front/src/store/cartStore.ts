import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trackAddToCart, trackRemoveFromCart } from '@/lib/analytics'
import { logEvent } from '@/lib/events'

const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

export interface CartItem {
  key: string
  id: number
  nom: string
  slug: string
  prix: number
  image: string | null
  couleur: string | null
  taille: string | null
  type_variante?: 'vetement' | 'chaussure' | 'parfum' | 'aucun'
  qty: number
  stock_max?: number | null
  sur_mesure?: boolean
  delai_production_jours?: number | null
}

export interface CartCoupon {
  code: string
  nom: string
  discount: number
}

interface CartState {
  items: CartItem[]
  coupon: CartCoupon | null
  deliveryZoneId: number | null // zone choisie dans le panier, pré-remplie au checkout
  _savedAt: number
  addItem: (item: Omit<CartItem, 'key'>) => void
  removeItem: (key: string) => void
  updateQty: (key: string, delta: number) => void
  clearCart: () => void
  applyCoupon: (coupon: CartCoupon) => void
  removeCoupon: () => void
  setDeliveryZoneId: (id: number | null) => void
}

const now = () => Date.now()

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      deliveryZoneId: null,
      _savedAt: now(),
      addItem: (item) => {
        const key = `${item.id}-${item.couleur || 'nc'}-${item.taille || 'nc'}`
        trackAddToCart({ item_id: item.id, item_name: item.nom, price: item.prix, quantity: item.qty })
        logEvent('ajout_panier', { produit_id: item.id, metadata: { quantite: item.qty, couleur: item.couleur, taille: item.taille, prix: item.prix } })
        set((s) => {
          const existing = s.items.find((i) => i.key === key)
          if (existing) {
            const newQty = existing.qty + item.qty
            const capped = (item.stock_max != null) ? Math.min(newQty, item.stock_max) : newQty
            return { items: s.items.map((i) => i.key === key ? { ...i, qty: capped, stock_max: item.stock_max } : i), _savedAt: now() }
          }
          const initQty = (item.stock_max != null) ? Math.min(item.qty, item.stock_max) : item.qty
          return { items: [...s.items, { ...item, key, qty: initQty }], _savedAt: now() }
        })
      },
      removeItem: (key) => set((s) => {
        const removed = s.items.find((i) => i.key === key)
        if (removed) {
          trackRemoveFromCart({ item_id: removed.id, item_name: removed.nom, price: removed.prix, quantity: removed.qty })
          logEvent('retrait_panier', { produit_id: removed.id, metadata: { quantite: removed.qty } })
        }
        return { items: s.items.filter((i) => i.key !== key), _savedAt: now() }
      }),
      updateQty: (key, delta) =>
        set((s) => ({
          _savedAt: now(),
          items: s.items
            .map((i) => {
              if (i.key !== key) return i
              const raw = i.qty + delta
              const capped = (i.stock_max != null) ? Math.min(raw, i.stock_max) : raw
              return { ...i, qty: capped }
            })
            .filter((i) => i.qty > 0),
        })),
      clearCart: () => set({ items: [], coupon: null, _savedAt: now() }),
      applyCoupon: (coupon) => set({ coupon, _savedAt: now() }),
      removeCoupon: () => set({ coupon: null, _savedAt: now() }),
      setDeliveryZoneId: (id) => set({ deliveryZoneId: id, _savedAt: now() }),
    }),
    {
      name: 'ndeya-cart',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (!state._savedAt || now() - state._savedAt > CART_TTL_MS) {
          // Panier expiré : vider après la réhydratation
          setTimeout(() => {
            useCartStore.setState({ items: [], coupon: null, _savedAt: now() })
          }, 0)
        }
      },
    },
  ),
)

export const cartSubtotal = (items: CartItem[]) => items.reduce((s, i) => s + i.prix * i.qty, 0)
export const cartTotal = (items: CartItem[], coupon?: CartCoupon | null) => {
  const sub = cartSubtotal(items)
  return Math.max(0, sub - (coupon?.discount ?? 0))
}
export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0)
