import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import clientApi from '@/lib/clientAxios'

interface ShopState {
  waNumber: string
  shopName: string
  loaded: boolean
  load: () => Promise<void>
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      waNumber: '221784661412',
      shopName: 'ND WORLD',
      loaded: false,
      load: async () => {
        try {
          const res = await clientApi.get('/api/client/config')
          if (res.data.success) {
            const c = res.data.data.company
            set({
              waNumber: (c.whatsapp ?? '').replace(/\D/g, '') || get().waNumber,
              shopName: c.name ?? get().shopName,
              loaded: true,
            })
          }
        } catch (e) {
          console.error('[shopStore] Impossible de charger la config boutique', e)
        }
      },
    }),
    { name: 'ndw-shop-config', partialize: (s) => ({ waNumber: s.waNumber, shopName: s.shopName }) }
  )
)

export function buildWaUrl(waNumber: string, message: string): string {
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
}
