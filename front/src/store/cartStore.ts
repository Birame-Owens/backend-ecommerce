import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
}

export interface CartCoupon {
  code: string
  nom: string
  discount: number
}

interface CartState {
  items: CartItem[]
  coupon: CartCoupon | null
  addItem: (item: Omit<CartItem, 'key'>) => void
  removeItem: (key: string) => void
  updateQty: (key: string, delta: number) => void
  clearCart: () => void
  applyCoupon: (coupon: CartCoupon) => void
  removeCoupon: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      addItem: (item) => {
        const key = `${item.id}-${item.couleur || 'nc'}-${item.taille || 'nc'}`
        set((s) => {
          const existing = s.items.find((i) => i.key === key)
          if (existing) {
            const newQty = existing.qty + item.qty
            const capped = (item.stock_max != null) ? Math.min(newQty, item.stock_max) : newQty
            return { items: s.items.map((i) => i.key === key ? { ...i, qty: capped, stock_max: item.stock_max } : i) }
          }
          const initQty = (item.stock_max != null) ? Math.min(item.qty, item.stock_max) : item.qty
          return { items: [...s.items, { ...item, key, qty: initQty }] }
        })
      },
      removeItem: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      updateQty: (key, delta) =>
        set((s) => ({
          items: s.items
            .map((i) => {
              if (i.key !== key) return i
              const raw = i.qty + delta
              const capped = (i.stock_max != null) ? Math.min(raw, i.stock_max) : raw
              return { ...i, qty: capped }
            })
            .filter((i) => i.qty > 0),
        })),
      clearCart: () => set({ items: [], coupon: null }),
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),
    }),
    { name: 'ndeya-cart' },
  ),
)

export const cartSubtotal = (items: CartItem[]) => items.reduce((s, i) => s + i.prix * i.qty, 0)
export const cartTotal = (items: CartItem[], coupon?: CartCoupon | null) => {
  const sub = cartSubtotal(items)
  return Math.max(0, sub - (coupon?.discount ?? 0))
}
export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0)
