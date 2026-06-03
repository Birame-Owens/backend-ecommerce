import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { NIcon, WAGlyph } from './NIcon'
import { NImage } from './NImage'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'
import { useToastStore } from '@/store/toastStore'
import { useShopStore, buildWaUrl } from '@/store/shopStore'
import type { ProductClient } from '@/api/client/home'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }

export const NProductCard = memo(function NProductCard({ product }: { product: ProductClient }) {
  const navigate = useNavigate()
  const { has, toggle } = useWishlistStore()
  const addItem = useCartStore((s) => s.addItem)
  const toast = useToastStore((s) => s.show)
  const waNumber = useShopStore((s) => s.waNumber)
  const liked = has(product.id)

  const displayPrice = product.prix_promo ?? product.prix
  const pct = product.prix_promo
    ? Math.round((1 - product.prix_promo / product.prix) * 100)
    : 0

  const waUrl = buildWaUrl(waNumber,
    `Bonjour ND WORLD 👋, je suis intéressé(e) par *${product.nom}* (${fmt(displayPrice)} CFA).`
  )

  const hasVariants = product.type_variante !== 'aucun' && product.type_variante !== undefined

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation()
    if (hasVariants) {
      navigate(`/produits/${product.slug}`)
      return
    }
    if (!canAdd) return
    addItem({
      id: product.id,
      nom: product.nom,
      slug: product.slug,
      prix: displayPrice,
      image: product.image_principale,
      couleur: null,
      taille: null,
      type_variante: 'aucun',
      qty: 1,
      stock_max: isUnlimited ? null : (product.stock_disponible ?? null),
    })
    toast('Ajouté au panier', 'check')
  }

  function handleToggleWishlist(e: React.MouseEvent) {
    e.stopPropagation()
    toggle({
      id: product.id,
      nom: product.nom,
      slug: product.slug,
      prix: product.prix,
      prix_promo: product.prix_promo,
      image_principale: product.image_principale,
    })
  }

  const stockStatus = product.stock_status?.status
  const inStock = stockStatus !== 'out_of_stock'
  const isLowStock = stockStatus === 'low_stock'
  const isUnlimited = stockStatus === 'unlimited' || product.stock_disponible == null

  /* Quantité déjà dans le panier pour ce produit (sans variante sélectionnée sur la carte) */
  const cartItems = useCartStore((s) => s.items)
  const cartKey = `${product.id}-nc-nc`
  const cartQty = cartItems.find((i) => i.key === cartKey)?.qty ?? 0
  const stockLeft = isUnlimited ? Infinity : Math.max(0, (product.stock_disponible ?? 0) - cartQty)
  const canAdd = inStock && stockLeft > 0

  return (
    <article
      className="relative cursor-pointer group"
      onClick={() => navigate(`/produits/${product.slug}`)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] rounded-[14px] overflow-hidden bg-sand">
        {product.image_principale ? (
          <div className="absolute inset-0">
            <NImage
              src={product.image_principale}
              alt={product.nom}
              className="w-full h-full"
              imgClassName="transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sand to-line" role="img" aria-label={product.nom} />
        )}

        {/* Tags */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-10">
          {product.prix_promo && (
            <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-accent text-white" aria-label={`Réduction de ${pct}%`}>
              -{pct}%
            </span>
          )}
          {product.est_nouveaute && !product.prix_promo && (
            <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-ink text-white">
              New
            </span>
          )}
          {!inStock && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">
              Rupture de stock
            </span>
          )}
          {inStock && canAdd && isLowStock && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white">
              {stockLeft < Infinity ? `${stockLeft} restant${stockLeft > 1 ? 's' : ''}` : 'Stock limité'}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          className="absolute top-2 right-2 z-10 w-9 h-9 grid place-items-center rounded-full
            bg-white/80 backdrop-blur-sm shadow-md transition-transform hover:scale-110"
          style={{ color: liked ? '#B76E4D' : '#1E1E1E' }}
          onClick={handleToggleWishlist}
          aria-label={liked ? `Retirer ${product.nom} des favoris` : `Ajouter ${product.nom} aux favoris`}
          aria-pressed={liked}
        >
          <NIcon name="heart" size={18} fill={liked} />
        </button>

        {/* Overlay rupture de stock */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-[14px]">
            <span className="text-white font-bold text-[13px] tracking-wide px-4 py-2 rounded-full bg-red-500/90 backdrop-blur-sm">
              Rupture de stock
            </span>
          </div>
        )}

        {/* Hover overlay — cart + WA (desktop: on hover / mobile: always visible) */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-2.5 flex gap-2
          md:translate-y-full md:group-hover:translate-y-0 md:transition-transform md:duration-300 md:ease-out"
          onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleAddToCart}
            disabled={!canAdd}
            aria-label={canAdd ? `Ajouter ${product.nom} au panier` : `${product.nom} indisponible`}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-[8px]
              bg-white/95 backdrop-blur-sm text-ink text-[11px] font-semibold
              hover:bg-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <NIcon name="bag" size={15} strokeWidth={2} />
            {!inStock ? 'Indisponible' : hasVariants ? 'Choisir' : !canAdd ? 'En panier' : 'Ajouter'}
          </button>
          <a
            href={waUrl}
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            rel="noreferrer"
            aria-label={`Commander ${product.nom} via WhatsApp`}
            className="flex items-center justify-center w-9 h-9 rounded-[8px]
              bg-wa/95 backdrop-blur-sm text-white hover:bg-wa transition-colors shadow-sm flex-shrink-0"
          >
            <WAGlyph size={18} />
          </a>
        </div>
      </div>

      {/* Body */}
      <div className="pt-3 px-0.5">
        <p className="text-[13.5px] font-medium leading-snug text-ink line-clamp-2">{product.nom}</p>
        {!inStock && (
          <p className="text-[11px] font-bold text-red-500 mt-1">Rupture de stock</p>
        )}
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className={`text-[13.5px] font-semibold tabular-nums ${!inStock ? 'text-muted/60' : 'text-ink'}`}>
            {fmt(displayPrice)}
          </span>
          {product.prix_promo && (
            <span className="text-xs text-muted line-through tabular-nums">{fmt(product.prix)}</span>
          )}
        </div>
      </div>
    </article>
  )
})
