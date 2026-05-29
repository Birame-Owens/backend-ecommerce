import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Heart, ImageIcon, Minus, MessageCircle, Plus, ShieldCheck, ShoppingBag, Star, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { catalogClientApi, type ProductDetail, type ProductImage } from '@/api/client/catalog'
import type { ProductClient } from '@/api/client/home'
import { EmptyState } from '@/components/client/EmptyState'
import { ProductCard, ProductSkeleton } from '@/components/client/ProductCard'

function fmt(n: number | undefined | null) {
  return (n ?? 0).toLocaleString('fr-FR')
}

function firstAvailableSize(product: ProductDetail | null, color: string | null) {
  if (!product) return ''
  if (color && product.couleur_tailles?.[color]?.length) return product.couleur_tailles[color][0]
  return product.tailles_disponibles?.[0] ?? ''
}

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [related, setRelated] = useState<ProductClient[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState<ProductImage | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [size, setSize] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    setLoading(true)
    catalogClientApi.productPage(slug)
      .then(res => {
        const data = res.data.data
        setProduct(data.product)
        setRelated(data.related_products ?? [])
        setActiveImage(data.product.images?.[0] ?? null)
        const defaultColor = data.product.couleurs_disponibles?.[0] ?? null
        setColor(defaultColor)
        setSize(firstAvailableSize(data.product, defaultColor))
      })
      .catch(() => {
        setProduct(null)
        setRelated([])
      })
      .finally(() => setLoading(false))
  }, [slug])

  const sizes = useMemo(() => {
    if (!product) return []
    if (color && product.couleur_tailles?.[color]) return product.couleur_tailles[color]
    return product.tailles_disponibles ?? []
  }, [product, color])

  const whatsappUrl = useMemo(() => {
    if (!product) return '#'
    const text = `Bonjour, je suis interesse(e) par ${product.nom} (${fmt(product.prix_affiche)} F CFA).`
    return `https://wa.me/221784661412?text=${encodeURIComponent(text)}`
  }, [product])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="aspect-square bg-beige-200 rounded-3xl animate-pulse" />
          <div className="bg-beige-50 border border-beige-200 rounded-3xl p-6 animate-pulse space-y-4">
            <div className="h-8 w-3/4 bg-beige-200 rounded" />
            <div className="h-5 w-40 bg-beige-200 rounded" />
            <div className="h-24 bg-beige-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <EmptyState label="Produit introuvable" note="Ce produit n'est plus disponible ou l'adresse est incorrecte." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <Link to="/produits" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink mb-5">
        <ArrowLeft className="w-4 h-4" /> Boutique
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <section>
          <div className="aspect-square bg-beige-200 rounded-3xl overflow-hidden border border-beige-200 shadow-beige">
            {activeImage?.medium || product.image_principale ? (
              <img src={activeImage?.medium ?? product.image_principale ?? ''} alt={activeImage?.alt_text ?? product.nom} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-beige-400" strokeWidth={1.5} />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mt-3">
              {product.images.map(image => (
                <button
                  key={image.id}
                  onClick={() => setActiveImage(image)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 bg-beige-200 ${
                    activeImage?.id === image.id ? 'border-beige-500' : 'border-beige-200'
                  }`}
                >
                  <img src={image.thumbnail || image.medium} alt={image.alt_text} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-beige-50 border border-beige-200 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-beige">
          <div className="flex items-start justify-between gap-4">
            <div>
              {product.category && (
                <Link to={`/categories/${product.category.slug}`} className="text-xs font-bold text-beige-500 uppercase tracking-widest">
                  {product.category.nom}
                </Link>
              )}
              <h1 className="font-serif font-bold text-ink text-3xl lg:text-4xl mt-2">{product.nom}</h1>
            </div>
            <button className="w-11 h-11 rounded-2xl bg-beige-100 border border-beige-200 flex items-center justify-center hover:bg-beige-200" aria-label="Favori">
              <Heart className="w-5 h-5 text-muted" strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink">{fmt(product.prix_affiche)} F</span>
              {product.en_promo && <span className="text-sm text-muted line-through">{fmt(product.prix)} F</span>}
            </div>
            {product.en_promo && (
              <span className="px-2.5 py-1 bg-rose-500 text-white text-xs font-bold rounded-full">-{product.pourcentage_reduction}%</span>
            )}
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${product.en_stock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {product.en_stock ? 'En stock' : 'Indisponible'}
            </span>
          </div>

          {product.note_moyenne != null && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" strokeWidth={0} />
              <span className="font-semibold text-ink">{product.note_moyenne}</span>
              <span>({product.nombre_avis} avis)</span>
            </div>
          )}

          <p className="text-sm text-muted leading-relaxed mt-5">
            {product.description_courte ?? product.description ?? 'Une piece selectionnee avec soin pour votre garde-robe.'}
          </p>

          {product.couleurs_disponibles.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-bold text-ink mb-2">Couleur</p>
              <div className="flex flex-wrap gap-2">
                {product.couleurs_disponibles.map(item => (
                  <button
                    key={item}
                    onClick={() => {
                      setColor(item)
                      setSize(firstAvailableSize(product, item))
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      color === item ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-beige-300 hover:border-beige-500'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-bold text-ink mb-2">Taille</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(item => (
                  <button
                    key={item}
                    onClick={() => setSize(item)}
                    className={`min-w-11 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                      size === item ? 'bg-beige-500 text-white border-beige-500' : 'bg-white text-ink border-beige-300 hover:border-beige-500'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-2xl border border-beige-300 bg-white overflow-hidden">
              <button onClick={() => setQuantity(v => Math.max(1, v - 1))} className="w-11 h-11 flex items-center justify-center hover:bg-beige-100" aria-label="Diminuer">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold">{quantity}</span>
              <button onClick={() => setQuantity(v => v + 1)} className="w-11 h-11 flex items-center justify-center hover:bg-beige-100" aria-label="Augmenter">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button className="flex-1 h-11 inline-flex items-center justify-center gap-2 bg-beige-500 text-white text-sm font-bold rounded-2xl hover:bg-beige-400 transition-colors disabled:opacity-60" disabled={!product.en_stock}>
              <ShoppingBag className="w-4 h-4" /> Ajouter au panier
            </button>
          </div>

          <a href={whatsappUrl} className="mt-3 h-11 inline-flex w-full items-center justify-center gap-2 bg-ink text-white text-sm font-bold rounded-2xl hover:bg-beige-500 transition-colors">
            <MessageCircle className="w-4 h-4" /> Commander sur WhatsApp
          </a>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <div className="rounded-2xl bg-beige-100 p-3">
              <Truck className="w-5 h-5 text-beige-500 mb-2" />
              <p className="text-xs font-bold text-ink">Livraison rapide</p>
            </div>
            <div className="rounded-2xl bg-beige-100 p-3">
              <ShieldCheck className="w-5 h-5 text-beige-500 mb-2" />
              <p className="text-xs font-bold text-ink">Qualite verifiee</p>
            </div>
            <div className="rounded-2xl bg-beige-100 p-3">
              <Star className="w-5 h-5 text-beige-500 mb-2" />
              <p className="text-xs font-bold text-ink">{product.fait_sur_mesure ? 'Sur mesure' : 'Pret a porter'}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-10 lg:mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-serif font-bold text-ink text-2xl">Produits similaires</h2>
            <p className="text-sm text-muted mt-1">Dans la meme collection</p>
          </div>
          {product.category && <Link to={`/categories/${product.category.slug}`} className="text-sm font-bold text-beige-500">Voir la categorie</Link>}
        </div>
        {related.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
            {Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
            {related.map(item => <ProductCard key={item.id} product={item} />)}
          </div>
        )}
      </section>
    </div>
  )
}
