import { useMemo, useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { catalogClientApi, type ProductDetail } from '@/api/client/catalog'
import { reviewsClientApi } from '@/api/client/reviews'
import { colorHex, needsBorder } from '@/lib/colorPalette'
import { NProductCard } from '@/components/client/NProductCard'
import { NImage } from '@/components/client/NImage'
import { NIcon, Stars, WAGlyph } from '@/components/client/NIcon'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore, cartCount } from '@/store/cartStore'
import { useToastStore } from '@/store/toastStore'
import { useShopStore, buildWaUrl } from '@/store/shopStore'
import { SeoHead } from '@/components/client/SeoHead'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }

function firstSize(product: ProductDetail, color: string | null) {
  if (color && product.couleur_tailles?.[color]?.length) return product.couleur_tailles[color][0]
  return product.tailles_disponibles?.[0] ?? ''
}

/* ── Avis du produit (publics, approuvés) ── */
function ProductReviews({ slug }: { slug: string }) {
  const { data } = useQuery({
    queryKey: ['product-reviews', slug],
    queryFn: () => reviewsClientApi.forProduct(slug).then((r) => r.data.data),
    enabled: !!slug,
  })
  const reviews = data?.reviews ?? []
  if (!reviews.length) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-10 border-t border-line">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="font-serif font-bold text-[22px] md:text-[28px] text-ink">Avis clients</h2>
        {data && data.note_moyenne > 0 && (
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            <Stars value={data.note_moyenne} size={15} />
            <span className="font-semibold text-ink">{data.note_moyenne.toFixed(1)}</span>
            <span>· {data.total} avis</span>
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white border border-line rounded-[14px] p-4 md:p-5">
            <div className="flex items-center justify-between mb-1.5">
              <Stars value={r.note} size={14} />
              {r.avis_verifie && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-green-600">Achat vérifié</span>
              )}
            </div>
            {r.titre && <p className="text-[13.5px] font-semibold text-ink mb-1">{r.titre}</p>}
            <p className="text-[13.5px] leading-relaxed text-ink-2">"{r.commentaire}"</p>
            {r.photos?.length > 0 && (
              <div className="flex gap-2 mt-2.5">
                {r.photos.slice(0, 4).map((src, k) => (
                  <img key={k} src={src} alt="" loading="lazy"
                    className="w-16 h-16 rounded-lg object-cover border border-line" />
                ))}
              </div>
            )}
            <p className="text-[11.5px] text-muted mt-2.5">{r.nom_client} · {r.date}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  // Retour : revient en arrière s'il y a un historique app, sinon va à l'accueil.
  // (Cas d'un lien partagé ouvert directement : navigate(-1) ne ferait rien.)
  const goBack = () => {
    if (location.key && location.key !== 'default') navigate(-1)
    else navigate('/')
  }
  const { has, toggle } = useWishlistStore()
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const cnt = cartCount(cartItems)
  const toast = useToastStore((s) => s.show)
  const waNumber = useShopStore((s) => s.waNumber)

  const [activeIdx, setActiveIdx] = useState(0)
  const [color, setColor] = useState<string | null>(null)
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [shareOpen, setShareOpen] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)
  const [colorError, setColorError] = useState(false)
  const [sizeError, setSizeError] = useState(false)

  useEffect(() => {
    if (!shareOpen) return
    function handler(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [shareOpen])

  const { data, isLoading } = useQuery({
    queryKey: ['client-product', slug],
    queryFn: () => catalogClientApi.productPage(slug).then((r) => {
      const d = r.data.data
      const defaultColor = d.product.couleurs_disponibles?.[0] ?? null
      setColor(defaultColor)
      setSize(firstSize(d.product, defaultColor))
      const imgs = d.product.images ?? []
      const firstColorIdx = defaultColor ? imgs.findIndex((im) => im.couleur_associee === defaultColor) : -1
      setActiveIdx(firstColorIdx >= 0 ? firstColorIdx : 0)
      return d
    }),
    enabled: !!slug,
  })

  const product = data?.product ?? null
  const related = data?.related_products ?? []

  const variantStockMax = useMemo(() => {
    if (!product) return null
    if (!product.en_stock) return 0
    if (product.stock_disponible == null) return null
    if (color && product.couleur_tailles_stock?.[color]) {
      if (size && product.couleur_tailles_stock[color][size] != null) {
        return product.couleur_tailles_stock[color][size]
      }
      return Object.values(product.couleur_tailles_stock[color]).reduce((a, b) => a + b, 0)
    }
    return product.stock_disponible
  }, [product, color, size])

  const cartKey = product ? `${product.id}-${color ?? 'nc'}-${size ?? 'nc'}` : ''
  const cartQtyForVariant = cartItems.find((i) => i.key === cartKey)?.qty ?? 0

  const maxAddable = variantStockMax == null
    ? Infinity
    : Math.max(0, variantStockMax - cartQtyForVariant)

  useEffect(() => {
    if (maxAddable !== Infinity && maxAddable > 0 && qty > maxAddable) setQty(maxAddable)
  }, [maxAddable])

  const sizes = useMemo(() => {
    if (!product) return []
    if (color && product.couleur_tailles?.[color]) return product.couleur_tailles[color]
    return product.tailles_disponibles ?? []
  }, [product, color])

  const colorStockMap = useMemo<Record<string, number>>(() => {
    if (!product?.couleur_tailles_stock) return {}
    return Object.fromEntries(
      product.couleurs_disponibles.map((c) => {
        const cs = product.couleur_tailles_stock![c]
        if (!cs) return [c, Infinity]
        return [c, Object.values(cs).reduce((a, b) => a + b, 0)]
      })
    )
  }, [product])

  const sizeStockMap = useMemo<Record<string, number>>(() => {
    if (!product?.couleur_tailles_stock || !color) return {}
    return product.couleur_tailles_stock[color] ?? {}
  }, [product, color])

  const variantIsOutOfStock = variantStockMax === 0

  const liked = product ? has(product.id) : false
  const isParfum = product?.type_variante === 'parfum'
  const isChaussure = product?.type_variante === 'chaussure'
  const axis1Label = isParfum ? 'Senteur' : 'Couleur'
  const axis2Label = isParfum ? 'Contenance' : isChaussure ? 'Pointure' : 'Taille'

  const images = product?.images ?? []
  const activeImage = images[activeIdx]

  // ── Galerie style Shein ──
  // Images regroupées par couleur (conserve l'ordre).
  const imagesByColor = images.reduce<Record<string, typeof images>>((acc, img) => {
    const key = img.couleur_associee ?? '__none__'
    ;(acc[key] ||= []).push(img)
    return acc
  }, {})
  // Bande du bas : 1 miniature par couleur (la 1ʳᵉ photo de chaque couleur) = sélecteur de coloris.
  const colorThumbs = (product?.couleurs_disponibles ?? [])
    .map((c) => {
      const idx = images.findIndex((im) => im.couleur_associee === c)
      return { color: c, idx, img: idx >= 0 ? images[idx] : undefined }
    })
    .filter((t) => t.img !== undefined)
  // Photos de la couleur active. Pas de fallback "toutes les images" : sinon
  // à l'ouverture (ou couleur sans image dédiée) on dumpait toutes les couleurs en haut.
  // Produit sans variante de couleur -> on montre les images sans couleur (galerie simple).
  const hasColorVariants = (product?.couleurs_disponibles?.length ?? 0) > 0
  const currentColorImages = hasColorVariants
    ? (color && imagesByColor[color] ? imagesByColor[color] : [])
    : (imagesByColor['__none__'] ?? images)
  // Bande du haut : les autres photos de la couleur active (hors celle affichée en grand).
  const topThumbs = currentColorImages
    .map((img) => ({ img, idx: images.indexOf(img) }))
    .filter((t) => t.idx !== activeIdx)

  const waUrl = useMemo(() => {
    if (!product) return '#'
    const msg = `Bonjour ND WORLD 👋, je suis intéressé(e) par *${product.nom}* (${fmt(product.prix_affiche)} F CFA).${color ? ` ${axis1Label}: ${color}.` : ''}${size ? ` ${axis2Label}: ${size}.` : ''}`
    return buildWaUrl(waNumber, msg)
  }, [product, color, size, axis1Label, axis2Label])

  function handleShare() {
    const url = window.location.href
    const text = product ? `Regarde ce produit sur ND WORLD : *${product.nom}* — ${fmt(product.prix_affiche)} CFA` : ''
    if (navigator.share) {
      navigator.share({ title: product?.nom ?? 'ND WORLD', text, url }).catch(() => {})
    } else {
      setShareOpen((v) => !v)
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast('Lien copié !', 'check')
      setShareOpen(false)
    })
  }

  function handleAddToCart() {
    if (!product) return
    let valid = true
    if (product.couleurs_disponibles.length > 0 && !color) { setColorError(true); valid = false }
    if (sizes.length > 0 && !size) { setSizeError(true); valid = false }
    if (!valid) {
      toast(`Veuillez sélectionner ${isParfum ? 'une senteur et une contenance' : isChaussure ? 'une couleur et une pointure' : 'une couleur et une taille'}`, 'check')
      return
    }
    if (maxAddable === 0) { toast('Stock insuffisant pour cette quantité', 'check'); return }
    const qtyToAdd = maxAddable === Infinity ? qty : Math.min(qty, maxAddable)
    // Image de la couleur choisie (sinon image affichée, sinon image principale)
    const selectedImg = color ? images.find((im) => im.couleur_associee === color) : undefined
    const cartImage = selectedImg?.medium ?? selectedImg?.thumbnail
      ?? activeImage?.medium ?? activeImage?.thumbnail ?? product.image_principale
    addItem({
      id: product.id, nom: product.nom, slug: product.slug,
      prix: product.prix_affiche, image: cartImage,
      couleur: color, taille: size, type_variante: product.type_variante,
      qty: qtyToAdd, stock_max: variantStockMax,
    })
    toast(qtyToAdd < qty ? `Ajouté (${qtyToAdd} dispo)` : 'Ajouté au panier', 'check')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-[16px] text-muted">Produit introuvable.</p>
        <button onClick={goBack} className="mt-4 text-[13px] font-semibold text-accent underline">Retour</button>
      </div>
    )
  }

  const pct = product.en_promo ? Math.round((1 - product.prix_affiche / product.prix) * 100) : 0

  /* ── Sélecteur couleur partagé ── */
  function ColorPicker() {
    return (
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-2 mb-3">
          {axis1Label} : <span className="normal-case font-semibold text-ink">{color}</span>
        </p>
        <div className={`flex flex-wrap gap-3 ${colorError ? 'ring-2 ring-red-400 rounded-[10px] p-1' : ''}`}
          role="group" aria-label={`Choisir ${axis1Label.toLowerCase()}`}>
          {product.couleurs_disponibles.map((c) => {
            const cOos = (colorStockMap[c] ?? Infinity) === 0
            const isSelected = color === c
            const hex = colorHex(c)
            function handleSelect() {
              setColor(c); setSize(firstSize(product!, c)); setColorError(false)
              const imgIdx = images.findIndex((img) => img.couleur_associee === c)
              if (imgIdx >= 0) setActiveIdx(imgIdx)
            }
            if (hex) {
              return (
                <button key={c} onClick={handleSelect} aria-pressed={isSelected}
                  aria-label={`${axis1Label} ${c}${cOos ? ' — rupture de stock' : ''}`} title={c}
                  className={`relative w-9 h-9 rounded-full transition-all flex-shrink-0
                    ${isSelected ? 'ring-2 ring-offset-2 ring-accent scale-110' : 'hover:scale-110'}
                    ${needsBorder(hex) ? 'border border-line-2' : ''}`}
                  style={{ backgroundColor: hex }}>
                  {cOos && (
                    <span aria-hidden="true" className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ background: 'linear-gradient(to top right, transparent calc(50% - 0.8px), rgba(255,255,255,0.85) calc(50% - 0.8px), rgba(255,255,255,0.85) calc(50% + 0.8px), transparent calc(50% + 0.8px))' }} />
                  )}
                </button>
              )
            }
            return (
              <button key={c} onClick={handleSelect} aria-pressed={isSelected}
                aria-label={`${axis1Label} ${c}${cOos ? ' — rupture de stock' : ''}`}
                className={`relative px-4 py-2 rounded-[8px] text-[13px] font-semibold border transition-colors overflow-hidden
                  ${isSelected
                    ? cOos ? 'bg-ink/50 text-white/80 border-ink/50' : 'bg-ink text-white border-ink'
                    : cOos ? 'bg-white text-muted/60 border-line-2' : 'bg-white text-ink border-line-2 hover:border-ink'}`}>
                {cOos && <span aria-hidden="true" className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(to top right, transparent calc(50% - 0.7px), rgb(156 163 175/0.8) calc(50% - 0.7px), rgb(156 163 175/0.8) calc(50% + 0.7px), transparent calc(50% + 0.7px))' }} />}
                {c}
              </button>
            )
          })}
        </div>
        {colorError && <p role="alert" className="text-[11px] text-red-500 mt-1.5">Veuillez choisir {axis1Label.toLowerCase()}</p>}
      </div>
    )
  }

  /* ── Sélecteur taille partagé ── */
  function SizePicker() {
    if (sizes.length === 0) return null
    return (
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-2 mb-3">
          {axis2Label} : <span className="normal-case font-semibold text-ink">{size}</span>
        </p>
        <div className={`flex flex-wrap gap-2 ${sizeError ? 'ring-2 ring-red-400 rounded-[10px] p-1' : ''}`}
          role="group" aria-label={`Choisir ${axis2Label.toLowerCase()}`}>
          {sizes.map((s) => {
            const sOos = sizeStockMap[s] === 0
            return (
              <button key={s} onClick={() => { setSize(s); setSizeError(false) }}
                aria-pressed={size === s} aria-label={`${axis2Label} ${s}${sOos ? ' — rupture de stock' : ''}`}
                className={`relative min-w-[48px] h-11 px-3 rounded-[8px] text-[12px] font-bold border transition-all overflow-hidden
                  ${size === s
                    ? sOos ? 'bg-accent/50 text-white/80 border-accent/50' : 'bg-accent text-white border-accent scale-105'
                    : sOos ? 'bg-white text-muted/50 border-line-2 line-through' : 'bg-white text-ink border-line-2 hover:border-accent/60 hover:scale-105'}`}>
                {sOos && <span aria-hidden="true" className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(to top right, transparent calc(50% - 0.7px), rgb(156 163 175/0.7) calc(50% - 0.7px), rgb(156 163 175/0.7) calc(50% + 0.7px), transparent calc(50% + 0.7px))' }} />}
                {s}
              </button>
            )
          })}
        </div>
        {sizeError && <p role="alert" className="text-[11px] text-red-500 mt-1.5">Veuillez choisir {axis2Label.toLowerCase()}</p>}
      </div>
    )
  }

  return (
    <>
      <SeoHead
        title={product.seo?.title ?? `${product.nom} | ND WORLD`}
        description={product.seo?.description ?? product.description_courte ?? product.description}
        canonical={product.seo?.canonical ?? `/produits/${product.slug}`}
        image={product.seo?.image ?? product.image_principale}
        type="product"
        keywords={product.seo?.keywords ?? product.tags}
        structuredData={product.seo?.structured_data}
      />

      {/* ── Mobile header ── */}
      <header className="md:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur-xl border-b border-line">
        <div className="flex items-center h-14 px-4 gap-2">
          <button onClick={goBack}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors flex-shrink-0">
            <NIcon name="back" size={20} strokeWidth={1.8} />
          </button>
          <span className="flex-1 font-medium text-[14px] text-ink truncate min-w-0">{product.nom}</span>
          <button
            onClick={() => toggle({ id: product.id, nom: product.nom, slug: product.slug, prix: product.prix, prix_promo: product.prix_promo, image_principale: product.image_principale })}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors flex-shrink-0"
            style={{ color: liked ? '#B76E4D' : '#1E1E1E' }}
            aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
            <NIcon name="heart" size={20} fill={liked} strokeWidth={1.7} />
          </button>
          <button onClick={handleShare}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors text-ink-2 flex-shrink-0"
            aria-label="Partager">
            <NIcon name="share" size={20} strokeWidth={1.7} />
          </button>
          <button
            onClick={() => navigate('/panier')}
            className="relative w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors text-ink flex-shrink-0"
            aria-label="Mon panier">
            <NIcon name="bag" size={20} strokeWidth={1.7} />
            {cnt > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-0.5 bg-accent text-white text-[8px] font-bold rounded-full grid place-items-center">
                {cnt}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════
          MOBILE LAYOUT (< md)
      ════════════════════════════════════ */}
      <div className="md:hidden">
        {/* Miniatures du haut : autres photos de la couleur active */}
        {topThumbs.length > 0 && (
          <div className="flex gap-2 px-4 pt-3 overflow-x-auto scrollbar-hide">
            {topThumbs.map(({ img, idx }) => (
              <button key={img.id} onClick={() => setActiveIdx(idx)}
                className="flex-shrink-0 w-14 h-16 rounded-[10px] overflow-hidden border-2 border-line-2 opacity-80 hover:opacity-100 hover:border-accent transition-all">
                <NImage src={img.thumbnail ?? img.medium} alt={img.alt_text} className="w-full h-full" />
              </button>
            ))}
          </div>
        )}
        {/* Image principale — format portrait 3/4 */}
        <div className="relative aspect-[3/4] bg-sand overflow-hidden">
          {activeImage?.medium ?? product.image_principale ? (
            <NImage
              src={activeImage?.medium ?? product.image_principale ?? ''}
              alt={activeImage?.alt_text ?? product.nom}
              priority
              srcSets={activeImage ? { thumbnail: activeImage.thumbnail, medium: activeImage.medium, original: activeImage.original } : undefined}
              className="absolute inset-0"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-sand to-line" />
          )}
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.en_promo && (
              <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold">-{pct}%</span>
            )}
            {product.est_nouveaute && !product.en_promo && (
              <span className="px-2.5 py-1 rounded-full bg-ink text-white text-[10px] font-bold">Nouveau</span>
            )}
          </div>
          {/* Overlay rupture */}
          {variantIsOutOfStock && (
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center z-10">
              <span className="text-white font-bold text-[14px] px-5 py-2.5 rounded-full bg-red-500/90 backdrop-blur-sm">
                Rupture de stock
              </span>
            </div>
          )}
        </div>

        {/* Sélecteur de coloris : 1 miniature par couleur */}
        {colorThumbs.length > 1 && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {colorThumbs.map(({ color: c, img, idx }) => (
              <button key={c} title={c}
                onClick={() => { setActiveIdx(idx); setColor(c); setSize(firstSize(product, c)); setColorError(false) }}
                className={`flex-shrink-0 w-16 h-20 rounded-[10px] overflow-hidden border-2 transition-all
                  ${color === c ? 'border-accent scale-105' : 'border-line-2 opacity-70 hover:opacity-100'}`}>
                <NImage src={img!.thumbnail ?? img!.medium} alt={c} className="w-full h-full" />
              </button>
            ))}
          </div>
        )}

        {/* Info mobile */}
        <div className="px-4 pb-10 space-y-5">
          {/* Catégorie */}
          {product.category && (
            <button onClick={() => navigate(`/categories/${product.category!.slug}`)}
              className="text-[10px] font-bold tracking-[.2em] uppercase text-accent">
              {product.category.nom}
            </button>
          )}

          {/* Nom */}
          <h1 className="font-serif font-bold text-[24px] text-ink leading-tight">{product.nom}</h1>

          {/* Prix + stock badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-serif font-bold text-[28px] text-ink tabular-nums">
              {fmt(product.prix_affiche)}
            </span>
            {product.en_promo && (
              <span className="text-[15px] text-muted line-through tabular-nums">{fmt(product.prix)}</span>
            )}
            {product.en_promo && (
              <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[11px] font-bold">
                -{pct}%
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold ml-auto
              ${variantIsOutOfStock ? 'bg-red-500 text-white' : 'bg-ok/10 text-ok'}`}>
              {variantIsOutOfStock ? 'Rupture' : 'En stock'}
            </span>
          </div>

          {/* Bannière OOS globale */}
          {!product.en_stock && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] bg-red-50 border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-red-600">Rupture de stock</p>
                <p className="text-[11px] text-red-400 mt-0.5">Ce produit est actuellement indisponible.</p>
              </div>
            </div>
          )}

          {/* Séparateur */}
          <div className="border-t border-line" />

          {/* Couleurs */}
          {product.couleurs_disponibles.length > 0 && <ColorPicker />}

          {/* Tailles */}
          <SizePicker />

          {/* Alerte stock faible */}
          {product.stock_status?.status === 'low_stock' && !variantIsOutOfStock && variantStockMax != null && variantStockMax > 0 && (
            <p role="alert" className="text-[12px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-[8px]">
              ⚠ Plus que {variantStockMax} en stock — commandez vite !
            </p>
          )}

          {/* Quantité */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink-2 mb-3">Quantité</p>
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center rounded-[10px] border border-line-2 bg-white overflow-hidden">
                <button onClick={() => setQty((v) => Math.max(1, v - 1))}
                  className="w-11 h-11 grid place-items-center hover:bg-paper transition-colors">
                  <NIcon name="minus" size={15} strokeWidth={2} />
                </button>
                <span className="w-10 text-center text-[15px] font-bold text-ink">{qty}</span>
                <button onClick={() => setQty((v) => v + 1)}
                  disabled={maxAddable !== Infinity && qty >= maxAddable}
                  className="w-11 h-11 grid place-items-center hover:bg-paper transition-colors disabled:opacity-40">
                  <NIcon name="plus" size={15} strokeWidth={2} />
                </button>
              </div>
              {maxAddable !== Infinity && maxAddable > 0 && (
                <p className="text-[11px] text-amber-600">{maxAddable} restant{maxAddable > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <button onClick={handleAddToCart} disabled={maxAddable === 0}
              className={`flex items-center justify-center gap-2.5 h-[52px] rounded-[12px] text-white text-[14px] font-bold tracking-wide transition-colors disabled:cursor-not-allowed
                ${maxAddable === 0 && cartQtyForVariant === 0 ? 'bg-red-400' : 'bg-accent hover:bg-accent-dark disabled:opacity-50'}`}>
              <NIcon name="bag" size={18} strokeWidth={1.8} />
              {maxAddable === 0 ? (cartQtyForVariant > 0 ? 'Déjà en panier' : 'Rupture de stock') : 'Ajouter au panier'}
            </button>
            <a href={waUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2.5 h-[52px] rounded-[12px] bg-wa text-white text-[14px] font-bold tracking-wide hover:bg-wa-d transition-colors">
              <WAGlyph size={20} />
              Commander via WhatsApp
            </a>
          </div>

          {/* Description */}
          {(product.description_courte ?? product.description) && (
            <p className="text-[14px] text-ink-2 leading-relaxed pt-1">
              {product.description_courte ?? product.description}
            </p>
          )}

          {/* Perks */}
          <div className="grid grid-cols-2 gap-2">
            {[{ icon: 'truck', label: 'Livraison rapide' }, { icon: 'lock', label: 'Paiement sécurisé' }].map((it) => (
              <div key={it.icon} className="flex items-center gap-2 px-3 py-2.5 bg-paper rounded-[10px]">
                <span className="text-accent"><NIcon name={it.icon} size={15} strokeWidth={1.6} /></span>
                <span className="text-[11px] font-semibold text-ink">{it.label}</span>
              </div>
            ))}
          </div>

          {/* Description longue */}
          {product.description && product.description !== product.description_courte && (
            <div className="pt-2 border-t border-line">
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-2 mb-2">Détails</p>
              <p className="text-[13px] text-ink-2 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Notes — tout en bas */}
          {product.note_moyenne && product.note_moyenne > 0 ? (
            <div className="flex items-center gap-2 pt-2 border-t border-line">
              <Stars value={product.note_moyenne} size={14} />
              <span className="text-[13px] font-semibold text-ink">{product.note_moyenne.toFixed(1)}</span>
              <span className="text-[12px] text-muted">({product.nombre_avis} avis)</span>
            </div>
          ) : null}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-paper border border-line text-[11px] text-muted rounded-full">#{tag.trim()}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════
          DESKTOP LAYOUT (≥ md)
      ════════════════════════════════════ */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-[12.5px] text-muted">
          <button onClick={() => navigate('/')} className="hover:text-ink transition-colors">Accueil</button>
          <NIcon name="fwd" size={12} />
          {product.category && (
            <>
              <button onClick={() => navigate(`/categories/${product.category!.slug}`)}
                className="hover:text-ink transition-colors">{product.category.nom}</button>
              <NIcon name="fwd" size={12} />
            </>
          )}
          <span className="text-ink font-medium truncate max-w-[200px]">{product.nom}</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-[1fr_480px] gap-10 lg:gap-14">
          {/* ─ Galerie desktop ─ */}
          <section>
            {/* Miniatures du haut : autres photos de la couleur active */}
            {topThumbs.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                {topThumbs.map(({ img, idx }) => (
                  <button key={img.id} onClick={() => setActiveIdx(idx)}
                    className="flex-shrink-0 w-[64px] h-[80px] rounded-[10px] overflow-hidden border-2 border-line-2 opacity-70 hover:opacity-100 hover:border-ink transition-all">
                    <NImage src={img.thumbnail ?? img.medium} alt={img.alt_text} className="w-full h-full" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative aspect-[4/5] rounded-[18px] overflow-hidden bg-sand border border-line-2">
              {activeImage?.medium ?? product.image_principale ? (
                <NImage
                  src={activeImage?.medium ?? product.image_principale ?? ''}
                  alt={activeImage?.alt_text ?? product.nom}
                  priority
                  srcSets={activeImage ? { thumbnail: activeImage.thumbnail, medium: activeImage.medium, original: activeImage.original } : undefined}
                  className="absolute inset-0 rounded-[18px]"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-sand to-line" />
              )}
              <div className="absolute top-3 left-3 flex gap-1.5">
                {product.en_promo && <span className="px-2.5 py-1 rounded-full bg-accent text-white text-[10px] font-bold">-{pct}%</span>}
                {product.est_nouveaute && !product.en_promo && <span className="px-2.5 py-1 rounded-full bg-ink text-white text-[10px] font-bold">Nouveau</span>}
              </div>
              <button
                onClick={() => toggle({ id: product.id, nom: product.nom, slug: product.slug, prix: product.prix, prix_promo: product.prix_promo, image_principale: product.image_principale })}
                className="absolute top-3 right-3 w-10 h-10 grid place-items-center rounded-full bg-white/85 backdrop-blur-sm shadow-md hover:scale-110 transition-transform"
                style={{ color: liked ? '#B76E4D' : '#1E1E1E' }}>
                <NIcon name="heart" size={20} fill={liked} strokeWidth={1.7} />
              </button>
              {variantIsOutOfStock && (
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center z-20">
                  <span className="text-white font-bold text-[15px] px-5 py-2.5 rounded-full bg-red-500/90 backdrop-blur-sm">Rupture de stock</span>
                </div>
              )}
            </div>
            {/* Sélecteur de coloris : 1 miniature par couleur */}
            {colorThumbs.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                {colorThumbs.map(({ color: c, img, idx }) => (
                  <button key={c} title={c}
                    onClick={() => { setActiveIdx(idx); setColor(c); setSize(firstSize(product, c)); setColorError(false) }}
                    className={`flex-shrink-0 w-[72px] h-[90px] rounded-[10px] overflow-hidden border-2 transition-all
                      ${color === c ? 'border-accent' : 'border-line-2 hover:border-ink opacity-70 hover:opacity-100'}`}>
                    <NImage src={img!.thumbnail ?? img!.medium} alt={c} className="w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ─ Info desktop ─ */}
          <section className="lg:sticky lg:top-24 h-fit flex flex-col gap-5">
            {/* Catégorie */}
            {product.category && (
              <button onClick={() => navigate(`/categories/${product.category!.slug}`)}
                className="self-start text-[10px] font-bold tracking-[.2em] uppercase text-accent hover:underline">
                {product.category.nom}
              </button>
            )}

            {/* Nom + share */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-serif font-bold text-[30px] lg:text-[34px] text-ink leading-tight">{product.nom}</h1>
              <div className="relative flex-shrink-0 mt-1" ref={shareRef}>
                <button onClick={handleShare}
                  className="w-9 h-9 grid place-items-center rounded-full border border-line-2 bg-white hover:border-ink transition-colors text-ink-2"
                  aria-label="Partager">
                  <NIcon name="share" size={17} strokeWidth={1.8} />
                </button>
                {shareOpen && (
                  <div className="absolute right-0 top-11 z-30 w-52 bg-white rounded-[12px] border border-line shadow-card-lg py-1.5">
                    <a href={buildWaUrl(waNumber, `Regarde ce produit sur ND WORLD : *${product.nom}* — ${fmt(product.prix_affiche)} CFA\n${window.location.href}`)}
                      target="_blank" rel="noreferrer" onClick={() => setShareOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-paper text-[13px] text-ink transition-colors">
                      <WAGlyph size={16} /> WhatsApp
                    </a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                      target="_blank" rel="noreferrer" onClick={() => setShareOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-paper text-[13px] text-ink transition-colors">
                      <NIcon name="globe" size={16} strokeWidth={1.8} /> Facebook
                    </a>
                    <button onClick={handleCopyLink}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-paper text-[13px] text-ink transition-colors">
                      <NIcon name="link" size={16} strokeWidth={1.8} /> Copier le lien
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Prix */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-serif font-bold text-[32px] text-ink tabular-nums">{fmt(product.prix_affiche)}</span>
              {product.en_promo && <span className="text-[16px] text-muted line-through tabular-nums">{fmt(product.prix)}</span>}
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold
                ${variantIsOutOfStock ? 'bg-red-500 text-white' : 'bg-ok/10 text-ok'}`}>
                {variantIsOutOfStock ? 'Rupture de stock' : 'En stock'}
              </span>
            </div>

            {/* OOS banner */}
            {!product.en_stock && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] bg-red-50 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-red-600">Rupture de stock</p>
                  <p className="text-[11px] text-red-400 mt-0.5">Ce produit est actuellement indisponible.</p>
                </div>
              </div>
            )}

            <div className="border-t border-line" />

            {/* Couleurs */}
            {product.couleurs_disponibles.length > 0 && <ColorPicker />}

            {/* Tailles */}
            <SizePicker />

            {/* Stock warning */}
            {product.stock_status?.status === 'low_stock' && !variantIsOutOfStock && variantStockMax != null && variantStockMax > 0 && (
              <p role="alert" className="text-[12px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-[8px]">
                ⚠ Plus que {variantStockMax} en stock — commandez vite !
              </p>
            )}

            {/* Quantity */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-2 mb-3">Quantité</p>
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center rounded-[10px] border border-line-2 bg-white overflow-hidden">
                  <button onClick={() => setQty((v) => Math.max(1, v - 1))}
                    className="w-11 h-11 grid place-items-center hover:bg-paper transition-colors">
                    <NIcon name="minus" size={16} strokeWidth={2} />
                  </button>
                  <span className="w-10 text-center text-[14px] font-bold text-ink">{qty}</span>
                  <button onClick={() => setQty((v) => v + 1)}
                    disabled={maxAddable !== Infinity && qty >= maxAddable}
                    className="w-11 h-11 grid place-items-center hover:bg-paper transition-colors disabled:opacity-40">
                    <NIcon name="plus" size={16} strokeWidth={2} />
                  </button>
                </div>
                {maxAddable !== Infinity && maxAddable > 0 && (
                  <p className="text-[11px] text-amber-600">{maxAddable} restant{maxAddable > 1 ? 's' : ''}</p>
                )}
                {maxAddable === 0 && cartQtyForVariant > 0 && (
                  <p className="text-[11px] text-amber-600">Stock max atteint</p>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-1">
              <button onClick={handleAddToCart} disabled={maxAddable === 0}
                className={`flex items-center justify-center gap-2.5 h-12 rounded-[10px] text-white text-[13px] font-semibold tracking-wide transition-colors disabled:cursor-not-allowed
                  ${maxAddable === 0 && cartQtyForVariant === 0 ? 'bg-red-400' : 'bg-accent hover:bg-accent-dark disabled:opacity-50'}`}>
                <NIcon name="bag" size={18} strokeWidth={1.8} />
                {maxAddable === 0 ? (cartQtyForVariant > 0 ? 'Déjà en panier' : 'Rupture de stock') : 'Ajouter au panier'}
              </button>
              <a href={waUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2.5 h-12 rounded-[10px] bg-wa text-white text-[13px] font-semibold tracking-wide hover:bg-wa-d transition-colors">
                <WAGlyph size={20} /> Commander via WhatsApp
              </a>
            </div>

            {/* Description courte */}
            {(product.description_courte ?? product.description) && (
              <p className="text-[14px] text-ink-2 leading-relaxed pt-1 border-t border-line">
                {product.description_courte ?? product.description}
              </p>
            )}

            {/* Perks */}
            <div className="flex gap-2">
              {[{ icon: 'truck', label: 'Livraison rapide' }, { icon: 'lock', label: 'Paiement sécurisé' }].map((it) => (
                <div key={it.icon} className="flex items-center gap-1.5 px-3 py-2 bg-paper rounded-[10px]">
                  <span className="text-accent"><NIcon name={it.icon} size={15} strokeWidth={1.6} /></span>
                  <span className="text-[11px] font-semibold text-ink">{it.label}</span>
                </div>
              ))}
            </div>

            {/* Description longue */}
            {product.description && product.description !== product.description_courte && (
              <div className="pt-2 border-t border-line">
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-2 mb-2">Détails</p>
                <p className="text-[13px] text-ink-2 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Notes tout en bas */}
            {product.note_moyenne && product.note_moyenne > 0 ? (
              <div className="flex items-center gap-2 pt-2 border-t border-line">
                <Stars value={product.note_moyenne} size={14} />
                <span className="text-[13px] font-semibold text-ink">{product.note_moyenne.toFixed(1)}</span>
                <span className="text-[12px] text-muted">({product.nombre_avis} avis)</span>
              </div>
            ) : null}

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-paper border border-line text-[11px] text-muted rounded-full">#{tag.trim()}</span>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ─ Produits similaires desktop ─ */}
        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-line">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] font-bold tracking-[.2em] uppercase text-accent mb-1">Découvrir</p>
                <h2 className="font-serif font-bold text-[28px] text-ink">Vous aimerez aussi</h2>
              </div>
              {product.category && (
                <button onClick={() => navigate(`/categories/${product.category!.slug}`)}
                  className="text-[11px] font-semibold tracking-widest uppercase text-accent flex items-center gap-1 hover:underline">
                  Voir tout <NIcon name="fwd" size={13} strokeWidth={2} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {related.slice(0, 4).map((p) => <NProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* ─ Produits similaires mobile ─ */}
      {related.length > 0 && (
        <section className="md:hidden px-4 pb-10 pt-6 border-t border-line">
          <div className="flex items-end justify-between mb-5">
            <h2 className="font-serif font-bold text-[22px] text-ink">Vous aimerez aussi</h2>
            {product.category && (
              <button onClick={() => navigate(`/categories/${product.category!.slug}`)}
                className="text-[11px] font-semibold uppercase text-accent flex items-center gap-1">
                Voir tout <NIcon name="fwd" size={12} strokeWidth={2} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {related.slice(0, 4).map((p) => <NProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <ProductReviews slug={slug} />
    </>
  )
}
