import { Heart, ImageIcon, ShoppingBag, Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductClient } from '@/api/client/home'

function fmt(n: number | undefined | null) {
  return (n ?? 0).toLocaleString('fr-FR')
}

function currentPrice(product: ProductClient) {
  return product.prix_actuel ?? (product as any).prix_affiche ?? product.prix_promo ?? product.prix
}

export function ProductCard({ product }: { product: ProductClient }) {
  const [liked, setLiked] = useState(false)
  const category = product.categorie ?? (product as any).category ?? null

  return (
    <Link
      to={`/produits/${product.slug}`}
      className="block bg-beige-50 rounded-2xl overflow-hidden border border-beige-200 shadow-beige hover:shadow-beige-lg transition-all group"
    >
      <div className="relative aspect-square bg-beige-200 overflow-hidden">
        {product.image_principale
          ? <img src={product.image_principale} alt={product.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-beige-400" strokeWidth={1} />
            </div>}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.en_promo && <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full shadow-sm">Promo</span>}
          {product.est_nouveaute && <span className="px-2 py-0.5 text-[10px] font-bold bg-beige-500 text-white rounded-full shadow-sm">Nouveau</span>}
        </div>

        <button
          onClick={e => { e.preventDefault(); setLiked(v => !v) }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
            liked ? 'bg-beige-500 text-white' : 'bg-beige-50/90 text-muted hover:bg-beige-200'
          }`}
          aria-label="Ajouter aux favoris"
        >
          <Heart className="w-4 h-4" strokeWidth={liked ? 0 : 1.5} fill={liked ? 'currentColor' : 'none'} />
        </button>

        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={e => e.preventDefault()}
            className="w-full py-2.5 bg-beige-500/95 backdrop-blur-sm text-white text-xs font-bold tracking-wide flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" strokeWidth={2} />
            Ajouter
          </button>
        </div>
      </div>

      <div className="p-3">
        {category && <p className="text-[10px] font-semibold text-beige-500 uppercase tracking-widest mb-0.5">{category.nom}</p>}
        <h3 className="text-sm font-semibold text-ink truncate mb-1.5">{product.nom}</h3>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-sm text-ink">{fmt(currentPrice(product))} F</span>
            {product.en_promo && product.prix_promo && <span className="text-xs text-muted line-through">{fmt(product.prix)} F</span>}
          </div>
          {product.note_moyenne != null && (
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" strokeWidth={0} />
              <span className="text-[11px] font-semibold text-muted">{product.note_moyenne}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export function ProductSkeleton() {
  return (
    <div className="bg-beige-50 rounded-2xl overflow-hidden border border-beige-200">
      <div className="aspect-square bg-beige-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 bg-beige-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-beige-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-beige-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
