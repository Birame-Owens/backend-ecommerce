import { NIcon } from './NIcon'
import { useDeliveryInfo } from '@/hooks/useDeliveryInfo'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }

/**
 * Repère de livraison honnête, affiché tôt (fiche produit) pour éviter
 * la surprise des frais au checkout — cause n°1 d'abandon de panier.
 * S'appuie sur les zones réelles + le seuil de gratuité (Dakar / proches).
 */
export function DeliveryHint({ className = '' }: { className?: string }) {
  const { minPaidPrice, freeThreshold, pickupName, hasFreeAboveThreshold, isLoading } = useDeliveryInfo()
  if (isLoading) return null

  const parts: string[] = []
  if (minPaidPrice != null) parts.push(`Livraison dès ${fmt(minPaidPrice)}`)
  if (hasFreeAboveThreshold && freeThreshold != null) parts.push(`gratuite dès ${fmt(freeThreshold)} d'achat (Dakar & environs)`)

  if (parts.length === 0 && !pickupName) return null

  return (
    <div className={`rounded-[12px] bg-paper border border-line px-3.5 py-2.5 ${className}`}>
      <div className="flex items-start gap-2.5">
        <NIcon name="truck" size={16} strokeWidth={1.6} className="text-accent flex-shrink-0 mt-0.5" />
        <div className="text-[12.5px] leading-relaxed">
          {parts.length > 0 && (
            <p className="text-ink-2">
              <span className="font-semibold text-ink">{parts[0]}</span>
              {parts[1] ? <> · {parts[1]}</> : null}
            </p>
          )}
          {pickupName && (
            <p className="text-muted">
              Ou <span className="font-semibold text-ink-2">{pickupName}</span> — gratuit
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
