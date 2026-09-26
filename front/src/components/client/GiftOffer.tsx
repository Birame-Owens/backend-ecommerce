import { Link } from 'react-router-dom'
import { NIcon } from './NIcon'
import type { OffreCadeau } from '@/api/client/offresCadeaux'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }

function variantText(offre: OffreCadeau) {
  return [offre.couleur, offre.taille].filter(Boolean).join(' · ')
}

/** Badge « 🎁 CADEAU OFFERT » pour les cartes et la fiche produit. */
export function GiftBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-ok text-white ${className}`}
    >
      <NIcon name="gift" size={11} strokeWidth={2.2} />
      Cadeau offert
    </span>
  )
}

/** Libellé de la condition d'achat : « Achetez ce produit » / « Achetez-en 2 ». */
function conditionText(offre: OffreCadeau) {
  return offre.quantite_declencheur > 1
    ? `Achetez-en ${offre.quantite_declencheur} et recevez gratuitement :`
    : 'Achetez ce produit et recevez gratuitement :'
}

/** Bloc « Votre cadeau » de la fiche produit. */
export function GiftOfferBlock({ offre }: { offre: OffreCadeau }) {
  const { cadeau } = offre
  const variant = variantText(offre)

  const visual = (
    <div className="w-[72px] h-[90px] flex-shrink-0 rounded-[10px] overflow-hidden bg-sand">
      {cadeau.image
        ? <img src={cadeau.image} alt={cadeau.nom} className="w-full h-full object-cover" loading="lazy" />
        : <div className="w-full h-full bg-gradient-to-br from-sand to-camel/30" />}
    </div>
  )

  return (
    <section
      aria-label="Votre cadeau"
      className="rounded-[14px] border-2 border-dashed border-ok/40 bg-ok/5 p-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <GiftBadge />
        <span className="text-[12px] font-semibold uppercase tracking-wide text-ok">Votre cadeau</span>
      </div>
      <p className="text-[12.5px] text-ink-2 mb-3">{conditionText(offre)}</p>

      <div className="flex gap-3 items-center">
        {cadeau.slug ? <Link to={`/produits/${cadeau.slug}`}>{visual}</Link> : visual}
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-ink leading-snug line-clamp-2">
            {offre.quantite_offerte > 1 && <span>{offre.quantite_offerte} × </span>}
            {cadeau.nom}
          </p>
          {variant && <p className="text-[11.5px] text-muted mt-0.5">{variant}</p>}
          <p className="text-[12px] text-muted mt-1">Valeur {fmt(cadeau.valeur * offre.quantite_offerte)}</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-[12px] text-muted line-through tabular-nums">{fmt(cadeau.valeur * offre.quantite_offerte)}</span>
            <span className="text-[13px] font-bold text-ok">GRATUIT — OFFERT</span>
          </p>
        </div>
      </div>

      <p className="text-[11px] text-muted mt-3">Ajouté automatiquement à votre panier, sans rien sélectionner.</p>
    </section>
  )
}

/** Ligne cadeau dans le panier et le récapitulatif de commande. */
export function CartGiftRow({ offre, quantity, compact = false }: {
  offre: OffreCadeau
  quantity: number
  compact?: boolean
}) {
  const { cadeau } = offre
  const variant = variantText(offre)

  if (compact) {
    return (
      <div className="flex justify-between items-start gap-2 text-[13px]">
        <span className="text-ink-2 leading-snug line-clamp-2 flex-1">
          🎁 {cadeau.nom}{variant ? ` · ${variant}` : ''}
          <span className="text-muted"> ×{quantity}</span>
        </span>
        <span className="text-ok font-semibold tabular-nums flex-shrink-0">OFFERT — 0 F</span>
      </div>
    )
  }

  return (
    <div className="flex gap-4 py-5 border-b border-line last:border-0">
      <div className="w-[80px] h-[100px] sm:w-[90px] sm:h-[112px] flex-shrink-0 rounded-[12px] overflow-hidden bg-sand">
        {cadeau.image
          ? <img src={cadeau.image} alt={cadeau.nom} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-sand to-camel/30" />}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <GiftBadge className="self-start mb-1.5" />
        <p className="text-[13.5px] font-semibold text-ink line-clamp-2 leading-snug">{cadeau.nom}</p>
        {variant && <p className="text-[11px] text-muted mt-1">{variant}</p>}
        <p className="text-[11px] text-muted mt-1">Quantité : {quantity} · offert avec votre achat</p>
        <div className="mt-auto pt-2 flex items-baseline gap-2">
          <span className="text-[12px] text-muted line-through tabular-nums">{fmt(cadeau.valeur * quantity)}</span>
          <span className="text-[13.5px] font-bold text-ok">OFFERT — 0 F</span>
        </div>
      </div>
    </div>
  )
}
