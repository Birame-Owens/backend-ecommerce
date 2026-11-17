import clientApi from '@/lib/clientAxios'
import { useCartStore, type CartItem } from '@/store/cartStore'
import { useClientAuthStore } from '@/store/clientAuthStore'

/**
 * Copie côté serveur du panier d'un client CONNECTÉ.
 *
 * Le panier de référence reste celui du navigateur (cartStore). On envoie
 * son contenu au serveur quelques secondes après chaque modification, pour
 * que les relances e-mail des paniers abandonnés sachent ce qu'il contient.
 * Visiteurs anonymes : rien n'est envoyé.
 *
 * Coût réseau minimal : un seul envoi par rafale de modifications (délai),
 * et aucun envoi si le contenu est identique au dernier envoyé (signature
 * mémorisée, y compris d'une page à l'autre).
 */

export const CART_SYNC_DELAY_MS = 2500
const STORAGE_KEY = 'ndeya-cart-sync'

export function cartSignature(items: CartItem[]): string {
  return items
    .map((i) => `${i.id}|${i.taille ?? ''}|${i.couleur ?? ''}|${i.qty}`)
    .sort()
    .join(';')
}

function readLastSent(): string | null {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}

function writeLastSent(value: string) {
  try { localStorage.setItem(STORAGE_KEY, value) } catch { /* stockage indisponible */ }
}

export function startCartSync(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastSent = readLastSent()

  const pending = () => {
    const { user, token } = useClientAuthStore.getState()
    if (!user || !token) return null
    const items = useCartStore.getState().items
    return { items, key: `${user.id}:${cartSignature(items)}` }
  }

  const send = async () => {
    timer = null
    const current = pending()
    if (!current || current.key === lastSent) return
    try {
      await clientApi.put('/api/client/cart/sync', {
        items: current.items.map((i) => ({
          produit_id: i.id,
          quantite: i.qty,
          taille: i.taille,
          couleur: i.couleur,
        })),
      })
      lastSent = current.key
      writeLastSent(current.key)
    } catch {
      // Silencieux : le panier du navigateur reste intact, on réessaiera à la prochaine modification.
    }
  }

  const schedule = () => {
    const current = pending()
    if (!current && lastSent !== null) {
      // Déconnexion : le serveur supprime sa copie du panier, il faudra la renvoyer à la reconnexion.
      lastSent = null
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* stockage indisponible */ }
    }
    if (!current || current.key === lastSent) {
      if (timer) { clearTimeout(timer); timer = null }
      return
    }
    if (timer) clearTimeout(timer)
    timer = setTimeout(send, CART_SYNC_DELAY_MS)
  }

  const unsubCart = useCartStore.subscribe(schedule)
  const unsubAuth = useClientAuthStore.subscribe(schedule)
  schedule()

  return () => {
    unsubCart()
    unsubAuth()
    if (timer) clearTimeout(timer)
  }
}
