import { describe, it, expect } from 'vitest'
import { computeCartGifts, giftsFor } from './useGiftOffers'
import type { OffreCadeau } from '@/api/client/offresCadeaux'
import type { CartItem } from '@/store/cartStore'

const offre = (over: Partial<OffreCadeau> = {}): OffreCadeau => ({
  id: 1,
  produit_declencheur_id: 10,
  quantite_declencheur: 1,
  quantite_offerte: 1,
  couleur: null,
  taille: null,
  cadeau: { id: 20, nom: 'Sac à franges', slug: 'sac', image: null, valeur: 2500 },
  ...over,
})

const item = (id: number, qty: number, over: Partial<CartItem> = {}): CartItem => ({
  key: `${id}-${over.couleur ?? 'nc'}-${over.taille ?? 'nc'}`,
  id, nom: `Produit ${id}`, slug: `p-${id}`, prix: 4500, image: null,
  couleur: null, taille: null, qty, ...over,
})

describe('giftsFor', () => {
  it('offre 1 cadeau par produit acheté par défaut', () => {
    expect(giftsFor(offre(), 1)).toBe(1)
    expect(giftsFor(offre(), 2)).toBe(2)
  })

  it('respecte le palier d\'achat', () => {
    const o = offre({ quantite_declencheur: 2 })
    expect(giftsFor(o, 1)).toBe(0)
    expect(giftsFor(o, 3)).toBe(1)
    expect(giftsFor(o, 4)).toBe(2)
  })

  it('multiplie par la quantité offerte', () => {
    expect(giftsFor(offre({ quantite_offerte: 2 }), 3)).toBe(6)
  })
})

describe('computeCartGifts', () => {
  const offers = new Map([[10, offre()]])

  it('ajoute le cadeau quand le produit déclencheur est au panier', () => {
    const gifts = computeCartGifts([item(10, 1)], offers)
    expect(gifts).toHaveLength(1)
    expect(gifts[0].quantity).toBe(1)
    expect(gifts[0].offre.cadeau.nom).toBe('Sac à franges')
  })

  it('cumule les variantes d\'un même produit', () => {
    const gifts = computeCartGifts(
      [item(10, 1, { taille: 'M' }), item(10, 1, { taille: 'L' })],
      offers,
    )
    expect(gifts[0].quantity).toBe(2)
  })

  it('ignore les produits sans offre', () => {
    expect(computeCartGifts([item(99, 3)], offers)).toEqual([])
  })
})
