import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { logEvent } from '@/lib/events'

export interface WishlistItem {
  id: number
  nom: string
  slug: string
  prix: number
  prix_promo: number | null
  image_principale: string | null
}

interface WishlistState {
  items: WishlistItem[]
  toggle: (item: WishlistItem) => void
  has: (id: number) => boolean
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) =>
        set((s) => {
          const present = s.items.some((x) => x.id === item.id)
          logEvent(present ? 'retrait_wishlist' : 'ajout_wishlist', { produit_id: item.id })
          return {
            items: present
              ? s.items.filter((x) => x.id !== item.id)
              : [...s.items, item],
          }
        }),
      has: (id) => get().items.some((x) => x.id === id),
      clear: () => set({ items: [] }),
    }),
    { name: 'ndeya-wishlist' },
  ),
)
