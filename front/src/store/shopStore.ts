import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import clientApi from '@/lib/clientAxios'

interface ShopState {
  waNumber: string
  shopName: string
  logo: string | null
  instagram: string
  facebook: string
  tiktok: string
  email: string
  address: string
  loaded: boolean
  load: () => Promise<void>
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      waNumber: '221784661412',
      shopName: 'ND WORLD',
      logo: null,
      instagram: '',
      facebook: '',
      tiktok: '',
      email: 'contact@nd-world.site',
      address: 'Dakar, Sénégal',
      loaded: false,
      load: async () => {
        try {
          const res = await clientApi.get('/api/client/config')
          if (res.data.success) {
            const c = res.data.data.company
            set({
              waNumber: (c.whatsapp ?? '').replace(/\D/g, '') || get().waNumber,
              shopName: c.name ?? get().shopName,
              logo: c.logo ?? null,
              instagram: c.instagram ?? '',
              facebook: c.facebook ?? '',
              tiktok: c.tiktok ?? '',
              email: c.email || get().email,
              address: c.address || get().address,
              loaded: true,
            })
          }
        } catch (e) {
          console.error('[shopStore] Impossible de charger la config boutique', e)
        }
      },
    }),
    {
      name: 'ndw-shop-config',
      partialize: (s) => ({
        waNumber: s.waNumber, shopName: s.shopName, logo: s.logo,
        instagram: s.instagram, facebook: s.facebook, tiktok: s.tiktok,
        email: s.email, address: s.address,
      }),
    }
  )
)

export function buildWaUrl(waNumber: string, message: string): string {
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
}
