import { useState, useRef } from 'react'
import { X, AlertTriangle, ImageIcon, Plus, Trash2, Check } from 'lucide-react'
import { produitsAdminApi, type ProduitDetail } from '@/api/admin/products'

const COLOR_PALETTE = [
  { name: 'Noir', hex: '#1A1A1A' },
  { name: 'Blanc', hex: '#FAFAFA' },
  { name: 'Crème', hex: '#F5F0E8' },
  { name: 'Beige', hex: '#D4B896' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Marron', hex: '#795548' },
  { name: 'Chocolat', hex: '#4E342E' },
  { name: 'Taupe', hex: '#8D7B68' },
  { name: 'Gris clair', hex: '#D4D4D4' },
  { name: 'Gris', hex: '#9E9E9E' },
  { name: 'Gris foncé', hex: '#616161' },
  { name: 'Anthracite', hex: '#424242' },
  { name: 'Rouge', hex: '#E53935' },
  { name: 'Bordeaux', hex: '#8B1A1A' },
  { name: 'Rose', hex: '#F48FB1' },
  { name: 'Rose poudré', hex: '#FFCCD5' },
  { name: 'Corail', hex: '#FF7043' },
  { name: 'Saumon', hex: '#FFAB91' },
  { name: 'Orange', hex: '#FB8C00' },
  { name: 'Jaune', hex: '#FDD835' },
  { name: 'Vert', hex: '#43A047' },
  { name: 'Vert sauge', hex: '#8FBC8F' },
  { name: 'Kaki', hex: '#6B7C45' },
  { name: 'Émeraude', hex: '#00897B' },
  { name: 'Turquoise', hex: '#00ACC1' },
  { name: 'Bleu ciel', hex: '#64B5F6' },
  { name: 'Bleu', hex: '#1E88E5' },
  { name: 'Marine', hex: '#1A237E' },
  { name: 'Indigo', hex: '#3949AB' },
  { name: 'Violet', hex: '#7B1FA2' },
  { name: 'Lavande', hex: '#CE93D8' },
  { name: 'Or', hex: '#D4AF37' },
  { name: 'Argent', hex: '#C0C0C0' },
  { name: 'Bronze', hex: '#CD7F32' },
]

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '2A', '4A', '6A', '8A', '10A', '12A', '14A', '16A', 'Taille unique']

const SIZE_PRESETS: Record<string, string[]> = {
  'Prêt-à-porter': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Chaussures F': ['35', '36', '37', '38', '39', '40', '41'],
  'Chaussures H': ['39', '40', '41', '42', '43', '44', '45'],
  'Enfants': ['2A', '4A', '6A', '8A', '10A', '12A', '14A', '16A'],
  'Unique': ['Taille unique'],
}

export interface CategoryOption { id: number; nom: string; parent_id: number | null }

interface ColorVariant {
  colorName: string
  colorHex: string
  sizes: string[]
  stock: Record<string, number>
  seuil: Record<string, number>
  imageFiles: File[]
  imagePreviews: string[]
  existingImages: { id: number; url: string }[]
}

type Tab = 'infos' | 'variantes' | 'options' | 'seo'

interface Props {
  produit?: ProduitDetail | null
  categories: CategoryOption[]
  onClose: () => void
  onSuccess: (message: string) => void
}

const inputCls = 'w-full px-4 py-3 bg-beige-100 border border-beige-300 rounded-xl text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all'

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">{children}</label>
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between px-4 py-3 bg-beige-100 border border-beige-300 rounded-xl cursor-pointer hover:bg-beige-200 transition-colors">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-beige-400' : 'bg-beige-300'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </div>
    </label>
  )
}

export function ProductFormModal({ produit, categories, onClose, onSuccess }: Props) {
  const isEdit = !!produit
  const [tab, setTab] = useState<Tab>('infos')

  // Infos
  const [nom, setNom] = useState(produit?.nom ?? '')
  const [descCourte, setDescCourte] = useState(produit?.description_courte ?? '')
  const [desc, setDesc] = useState(produit?.description ?? '')
  const [categorieId, setCategorieId] = useState(produit?.categorie?.id ? String(produit.categorie.id) : '')
  const [prix, setPrix] = useState(produit?.prix ? String(produit.prix) : '')
  const [prixPromo, setPrixPromo] = useState(produit?.prix_promo ? String(produit.prix_promo) : '')
  const [debutPromo, setDebutPromo] = useState(produit?.debut_promo?.slice(0, 10) ?? '')
  const [finPromo, setFinPromo] = useState(produit?.fin_promo?.slice(0, 10) ?? '')
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(produit?.image_principale ?? null)
  const mainImageRef = useRef<HTMLInputElement>(null)

  // Variantes
  const [variants, setVariants] = useState<ColorVariant[]>(() => {
    if (!produit?.couleur_tailles) return []
    return Object.entries(produit.couleur_tailles).map(([colorName, sizes]) => {
      const pal = COLOR_PALETTE.find(c => c.name === colorName)
      const stockMap = (produit.couleur_tailles_stock as Record<string, Record<string, number>> | null)?.[colorName] ?? {}
      const seuilMap = (produit.couleur_tailles_seuil as Record<string, Record<string, number>> | null)?.[colorName] ?? {}
      const existingImgs = (produit.images ?? [])
        .filter(i => i.couleur_associee === colorName)
        .map(i => ({ id: i.id, url: i.url_miniature ?? i.url_originale }))
      return {
        colorName,
        colorHex: pal?.hex ?? '#9E9E9E',
        sizes: sizes as string[],
        stock: stockMap,
        seuil: seuilMap,
        imageFiles: [],
        imagePreviews: [],
        existingImages: existingImgs,
      }
    })
  })
  const [customSize, setCustomSize] = useState<Record<string, string>>({})
  const colorImgRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Options
  const [estVisible, setEstVisible] = useState(produit?.est_visible ?? true)
  const [estPopulaire, setEstPopulaire] = useState(produit?.est_populaire ?? false)
  const [estNouveaute, setEstNouveaute] = useState(produit?.est_nouveaute ?? false)
  const [gestionStock, setGestionStock] = useState(produit?.gestion_stock ?? true)
  const [faitSurMesure, setFaitSurMesure] = useState(produit?.fait_sur_mesure ?? false)
  const [delai, setDelai] = useState(produit?.delai_production_jours ? String(produit.delai_production_jours) : '')
  const [cout, setCout] = useState(produit?.cout_production ? String(produit.cout_production) : '')
  const [materiaux, setMateriaux] = useState<string[]>(produit?.materiaux_necessaires ?? [])
  const [matInput, setMatInput] = useState('')
  const [ordre, setOrdre] = useState(String(produit?.ordre_affichage ?? 0))

  // SEO
  const [metaTitre, setMetaTitre] = useState(produit?.meta_titre ?? '')
  const [metaDesc, setMetaDesc] = useState(produit?.meta_description ?? '')
  const [tags, setTags] = useState(produit?.tags ?? '')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parents = categories.filter(c => !c.parent_id)
  const childrenOf = (pid: number) => categories.filter(c => c.parent_id === pid)

  const addColor = (name: string, hex: string) => {
    if (variants.some(v => v.colorName === name)) return
    setVariants(prev => [...prev, { colorName: name, colorHex: hex, sizes: [], stock: {}, seuil: {}, imageFiles: [], imagePreviews: [], existingImages: [] }])
  }

  const removeColor = (name: string) => setVariants(prev => prev.filter(v => v.colorName !== name))

  const addSize = (color: string, size: string) =>
    setVariants(prev => prev.map(v =>
      v.colorName === color && !v.sizes.includes(size) ? { ...v, sizes: [...v.sizes, size] } : v
    ))

  const removeSize = (color: string, size: string) =>
    setVariants(prev => prev.map(v =>
      v.colorName === color
        ? {
            ...v,
            sizes: v.sizes.filter(s => s !== size),
            stock: Object.fromEntries(Object.entries(v.stock).filter(([k]) => k !== size)),
            seuil: Object.fromEntries(Object.entries(v.seuil).filter(([k]) => k !== size)),
          }
        : v
    ))

  const updateStock = (color: string, size: string, val: string) =>
    setVariants(prev => prev.map(v =>
      v.colorName === color ? { ...v, stock: { ...v.stock, [size]: Number(val) || 0 } } : v
    ))

  const updateSeuil = (color: string, size: string, val: string) =>
    setVariants(prev => prev.map(v =>
      v.colorName === color ? { ...v, seuil: { ...v.seuil, [size]: Number(val) || 0 } } : v
    ))

  const addMatiere = () => {
    const v = matInput.trim()
    if (v && !materiaux.includes(v)) setMateriaux(prev => [...prev, v])
    setMatInput('')
  }

  const addColorImages = (colorName: string, files: FileList) => {
    const newFiles = Array.from(files)
    const newPreviews = newFiles.map(f => URL.createObjectURL(f))
    setVariants(prev => prev.map(v =>
      v.colorName === colorName
        ? { ...v, imageFiles: [...v.imageFiles, ...newFiles], imagePreviews: [...v.imagePreviews, ...newPreviews] }
        : v
    ))
  }

  const removeColorImage = (colorName: string, idx: number) => {
    setVariants(prev => prev.map(v => {
      if (v.colorName !== colorName) return v
      const newFiles = v.imageFiles.filter((_, i) => i !== idx)
      const newPreviews = v.imagePreviews.filter((_, i) => i !== idx)
      return { ...v, imageFiles: newFiles, imagePreviews: newPreviews }
    }))
  }

  const removeExistingImage = (colorName: string, imageId: number) => {
    setVariants(prev => prev.map(v =>
      v.colorName === colorName
        ? { ...v, existingImages: v.existingImages.filter(img => img.id !== imageId) }
        : v
    ))
  }

  const buildFd = (): FormData => {
    const fd = new FormData()
    fd.append('nom', nom.trim())
    if (descCourte) fd.append('description_courte', descCourte)
    fd.append('description', desc)
    fd.append('categorie_id', categorieId)
    fd.append('prix', prix || '0')
    if (prixPromo) fd.append('prix_promo', prixPromo)
    if (debutPromo) fd.append('debut_promo', debutPromo)
    if (finPromo) fd.append('fin_promo', finPromo)
    fd.append('est_visible', estVisible ? '1' : '0')
    fd.append('est_populaire', estPopulaire ? '1' : '0')
    fd.append('est_nouveaute', estNouveaute ? '1' : '0')
    fd.append('gestion_stock', gestionStock ? '1' : '0')
    fd.append('fait_sur_mesure', faitSurMesure ? '1' : '0')
    if (delai) fd.append('delai_production_jours', delai)
    if (cout) fd.append('cout_production', cout)
    materiaux.forEach(m => fd.append('materiaux_necessaires[]', m))
    fd.append('ordre_affichage', ordre || '0')
    if (metaTitre) fd.append('meta_titre', metaTitre)
    if (metaDesc) fd.append('meta_description', metaDesc)
    if (tags) fd.append('tags', tags)
    if (mainImageFile) fd.append('image_principale', mainImageFile)

    // Variantes : tailles + stock
    variants.forEach(v => {
      v.sizes.forEach((size, idx) => {
        fd.append(`couleur_tailles[${v.colorName}][${idx}]`, size)
        fd.append(`couleur_tailles_stock[${v.colorName}][${size}]`, String(v.stock[size] ?? 0))
        if (v.seuil[size] != null) fd.append(`couleur_tailles_seuil[${v.colorName}][${size}]`, String(v.seuil[size]))
      })
    })

    // Photos couleur : images[] + image_couleurs[idx] = nom couleur
    let colorImgIdx = 0
    variants.forEach(v => {
      v.imageFiles.forEach(file => {
        fd.append('images[]', file)
        fd.append(`image_couleurs[${colorImgIdx}]`, v.colorName)
        colorImgIdx++
      })
    })

    // Images existantes à supprimer (non conservées)
    if (isEdit) {
      const allOriginalIds = (produit?.images ?? [])
        .filter(i => i.couleur_associee !== null)
        .map(i => i.id)
      const keptIds = variants.flatMap(v => v.existingImages.map(img => img.id))
      allOriginalIds
        .filter(id => !keptIds.includes(id))
        .forEach(id => fd.append('images_to_delete[]', String(id)))
    }

    return fd
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!nom.trim()) { setError('Le nom est obligatoire.'); setTab('infos'); return }
    if (!desc.trim() || desc.trim().length < 10) { setError('La description est obligatoire (minimum 10 caractères).'); setTab('infos'); return }
    if (!categorieId) { setError('La catégorie est obligatoire.'); setTab('infos'); return }
    if (!prix || isNaN(Number(prix))) { setError('Le prix est obligatoire.'); setTab('infos'); return }
    if (!isEdit && !mainImageFile) { setError("L'image principale est obligatoire."); setTab('infos'); return }
    setSubmitting(true)
    try {
      const fd = buildFd()
      if (isEdit && produit) {
        await produitsAdminApi.update(produit.id, fd)
        onSuccess('Produit modifié avec succès !')
      } else {
        await produitsAdminApi.create(fd)
        onSuccess('Produit créé avec succès !')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      setError(msg?.errors ? Object.values(msg.errors).flat().join(' ') : (msg?.message ?? 'Une erreur est survenue.'))
    } finally {
      setSubmitting(false)
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'infos', label: 'Infos' },
    { key: 'variantes', label: 'Couleurs & Tailles' },
    { key: 'options', label: 'Options' },
    { key: 'seo', label: 'SEO' },
  ]

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-beige-50 rounded-3xl border border-beige-300 shadow-beige-lg w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-beige-300 flex-shrink-0">
          <div>
            <h2 className="font-serif font-bold text-ink text-lg">
              {isEdit ? `Modifier — ${produit!.nom}` : 'Nouveau produit'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isEdit ? 'Modifiez les informations du produit.' : 'Renseignez les informations du nouveau produit.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-beige-200 transition-colors">
            <X className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === t.key ? 'bg-beige-500 text-white shadow-beige' : 'text-muted hover:bg-beige-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">

            {/* ── Infos ── */}
            {tab === 'infos' && (
              <>
                {/* Image principale */}
                <div>
                  <Label>Image principale</Label>
                  <div
                    onClick={() => mainImageRef.current?.click()}
                    className="relative w-full h-40 rounded-2xl border-2 border-dashed border-beige-400 bg-beige-100 flex items-center justify-center cursor-pointer hover:bg-beige-200 transition-colors overflow-hidden"
                  >
                    {mainImagePreview
                      ? <img src={mainImagePreview} alt="" className="w-full h-full object-cover" />
                      : <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="w-6 h-6 text-beige-400" strokeWidth={1.5} />
                          <span className="text-xs text-muted">Cliquer pour uploader</span>
                        </div>
                    }
                    {mainImagePreview && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setMainImageFile(null); setMainImagePreview(null) }}
                        className="absolute top-2 right-2 p-1 bg-black/40 text-white rounded-full hover:bg-black/60"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    ref={mainImageRef} type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) { setMainImageFile(f); setMainImagePreview(URL.createObjectURL(f)) }
                    }}
                  />
                </div>

                <div>
                  <Label>Nom <span className="text-rose-400">*</span></Label>
                  <input type="text" value={nom} onChange={e => setNom(e.target.value)}
                    placeholder="Ex: Sac en cuir tressé" className={inputCls} />
                </div>

                <div>
                  <Label>Description courte</Label>
                  <textarea value={descCourte} onChange={e => setDescCourte(e.target.value)}
                    placeholder="Une phrase de présentation…" rows={2} className={`${inputCls} resize-none`} />
                </div>

                <div>
                  <Label>Description complète</Label>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)}
                    placeholder="Description détaillée du produit…" rows={4} className={`${inputCls} resize-none`} />
                </div>

                <div>
                  <Label>Catégorie</Label>
                  <select value={categorieId} onChange={e => setCategorieId(e.target.value)} className={inputCls}>
                    <option value="">Aucune catégorie</option>
                    {parents.map(p => (
                      <optgroup key={p.id} label={p.nom}>
                        <option value={p.id}>{p.nom}</option>
                        {childrenOf(p.id).map(c => (
                          <option key={c.id} value={c.id}>&nbsp;&nbsp;└ {c.nom}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Prix (FCFA) <span className="text-rose-400">*</span></Label>
                    <input type="number" min="0" value={prix} onChange={e => setPrix(e.target.value)}
                      placeholder="25000" className={inputCls} />
                  </div>
                  <div>
                    <Label>Prix promo (FCFA)</Label>
                    <input type="number" min="0" value={prixPromo} onChange={e => setPrixPromo(e.target.value)}
                      placeholder="20000" className={inputCls} />
                  </div>
                </div>

                {prixPromo && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Début promo</Label>
                      <input type="date" value={debutPromo} onChange={e => setDebutPromo(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <Label>Fin promo</Label>
                      <input type="date" value={finPromo} onChange={e => setFinPromo(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Variantes ── */}
            {tab === 'variantes' && (
              <>
                <div>
                  <Label>Palette de couleurs</Label>
                  <div className="flex flex-wrap gap-2 p-4 bg-beige-100 rounded-2xl border border-beige-300">
                    {COLOR_PALETTE.map(color => {
                      const selected = variants.some(v => v.colorName === color.name)
                      return (
                        <button
                          key={color.name}
                          type="button"
                          title={color.name}
                          onClick={() => selected ? removeColor(color.name) : addColor(color.name, color.hex)}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${
                            selected ? 'border-beige-500 scale-110' : 'border-transparent hover:border-beige-300'
                          }`}
                          style={{ backgroundColor: color.hex }}
                        >
                          {selected && (
                            <Check
                              className="w-3.5 h-3.5 drop-shadow"
                              strokeWidth={3}
                              style={{ color: ['#FAFAFA','#F5F0E8','#D4B896','#C19A6B','#D4D4D4','#9E9E9E','#FFCCD5','#FFAB91','#FDD835','#CE93D8','#D4AF37','#C0C0C0'].includes(color.hex) ? '#1A1A1A' : '#ffffff' }}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {variants.length === 0 ? (
                  <div className="bg-beige-100 rounded-2xl border border-dashed border-beige-400 p-8 text-center">
                    <p className="text-sm text-muted">Sélectionnez des couleurs dans la palette pour créer des variantes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variants.map(variant => (
                      <div key={variant.colorName} className="border border-beige-300 rounded-2xl p-4 space-y-3 bg-beige-50">
                        {/* Color header */}
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full border border-beige-300 flex-shrink-0" style={{ backgroundColor: variant.colorHex }} />
                          <span className="font-semibold text-sm text-ink flex-1">{variant.colorName}</span>
                          <button type="button" onClick={() => removeColor(variant.colorName)}
                            className="p-1.5 rounded-lg hover:bg-blush/30 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" strokeWidth={1.5} />
                          </button>
                        </div>

                        {/* Presets */}
                        <div>
                          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Ajouter par groupe</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {Object.entries(SIZE_PRESETS).map(([presetName, sizes]) => (
                              <button
                                key={presetName}
                                type="button"
                                onClick={() => sizes.forEach(s => addSize(variant.colorName, s))}
                                className="px-2.5 py-1 rounded-lg bg-beige-200 text-[11px] font-semibold text-muted hover:bg-beige-300 transition-colors"
                              >
                                {presetName}
                              </button>
                            ))}
                          </div>

                          {/* Individual sizes */}
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_SIZES.map(size => {
                              const active = variant.sizes.includes(size)
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => active ? removeSize(variant.colorName, size) : addSize(variant.colorName, size)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                    active ? 'bg-beige-500 text-white' : 'bg-beige-100 border border-beige-300 text-muted hover:bg-beige-200'
                                  }`}
                                >
                                  {size}
                                </button>
                              )
                            })}
                            <input
                              type="text"
                              value={customSize[variant.colorName] ?? ''}
                              onChange={e => setCustomSize(prev => ({ ...prev, [variant.colorName]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key !== 'Enter') return
                                e.preventDefault()
                                const val = customSize[variant.colorName]?.trim()
                                if (val) { addSize(variant.colorName, val); setCustomSize(prev => ({ ...prev, [variant.colorName]: '' })) }
                              }}
                              placeholder="Autre…"
                              className="w-20 px-2 py-1 rounded-lg bg-beige-100 border border-beige-300 text-[11px] text-ink placeholder:text-muted/50 focus:outline-none focus:border-beige-400"
                            />
                          </div>
                        </div>

                        {/* Stock grid */}
                        {variant.sizes.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Stock & Seuil alerte par taille</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {variant.sizes.map(size => (
                                <div key={size} className="bg-beige-100 rounded-xl p-2.5">
                                  <p className="text-[11px] font-bold text-ink mb-1.5">{size}</p>
                                  <input
                                    type="number" min="0"
                                    value={variant.stock[size] ?? ''}
                                    onChange={e => updateStock(variant.colorName, size, e.target.value)}
                                    placeholder="Stock"
                                    className="w-full px-2 py-1 mb-1 bg-beige-50 border border-beige-300 rounded-lg text-xs text-ink focus:outline-none focus:border-beige-400"
                                  />
                                  <input
                                    type="number" min="0"
                                    value={variant.seuil[size] ?? ''}
                                    onChange={e => updateSeuil(variant.colorName, size, e.target.value)}
                                    placeholder="Seuil alerte"
                                    className="w-full px-2 py-1 bg-beige-50 border border-beige-300 rounded-lg text-xs text-muted focus:outline-none focus:border-beige-400"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Color images — multi-photos */}
                        <div>
                          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                            Photos pour cette couleur
                            <span className="ml-1 font-normal normal-case text-muted/70">
                              ({variant.existingImages.length + variant.imagePreviews.length} photo{variant.existingImages.length + variant.imagePreviews.length !== 1 ? 's' : ''})
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {/* Existing images from server */}
                            {variant.existingImages.map(img => (
                              <div key={img.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-beige-300">
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeExistingImage(variant.colorName, img.id)}
                                  className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}

                            {/* New images previews */}
                            {variant.imagePreviews.map((preview, idx) => (
                              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-beige-400">
                                <img src={preview} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeColorImage(variant.colorName, idx)}
                                  className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}

                            {/* Add more button */}
                            <button
                              type="button"
                              onClick={() => colorImgRefs.current[variant.colorName]?.click()}
                              className="w-20 h-20 rounded-xl border-2 border-dashed border-beige-400 bg-beige-100 flex flex-col items-center justify-center gap-1 hover:bg-beige-200 transition-colors"
                            >
                              <Plus className="w-4 h-4 text-beige-400" strokeWidth={2} />
                              <span className="text-[10px] text-muted">Ajouter</span>
                            </button>
                          </div>
                          <input
                            ref={el => { colorImgRefs.current[variant.colorName] = el }}
                            type="file" accept="image/*" multiple className="hidden"
                            onChange={e => { if (e.target.files?.length) addColorImages(variant.colorName, e.target.files) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Options ── */}
            {tab === 'options' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Toggle checked={estVisible} onChange={setEstVisible} label="Visible" />
                  <Toggle checked={estPopulaire} onChange={setEstPopulaire} label="Populaire" />
                  <Toggle checked={estNouveaute} onChange={setEstNouveaute} label="Nouveauté" />
                  <Toggle checked={gestionStock} onChange={setGestionStock} label="Gestion stock" />
                  <Toggle checked={faitSurMesure} onChange={setFaitSurMesure} label="Fait sur mesure" />
                </div>

                {faitSurMesure && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Délai production (jours)</Label>
                      <input type="number" min="0" value={delai} onChange={e => setDelai(e.target.value)}
                        placeholder="7" className={inputCls} />
                    </div>
                    <div>
                      <Label>Coût production (FCFA)</Label>
                      <input type="number" min="0" value={cout} onChange={e => setCout(e.target.value)}
                        placeholder="5000" className={inputCls} />
                    </div>
                  </div>
                )}

                <div>
                  <Label>Matières nécessaires</Label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text" value={matInput}
                      onChange={e => setMatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMatiere() } }}
                      placeholder="Ex: Tissu wax, Cuir…"
                      className={`${inputCls} flex-1`}
                    />
                    <button type="button" onClick={addMatiere}
                      className="px-4 py-3 bg-beige-200 rounded-xl hover:bg-beige-300 transition-colors">
                      <Plus className="w-4 h-4 text-muted" strokeWidth={2.5} />
                    </button>
                  </div>
                  {materiaux.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {materiaux.map(m => (
                        <span key={m} className="flex items-center gap-1.5 px-3 py-1.5 bg-beige-200 rounded-full text-xs font-medium text-ink">
                          {m}
                          <button type="button" onClick={() => setMateriaux(prev => prev.filter(x => x !== m))}>
                            <X className="w-3 h-3 text-muted hover:text-rose-400" strokeWidth={2} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Ordre d'affichage</Label>
                  <input type="number" min="0" value={ordre} onChange={e => setOrdre(e.target.value)} className={inputCls} />
                </div>
              </>
            )}

            {/* ── SEO ── */}
            {tab === 'seo' && (
              <>
                <div>
                  <Label>Meta titre</Label>
                  <input type="text" value={metaTitre} onChange={e => setMetaTitre(e.target.value)}
                    placeholder="Titre pour les moteurs de recherche…" className={inputCls} />
                  <p className="text-[11px] text-muted mt-1">{metaTitre.length}/60 caractères</p>
                </div>
                <div>
                  <Label>Meta description</Label>
                  <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)}
                    placeholder="Description pour les moteurs de recherche…" rows={3}
                    className={`${inputCls} resize-none`} />
                  <p className="text-[11px] text-muted mt-1">{metaDesc.length}/160 caractères</p>
                </div>
                <div>
                  <Label>Tags</Label>
                  <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                    placeholder="sac, cuir, artisanat, mode africaine…" className={inputCls} />
                  <p className="text-[11px] text-muted mt-1">Séparés par des virgules.</p>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-blush/20 border border-blush rounded-xl">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" strokeWidth={1.5} />
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 pb-6">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-beige-300 text-sm font-semibold text-muted hover:bg-beige-200 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-beige-500 text-white text-sm font-semibold hover:bg-beige-400 transition-colors disabled:opacity-50 shadow-beige">
              {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le produit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
