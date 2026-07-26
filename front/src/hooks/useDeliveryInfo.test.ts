import { describe, it, expect } from 'vitest'
import { computeShipping, isPickupZone } from './useDeliveryInfo'
import type { DeliveryZone } from '@/api/client/checkout'

const zone = (over: Partial<DeliveryZone>): DeliveryZone => ({
  id: 1, nom: 'Zone', prix: 2000, ordre_affichage: 1, eligible_gratuite: false, ...over,
})

describe('computeShipping', () => {
  const THRESHOLD = 20000

  it('retourne 0 sans zone', () => {
    expect(computeShipping(null, 50000, THRESHOLD)).toBe(0)
  })

  it('retourne 0 pour le retrait / une zone gratuite (prix 0)', () => {
    const pickup = zone({ prix: 0, ordre_affichage: 0 })
    expect(computeShipping(pickup, 0, THRESHOLD)).toBe(0)
  })

  it('applique la gratuité pour une zone éligible au-dessus du seuil', () => {
    const dakar = zone({ prix: 1500, eligible_gratuite: true })
    expect(computeShipping(dakar, 20000, THRESHOLD)).toBe(0)
    expect(computeShipping(dakar, 25000, THRESHOLD)).toBe(0)
  })

  it('facture une zone éligible en dessous du seuil', () => {
    const dakar = zone({ prix: 1500, eligible_gratuite: true })
    expect(computeShipping(dakar, 19999, THRESHOLD)).toBe(1500)
  })

  it('facture une zone NON éligible même au-dessus du seuil (régions lointaines)', () => {
    const region = zone({ prix: 6000, eligible_gratuite: false })
    expect(computeShipping(region, 50000, THRESHOLD)).toBe(6000)
  })

  it('facture si le seuil est désactivé (null), même pour une zone éligible', () => {
    const dakar = zone({ prix: 1500, eligible_gratuite: true })
    expect(computeShipping(dakar, 50000, null)).toBe(1500)
  })
})

describe('isPickupZone', () => {
  it('reconnaît le retrait (prix 0 & ordre 0)', () => {
    expect(isPickupZone(zone({ prix: 0, ordre_affichage: 0 }))).toBe(true)
  })
  it('rejette une zone payante et une zone gratuite non-retrait', () => {
    expect(isPickupZone(zone({ prix: 1500, ordre_affichage: 1 }))).toBe(false)
    expect(isPickupZone(zone({ prix: 0, ordre_affichage: 3 }))).toBe(false)
    expect(isPickupZone(null)).toBe(false)
  })
})
