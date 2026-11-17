import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const put = vi.fn()
vi.mock('@/lib/clientAxios', () => ({ default: { put: (...a: unknown[]) => put(...a), post: vi.fn(), get: vi.fn() } }))
vi.mock('@/lib/analytics', () => ({ trackAddToCart: vi.fn(), trackRemoveFromCart: vi.fn() }))
vi.mock('@/lib/events', () => ({ logEvent: vi.fn() }))

import { startCartSync, CART_SYNC_DELAY_MS } from './cartSync'
import { useCartStore } from '@/store/cartStore'
import { useClientAuthStore } from '@/store/clientAuthStore'

const robe = { id: 7, nom: 'Robe', slug: 'robe', prix: 15000, image: null, couleur: null, taille: 'M', qty: 1 }

function connecter() {
  useClientAuthStore.setState({ user: { id: 3, nom_complet: 'Awa Diallo', email: 'awa@example.com' }, token: 't', isAuthenticated: true })
}

describe('cartSync — copie serveur du panier des clients connectés', () => {
  let stop: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    put.mockReset().mockResolvedValue({ data: { success: true } })
    localStorage.clear()
    useCartStore.setState({ items: [], coupon: null })
    useClientAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  })

  afterEach(() => {
    stop?.()
    vi.useRealTimers()
  })

  it("n'envoie rien pour un visiteur non connecté", async () => {
    stop = startCartSync()
    useCartStore.getState().addItem(robe)
    await vi.advanceTimersByTimeAsync(CART_SYNC_DELAY_MS * 2)
    expect(put).not.toHaveBeenCalled()
  })

  it('envoie le panier une seule fois après une rafale de modifications', async () => {
    connecter()
    stop = startCartSync()
    useCartStore.getState().addItem(robe)
    useCartStore.getState().addItem(robe)
    await vi.advanceTimersByTimeAsync(CART_SYNC_DELAY_MS + 10)

    expect(put).toHaveBeenCalledTimes(1)
    expect(put).toHaveBeenCalledWith('/api/client/cart/sync', {
      items: [{ produit_id: 7, quantite: 2, taille: 'M', couleur: null }],
    })
  })

  it("ne renvoie pas un contenu identique, même après rechargement de la page", async () => {
    connecter()
    stop = startCartSync()
    useCartStore.getState().addItem(robe)
    await vi.advanceTimersByTimeAsync(CART_SYNC_DELAY_MS + 10)
    stop()

    stop = startCartSync() // nouvelle page, même panier
    await vi.advanceTimersByTimeAsync(CART_SYNC_DELAY_MS + 10)
    expect(put).toHaveBeenCalledTimes(1)
  })

  it('envoie un panier vide quand le client vide son panier', async () => {
    connecter()
    stop = startCartSync()
    useCartStore.getState().addItem(robe)
    await vi.advanceTimersByTimeAsync(CART_SYNC_DELAY_MS + 10)
    useCartStore.getState().clearCart()
    await vi.advanceTimersByTimeAsync(CART_SYNC_DELAY_MS + 10)

    expect(put).toHaveBeenLastCalledWith('/api/client/cart/sync', { items: [] })
  })

  it('renvoie le panier après une déconnexion puis reconnexion', async () => {
    connecter()
    stop = startCartSync()
    useCartStore.getState().addItem(robe)
    await vi.advanceTimersByTimeAsync(CART_SYNC_DELAY_MS + 10)

    useClientAuthStore.setState({ user: null, token: null, isAuthenticated: false })
    connecter()
    await vi.advanceTimersByTimeAsync(CART_SYNC_DELAY_MS + 10)

    expect(put).toHaveBeenCalledTimes(2)
  })

  it('envoie le panier existant dès la connexion', async () => {
    stop = startCartSync()
    useCartStore.getState().addItem(robe)
    connecter()
    await vi.advanceTimersByTimeAsync(CART_SYNC_DELAY_MS + 10)
    expect(put).toHaveBeenCalledTimes(1)
  })
})
