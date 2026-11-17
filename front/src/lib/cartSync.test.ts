import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const put = vi.fn()
const get = vi.fn()
vi.mock('@/lib/clientAxios', () => ({ default: { put: (...a: unknown[]) => put(...a), post: vi.fn(), get: (...a: unknown[]) => get(...a) } }))
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
    get.mockReset().mockResolvedValue({ data: { data: { items: [] } } })
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

describe('cartSync — même panier sur un autre appareil', () => {
  let stop: () => void
  const serveur = [{ id: 9, nom: 'Huile', slug: 'huile', prix: 1500, image: null, couleur: 'Ambre', taille: '5ml', type_variante: 'parfum', qty: 2, stock_max: 5, sur_mesure: false, delai_production_jours: null }]

  beforeEach(() => {
    vi.useFakeTimers()
    put.mockReset().mockResolvedValue({ data: { success: true } })
    get.mockReset().mockResolvedValue({ data: { data: { items: serveur } } })
    localStorage.clear()
    useCartStore.setState({ items: [], coupon: null })
    useClientAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  })

  afterEach(() => {
    stop?.()
    vi.useRealTimers()
  })

  it('panier local vide : récupère le panier du serveur à la connexion, sans le renvoyer', async () => {
    stop = startCartSync()
    connecter()
    await vi.advanceTimersByTimeAsync(CART_SYNC_DELAY_MS * 2)

    expect(get).toHaveBeenCalledWith('/api/client/cart/sync')
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ id: 9, qty: 2, taille: '5ml', key: '9-Ambre-5ml' })
    expect(put).not.toHaveBeenCalled()
  })

  it("n'efface jamais la copie du serveur avec un panier vide avant de l'avoir relue", async () => {
    get.mockRejectedValue(new Error('réseau'))
    stop = startCartSync()
    connecter()
    await vi.advanceTimersByTimeAsync(CART_SYNC_DELAY_MS * 2)

    expect(put).not.toHaveBeenCalled()
    expect(get).toHaveBeenCalledTimes(1) // pas de nouvelles tentatives en boucle
  })

  it('panier local non vide : il fait foi, rien n\'est relu', async () => {
    stop = startCartSync()
    useCartStore.getState().addItem(robe)
    connecter()
    await vi.advanceTimersByTimeAsync(CART_SYNC_DELAY_MS + 10)

    expect(get).not.toHaveBeenCalled()
    expect(put).toHaveBeenCalledTimes(1)
    expect(useCartStore.getState().items.map((i) => i.id)).toEqual([7])
  })
})