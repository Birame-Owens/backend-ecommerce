import { useQuery } from '@tanstack/react-query'
import { checkoutApi, type DeliveryZone } from '@/api/client/checkout'
import { useShopStore } from '@/store/shopStore'

/** Zone de retrait sur place : prix 0 & ordre_affichage 0 (convention CheckoutPage). */
export function isPickupZone(z: DeliveryZone | null | undefined): boolean {
  return !!z && z.prix === 0 && z.ordre_affichage === 0
}

/**
 * Calcule les frais de livraison réels pour une zone donnée, en appliquant
 * la gratuité au-dessus du seuil pour les zones éligibles (Dakar / proches).
 * Doit rester aligné avec CheckoutService::calculateTotals côté backend.
 */
export function computeShipping(
  zone: DeliveryZone | null | undefined,
  subtotalAfterDiscount: number,
  freeThreshold: number | null,
): number {
  if (!zone) return 0
  if (zone.prix <= 0) return 0
  if (zone.eligible_gratuite && freeThreshold != null && subtotalAfterDiscount >= freeThreshold) {
    return 0
  }
  return zone.prix
}

/**
 * Repère de livraison partagé (fiche produit, panier, checkout).
 * Dérivé des zones réelles + du seuil de gratuité (config boutique).
 */
export function useDeliveryInfo() {
  const freeThreshold = useShopStore((s) => s.freeShippingThreshold)

  const { data, isLoading } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => checkoutApi.getDeliveryZones().then((r) => r.data.data),
    staleTime: 1000 * 60 * 30, // les zones changent rarement
  })

  const zones: DeliveryZone[] = data ?? []
  const paid = zones.filter((z) => z.prix > 0)
  const minPaidPrice = paid.length ? Math.min(...paid.map((z) => z.prix)) : null
  const pickup = zones.find(isPickupZone) ?? null
  // Une gratuité au-dessus du seuil est-elle possible pour au moins une zone ?
  const hasFreeAboveThreshold = freeThreshold != null && zones.some((z) => z.prix > 0 && z.eligible_gratuite)

  return {
    zones,
    minPaidPrice,
    pickup,
    pickupName: pickup?.nom ?? null,
    freeThreshold,
    hasFreeAboveThreshold,
    isLoading,
  }
}
