import { useNavigate } from 'react-router-dom'
import { NIcon, WAGlyph } from '@/components/client/NIcon'
import { useWishlistStore, type WishlistItem } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'
import { useToastStore } from '@/store/toastStore'
import { useShopStore, buildWaUrl } from '@/store/shopStore'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }

function WishCard({ item }: { item: WishlistItem }) {
  const navigate = useNavigate()
  const { toggle } = useWishlistStore()
  const addItem = useCartStore((s) => s.addItem)
  const toast = useToastStore((s) => s.show)
  const waNumber = useShopStore((s) => s.waNumber)

  const price = item.prix_promo ?? item.prix
  const pct = item.prix_promo ? Math.round((1 - item.prix_promo / item.prix) * 100) : 0
  const waUrl = buildWaUrl(waNumber, `Bonjour ND WORLD 👋, je suis intéressé(e) par *${item.nom}* (${fmt(price)} CFA).`)

  function handleAddToCart() {
    addItem({ id: item.id, nom: item.nom, slug: item.slug, prix: price, image: item.image_principale, couleur: null, taille: null, qty: 1 })
    toast('Ajouté au panier', 'check')
  }

  return (
    <div className="bg-white rounded-[16px] border border-line shadow-sm overflow-hidden
      hover:shadow-card transition-shadow duration-300 flex flex-col">
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden bg-sand cursor-pointer"
        onClick={() => navigate(`/produits/${item.slug}`)}
      >
        {item.image_principale ? (
          <img src={item.image_principale} alt={item.nom}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sand to-camel/30" />
        )}
        {item.prix_promo && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-accent text-white
            text-[10px] font-bold tracking-wide">
            -{pct}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col flex-1">
        <p
          className="text-[13.5px] font-medium text-ink line-clamp-2 leading-snug cursor-pointer hover:text-accent transition-colors"
          onClick={() => navigate(`/produits/${item.slug}`)}
        >
          {item.nom}
        </p>

        {/* Prix */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[14px] font-bold text-ink tabular-nums">{fmt(price)}</span>
          {item.prix_promo && (
            <span className="text-[11.5px] text-muted line-through tabular-nums">{fmt(item.prix)}</span>
          )}
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-2 mt-3.5">
          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-[10px]
              bg-accent text-white text-[12px] font-semibold tracking-wide
              hover:bg-accent-dark transition-colors"
          >
            <NIcon name="bag" size={15} strokeWidth={1.8} />
            Panier
          </button>

          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-[10px]
              bg-wa text-white hover:bg-wa-d transition-colors"
            aria-label="Commander via WhatsApp"
          >
            <WAGlyph size={18} />
          </a>

          <button
            onClick={() => toggle(item)}
            className="flex items-center justify-center w-10 h-10 rounded-[10px]
              border border-line text-muted hover:text-red-500 hover:border-red-200
              hover:bg-red-50 transition-colors"
            aria-label="Retirer des favoris"
          >
            <NIcon name="trash" size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function WishlistPage() {
  const navigate = useNavigate()
  const { items, clear } = useWishlistStore()

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur-xl border-b border-line">
        <div className="flex items-center h-14 px-4 gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors">
            <NIcon name="back" size={20} strokeWidth={1.8} />
          </button>
          <span className="flex-1 font-serif font-semibold text-[17px] text-ink">Mes favoris</span>
          {items.length > 0 && (
            <button onClick={clear} className="text-[11.5px] font-semibold text-muted hover:text-red-500 transition-colors">
              Tout effacer
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Desktop header */}
        <div className="hidden md:flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-semibold tracking-[.2em] uppercase text-accent mb-2">Sélection</p>
            <h1 className="font-serif font-bold text-[34px] text-ink leading-none">Mes favoris</h1>
            <p className="text-[14px] text-muted mt-2">
              {items.length} produit{items.length !== 1 ? 's' : ''} sauvegardé{items.length !== 1 ? 's' : ''}
            </p>
          </div>
          {items.length > 0 && (
            <button onClick={clear}
              className="flex items-center gap-2 px-4 h-9 rounded-full border border-line
                text-[12px] font-semibold text-muted hover:text-red-500 hover:border-red-200
                hover:bg-red-50 transition-colors">
              <NIcon name="trash" size={14} strokeWidth={2} />
              Tout effacer
            </button>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="text-center py-20 md:py-28">
            <div className="w-20 h-20 rounded-full bg-sand flex items-center justify-center mx-auto mb-5">
              <NIcon name="heart" size={36} strokeWidth={1.3} className="text-accent opacity-50" />
            </div>
            <h2 className="font-serif font-bold text-[22px] text-ink mb-2">Aucun favori</h2>
            <p className="text-[14px] text-muted mb-7 max-w-xs mx-auto">
              Appuyez sur ♡ sur un produit pour le sauvegarder ici.
            </p>
            <button
              onClick={() => navigate('/categories')}
              className="inline-flex items-center gap-2 px-7 h-12 rounded-[10px] bg-accent text-white
                text-[12px] font-semibold tracking-widest uppercase hover:bg-accent-dark transition-colors"
            >
              Explorer les collections <NIcon name="arrow" size={14} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <>
            {/* Mobile count */}
            <p className="text-[12.5px] text-muted mb-4 md:hidden">
              {items.length} produit{items.length !== 1 ? 's' : ''}
            </p>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-5">
              {items.map((item) => (
                <WishCard key={item.id} item={item} />
              ))}
            </div>

            {/* CTA bottom */}
            <div className="mt-10 pt-8 border-t border-line text-center">
              <button
                onClick={() => navigate('/categories')}
                className="inline-flex items-center gap-2 px-7 h-12 rounded-[10px] border border-ink text-ink
                  text-[12px] font-semibold tracking-widest uppercase hover:bg-ink hover:text-white transition-colors"
              >
                Continuer mes achats <NIcon name="arrow" size={14} strokeWidth={2} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
