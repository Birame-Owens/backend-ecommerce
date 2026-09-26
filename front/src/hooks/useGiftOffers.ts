import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { offresCadeauxApi, type OffreCadeau } from '@/api/client/offresCadeaux'
import type { CartItem } from '@/store/cartStore'

export interface CartGift {
  offre: OffreCadeau
  quantity: number
}

/** Nombre de cadeaux dus pour une quantité achetée (aligné sur OffreCadeau::cadeauxPour). */
export function giftsFor(offre: OffreCadeau, purchasedQty: number): number {
  const palier = Math.max(1, offre.quantite_declencheur)
  return Math.floor(Math.max(0, purchasedQty) / palier) * Math.max(1, offre.quantite_offerte)
}

/**
 * Cadeaux affichés dans le panier. Purement indicatif : le backend recalcule
 * les cadeaux au checkout (CheckoutService::reserveGifts), c'est lui qui fait foi.
 * Les variantes d'un même produit comptent ensemble.
 */
export function computeCartGifts(items: CartItem[], offers: Map<number, OffreCadeau>): CartGift[] {
  const qtyByProduct = new Map<number, number>()
  for (const item of items) {
    qtyByProduct.set(item.id, (qtyByProduct.get(item.id) ?? 0) + item.qty)
  }

  const gifts: CartGift[] = []
  for (const [productId, qty] of qtyByProduct) {
    const offre = offers.get(productId)
    if (!offre) continue
    const quantity = giftsFor(offre, qty)
    if (quantity > 0) gifts.push({ offre, quantity })
  }
  return gifts
}

/** Offres cadeau en cours, indexées par produit déclencheur. */
export function useGiftOffers() {
  const { data } = useQuery({
    queryKey: ['offres-cadeaux'],
    queryFn: () => offresCadeauxApi.list().then((r) => r.data.data),
    staleTime: 1000 * 60, // le stock du cadeau évolue
  })

  return useMemo(
    () => new Map((data ?? []).map((o) => [o.produit_declencheur_id, o])),
    [data],
  )
}

/** Offre cadeau d'un produit donné (null s'il n'en a pas). */
export function useGiftOffer(productId: number | undefined): OffreCadeau | null {
  const offers = useGiftOffers()
  return productId != null ? offers.get(productId) ?? null : null
}

/** Cadeaux dus pour le contenu du panier. */
export function useCartGifts(items: CartItem[]): CartGift[] {
  const offers = useGiftOffers()
  return useMemo(() => computeCartGifts(items, offers), [items, offers])
}
