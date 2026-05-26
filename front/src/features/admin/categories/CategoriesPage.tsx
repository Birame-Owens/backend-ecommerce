import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Plus, Search, Tag, Package, ChevronDown, ChevronRight,
  Edit2, Trash2, ToggleLeft, ToggleRight, X, Folder, FolderOpen,
  ImageIcon, AlertTriangle, RefreshCw, Star, Layers, CheckCircle2,
} from 'lucide-react'
import {
  categoriesAdminApi,
  type Category,
  type SubCategory,
  type CategoryStats,
} from '@/api/admin/categories'

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalMode =
  | { kind: 'create-category' }
  | { kind: 'create-subcategory'; parentId: number; parentNom: string }
  | { kind: 'edit-category'; category: Category }
  | { kind: 'edit-subcategory'; subcategory: SubCategory; parentNom: string }

type DeleteTarget = { type: 'category' | 'subcategory'; id: number; nom: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-beige-200 rounded-lg animate-pulse ${className}`} />
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
      active ? 'bg-sage/30 text-emerald-700' : 'bg-blush/30 text-rose-600'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-400'}`} />
      {active ? 'Actif' : 'Masqué'}
    </span>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string; value: number; icon: React.ElementType
  iconBg: string; iconColor: string; loading: boolean
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, loading }: StatCardProps) {
  return (
    <div className="bg-beige-50 rounded-2xl p-5 border border-beige-300 shadow-beige">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.5} />
      </div>
      {loading
        ? <div className="h-7 w-16 bg-beige-200 rounded-lg animate-pulse mb-1" />
        : <p className="text-2xl font-bold text-ink">{value}</p>
      }
      <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mt-1">{title}</p>
    </div>
  )
}

// ─── Subcategory Row ──────────────────────────────────────────────────────────

interface SubcatRowProps {
  subcat: SubCategory
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}

function SubcatRow({ subcat, onEdit, onDelete, onToggle }: SubcatRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-beige-100 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors group">
      {/* Image */}
      <div className="w-8 h-8 rounded-lg bg-beige-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {subcat.image
          ? <img src={subcat.image} alt={subcat.nom} className="w-full h-full object-cover" />
          : <Tag className="w-3.5 h-3.5 text-beige-400" strokeWidth={1.5} />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{subcat.nom}</p>
        <p className="text-[11px] text-muted">{subcat.slug}</p>
      </div>

      {/* Products */}
      <span className="text-xs text-muted hidden sm:block">
        {subcat.produits_count} produit{subcat.produits_count !== 1 ? 's' : ''}
      </span>

      {/* Status */}
      <StatusBadge active={subcat.est_active} />

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-beige-300 transition-colors"
          title={subcat.est_active ? 'Désactiver' : 'Activer'}
        >
          {subcat.est_active
            ? <ToggleRight className="w-3.5 h-3.5 text-beige-500" strokeWidth={1.5} />
            : <ToggleLeft className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
          }
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-beige-300 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5 text-beige-500" strokeWidth={1.5} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-blush/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

// ─── Category Row ─────────────────────────────────────────────────────────────

interface CategoryRowProps {
  category: Category
  expanded: boolean
  onExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onAddSubcategory: () => void
  onEditSubcategory: (s: SubCategory) => void
  onDeleteSubcategory: (s: SubCategory) => void
  onToggleSubcategory: (s: SubCategory) => void
}

function CategoryRow({
  category, expanded, onExpand, onEdit, onDelete, onToggle,
  onAddSubcategory, onEditSubcategory, onDeleteSubcategory, onToggleSubcategory,
}: CategoryRowProps) {
  const subcatNames = category.sous_categories?.slice(0, 3).map(s => s.nom).join(', ') ?? ''
  const hasMore = (category.sous_categories_count ?? 0) > 3

  return (
    <div className="bg-beige-50 rounded-2xl border border-beige-300 shadow-beige overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-4 p-4 group">
        {/* Expand chevron */}
        <button
          onClick={onExpand}
          className="p-1.5 rounded-lg hover:bg-beige-200 transition-colors flex-shrink-0"
        >
          {expanded
            ? <ChevronDown className="w-4 h-4 text-beige-500" strokeWidth={2} />
            : <ChevronRight className="w-4 h-4 text-muted" strokeWidth={2} />
          }
        </button>

        {/* Image */}
        <div className="w-10 h-10 rounded-xl bg-beige-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {category.image
            ? <img src={category.image} alt={category.nom} className="w-full h-full object-cover" />
            : <Folder className="w-5 h-5 text-beige-500" strokeWidth={1.5} />
          }
        </div>

        {/* Name + slug */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">{category.nom}</p>
          <p className="text-[11px] text-muted">{category.slug}</p>
        </div>

        {/* Subcategories preview */}
        <div className="hidden md:block flex-shrink-0 min-w-0 w-36">
          <p className="text-xs font-medium text-ink">
            {category.sous_categories_count} sous-cat.
          </p>
          {subcatNames && (
            <p className="text-[11px] text-muted truncate">
              {subcatNames}{hasMore ? '…' : ''}
            </p>
          )}
        </div>

        {/* Products count */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <Package className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
          <span className="text-xs text-muted">{category.produits_count}</span>
        </div>

        {/* Status */}
        <StatusBadge active={category.est_active} />

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onAddSubcategory}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
              text-[11px] font-semibold text-beige-500 bg-beige-200
              hover:bg-beige-300 transition-colors"
            title="Ajouter sous-catégorie"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            <span className="hidden lg:inline">Sous-cat.</span>
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-xl hover:bg-beige-200 transition-colors"
            title={category.est_active ? 'Désactiver' : 'Activer'}
          >
            {category.est_active
              ? <ToggleRight className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
              : <ToggleLeft className="w-4 h-4 text-muted" strokeWidth={1.5} />
            }
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-xl hover:bg-beige-200 transition-colors"
          >
            <Edit2 className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl hover:bg-blush/30 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-400" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Accordion: subcategories */}
      {expanded && category.sous_categories && (
        <div className="px-4 pb-4 space-y-2 border-t border-beige-300 pt-3 ml-8">
          {category.sous_categories.length === 0 ? (
            <div className="flex items-center gap-3 py-3 px-4">
              <FolderOpen className="w-4 h-4 text-muted" strokeWidth={1.5} />
              <p className="text-sm text-muted">Aucune sous-catégorie</p>
              <button
                onClick={onAddSubcategory}
                className="ml-auto text-xs font-semibold text-beige-500 hover:text-beige-400 transition-colors"
              >
                + Ajouter
              </button>
            </div>
          ) : (
            <>
              {category.sous_categories.map(s => (
                <SubcatRow
                  key={s.id}
                  subcat={s}
                  onEdit={() => onEditSubcategory(s)}
                  onDelete={() => onDeleteSubcategory(s)}
                  onToggle={() => onToggleSubcategory(s)}
                />
              ))}
              <button
                onClick={onAddSubcategory}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                  border border-dashed border-beige-400 text-xs font-medium text-beige-500
                  hover:bg-beige-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Ajouter une sous-catégorie
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

interface FormModalProps {
  mode: ModalMode
  parentCategories: Pick<Category, 'id' | 'nom'>[]
  onClose: () => void
  onSuccess: () => void
}

function FormModal({ mode, parentCategories, onClose, onSuccess }: FormModalProps) {
  const isEdit = mode.kind === 'edit-category' || mode.kind === 'edit-subcategory'
  const isSubcat = mode.kind === 'create-subcategory' || mode.kind === 'edit-subcategory'

  const existingItem = mode.kind === 'edit-category'
    ? mode.category
    : mode.kind === 'edit-subcategory' ? mode.subcategory : null

  const defaultParentId = mode.kind === 'create-subcategory'
    ? mode.parentId
    : mode.kind === 'edit-subcategory' ? mode.subcategory.parent_id : null

  const [nom,          setNom]          = useState(existingItem?.nom ?? '')
  const [description,  setDescription]  = useState(existingItem?.description ?? '')
  const [estActive,    setEstActive]    = useState(existingItem?.est_active ?? true)
  const [estPopulaire, setEstPopulaire] = useState(
    mode.kind === 'edit-category' ? mode.category.est_populaire : false
  )
  const [ordre, setOrdre] = useState(
    mode.kind === 'edit-category' ? mode.category.ordre_affichage : 0
  )
  const [parentId, setParentId] = useState<number | null>(defaultParentId)
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(existingItem?.image ?? null)

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const title =
    mode.kind === 'create-category'    ? 'Nouvelle catégorie' :
    mode.kind === 'create-subcategory' ? `Sous-catégorie — ${mode.parentNom}` :
    mode.kind === 'edit-category'      ? `Modifier — ${mode.category.nom}` :
                                         `Modifier — ${mode.subcategory.nom}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!nom.trim()) { setError('Le nom est obligatoire.'); return }
    if (isSubcat && !parentId) { setError('La catégorie parente est obligatoire.'); return }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('nom', nom.trim())
      if (description) fd.append('description', description)
      fd.append('est_active', estActive ? '1' : '0')
      if (!isSubcat) {
        fd.append('est_populaire', estPopulaire ? '1' : '0')
        fd.append('ordre_affichage', String(ordre))
      }
      if (isSubcat && parentId) fd.append('parent_id', String(parentId))
      if (imageFile) fd.append('image', imageFile)

      if (isEdit && existingItem) {
        await categoriesAdminApi.update(existingItem.id, fd)
      } else {
        await categoriesAdminApi.create(fd)
      }

      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
        ?.response?.data
      if (msg?.errors) {
        setError(Object.values(msg.errors).flat().join(' '))
      } else {
        setError(msg?.message ?? 'Une erreur est survenue.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-beige-50 rounded-3xl border border-beige-300 shadow-beige-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-beige-300">
          <div>
            <h2 className="font-serif font-bold text-ink text-lg">{title}</h2>
            <p className="text-xs text-muted mt-0.5">
              {isSubcat ? 'Créer une sous-catégorie pour organiser vos produits' : 'Renseigner les informations de la catégorie'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-beige-200 transition-colors"
          >
            <X className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Image
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative w-full h-32 rounded-2xl border-2 border-dashed border-beige-400
                bg-beige-100 flex items-center justify-center cursor-pointer
                hover:bg-beige-200 transition-colors overflow-hidden"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="aperçu" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-beige-400" strokeWidth={1.5} />
                  <span className="text-xs text-muted">Cliquer pour uploader</span>
                </div>
              )}
              {imagePreview && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                  className="absolute top-2 right-2 p-1 bg-black/40 text-white rounded-full hover:bg-black/60"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          {/* Nom */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Nom <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder={isSubcat ? 'Ex: Sac en cuir' : 'Ex: Sacs à main'}
              className="w-full px-4 py-3 bg-beige-100 border border-beige-300 rounded-xl text-sm text-ink
                placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400
                transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description courte…"
              rows={3}
              className="w-full px-4 py-3 bg-beige-100 border border-beige-300 rounded-xl text-sm text-ink
                placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400
                transition-all resize-none"
            />
          </div>

          {/* Parent category (subcategory only) */}
          {isSubcat && (
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Catégorie parente <span className="text-rose-400">*</span>
              </label>
              <select
                value={parentId ?? ''}
                onChange={e => setParentId(Number(e.target.value) || null)}
                className="w-full px-4 py-3 bg-beige-100 border border-beige-300 rounded-xl text-sm text-ink
                  focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
              >
                <option value="">Sélectionner une catégorie…</option>
                {parentCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
          )}

          {/* Ordre (category only) */}
          {!isSubcat && (
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Ordre d'affichage
              </label>
              <input
                type="number"
                min={0}
                max={999}
                value={ordre}
                onChange={e => setOrdre(Number(e.target.value))}
                className="w-full px-4 py-3 bg-beige-100 border border-beige-300 rounded-xl text-sm text-ink
                  focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
              />
            </div>
          )}

          {/* Toggles */}
          <div className="flex gap-4">
            <label className="flex-1 flex items-center justify-between px-4 py-3 bg-beige-100 border border-beige-300 rounded-xl cursor-pointer hover:bg-beige-200 transition-colors">
              <span className="text-sm font-medium text-ink">Actif</span>
              <div
                onClick={() => setEstActive(v => !v)}
                className={`w-10 h-6 rounded-full transition-colors relative ${estActive ? 'bg-beige-400' : 'bg-beige-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${estActive ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </label>

            {!isSubcat && (
              <label className="flex-1 flex items-center justify-between px-4 py-3 bg-beige-100 border border-beige-300 rounded-xl cursor-pointer hover:bg-beige-200 transition-colors">
                <span className="text-sm font-medium text-ink">Populaire</span>
                <div
                  onClick={() => setEstPopulaire(v => !v)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${estPopulaire ? 'bg-beige-400' : 'bg-beige-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${estPopulaire ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </label>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-blush/20 border border-blush rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" strokeWidth={1.5} />
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-beige-300 text-sm font-semibold text-muted
                hover:bg-beige-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-beige-500 text-white text-sm font-semibold
                hover:bg-beige-400 transition-colors disabled:opacity-50 shadow-beige"
            >
              {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  target: DeleteTarget
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

function DeleteDialog({ target, loading, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-beige-50 rounded-3xl border border-beige-300 shadow-beige-lg w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-blush/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-rose-500" strokeWidth={1.5} />
        </div>
        <h3 className="font-serif font-bold text-ink text-center mb-1">
          Supprimer {target.type === 'category' ? 'la catégorie' : 'la sous-catégorie'} ?
        </h3>
        <p className="text-sm text-muted text-center mb-5">
          « {target.nom} » sera supprimé définitivement. Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-beige-300 text-sm font-semibold text-muted hover:bg-beige-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────

interface ToastItem { id: number; message: string; type: 'success' | 'error' }

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-beige-lg border text-sm font-medium animate-[fadeInUp_0.2s_ease]
      ${type === 'success'
        ? 'bg-beige-50 border-beige-300 text-ink'
        : 'bg-blush/20 border-blush text-rose-700'
      }`}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={1.5} />
        : <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" strokeWidth={1.5} />
      }
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="ml-1 p-0.5 rounded hover:opacity-60 transition-opacity">
        <X className="w-3 h-3" strokeWidth={2} />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CategoriesPage() {
  const [categories,   setCategories]   = useState<Category[]>([])
  const [stats,        setStats]        = useState<CategoryStats | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [expandedIds,  setExpandedIds]  = useState<Set<number>>(new Set())
  const [modal,        setModal]        = useState<ModalMode | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deleteLoading,setDeleteLoading]= useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [toasts,       setToasts]       = useState<ToastItem[]>([])

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  const loadData = async () => {
    setLoading(true)
    setStatsLoading(true)
    setError(null)
    try {
      const [catsRes, statsRes] = await Promise.all([
        categoriesAdminApi.list({ type: 'parents' }),
        categoriesAdminApi.stats(),
      ])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const catsBody = catsRes.data as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const statsBody = statsRes.data as any
      setCategories(catsBody?.data?.categories ?? catsBody?.categories ?? [])
      setStats(statsBody?.data ?? statsBody ?? null)
    } catch (err) {
      console.error('[CategoriesPage] loadData error:', err)
      setError('Impossible de charger les catégories.')
    } finally {
      setLoading(false)
      setStatsLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleToggleStatus = async (id: number, isSubcat = false, parentId?: number) => {
    try {
      const res = await categoriesAdminApi.toggleStatus(id)
      const updated = res.data.data.category
      addToast(updated.est_active ? 'Activé avec succès !' : 'Désactivé avec succès !')
      setCategories(prev => prev.map(cat => {
        if (!isSubcat && cat.id === id) return { ...cat, est_active: updated.est_active }
        if (isSubcat && cat.id === parentId) {
          return {
            ...cat,
            sous_categories: cat.sous_categories?.map(s =>
              s.id === id ? { ...s, est_active: updated.est_active } : s
            )
          }
        }
        return cat
      }))
    } catch {
      addToast('Impossible de modifier le statut.', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const nom = deleteTarget.nom
    try {
      await categoriesAdminApi.delete(deleteTarget.id)
      setDeleteTarget(null)
      addToast(`« ${nom} » supprimé avec succès.`)
      await loadData()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      addToast(msg ?? 'Impossible de supprimer.', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleModalSuccess = async () => {
    const message =
      modal?.kind === 'create-category'    ? 'Catégorie créée avec succès !' :
      modal?.kind === 'create-subcategory' ? 'Sous-catégorie créée avec succès !' :
      modal?.kind === 'edit-category'      ? 'Catégorie modifiée avec succès !' :
                                             'Sous-catégorie modifiée avec succès !'
    setModal(null)
    addToast(message)
    await loadData()
  }

  const filtered = useMemo(() => {
    return categories.filter(cat => {
      const matchSearch = !search ||
        cat.nom.toLowerCase().includes(search.toLowerCase()) ||
        cat.sous_categories?.some(s => s.nom.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' ? cat.est_active : !cat.est_active)
      return matchSearch && matchStatus
    })
  }, [categories, search, statusFilter])

  const parentCategoryOptions = categories.map(c => ({ id: c.id, nom: c.nom }))

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-blush/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="text-sm font-semibold text-ink mb-1.5">Erreur de chargement</h3>
          <p className="text-sm text-muted mb-5">{error}</p>
          <button
            onClick={loadData}
            className="px-5 py-2.5 bg-beige-500 text-white text-xs font-semibold rounded-xl hover:bg-beige-400 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Gestion des catégories</h1>
          <p className="text-sm text-muted mt-1">
            Organisez les catégories et sous-catégories de votre boutique.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setModal({ kind: 'create-subcategory', parentId: categories[0]?.id ?? 0, parentNom: categories[0]?.nom ?? '' })}
            disabled={categories.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-beige-400 text-sm font-semibold text-beige-500
              hover:bg-beige-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            Sous-catégorie
          </button>
          <button
            onClick={() => setModal({ kind: 'create-category' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-beige-500 text-white text-sm font-semibold
              hover:bg-beige-400 transition-colors shadow-beige"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            Catégorie
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Catégories"
          value={stats?.total_categories ?? 0}
          icon={Folder}
          iconBg="bg-beige-200"
          iconColor="text-beige-500"
          loading={statsLoading}
        />
        <StatCard
          title="Sous-catégories"
          value={stats?.total_sous_categories ?? 0}
          icon={Layers}
          iconBg="bg-beige-300"
          iconColor="text-beige-500"
          loading={statsLoading}
        />
        <StatCard
          title="Produits liés"
          value={stats?.total_produits ?? 0}
          icon={Package}
          iconBg="bg-sky-50"
          iconColor="text-sky-500"
          loading={statsLoading}
        />
        <StatCard
          title="Actives"
          value={stats?.categories_actives ?? 0}
          icon={Star}
          iconBg="bg-sage/30"
          iconColor="text-emerald-600"
          loading={statsLoading}
        />
      </div>

      {/* ── Search / Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une catégorie…"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-50 border border-beige-300 rounded-xl text-ink
              placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === f
                  ? 'bg-beige-500 text-white shadow-beige'
                  : 'bg-beige-50 border border-beige-300 text-muted hover:bg-beige-200'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Masqués'}
            </button>
          ))}

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-beige-50 border border-beige-300 rounded-xl hover:bg-beige-200 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 text-muted ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ── Category list ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-beige-50 rounded-2xl border border-beige-300 p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-6 h-6 rounded" />
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1.5" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-beige-50 rounded-2xl border border-beige-300 p-12 text-center">
          <Tag className="w-8 h-8 text-beige-400 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink mb-1">Aucune catégorie</p>
          <p className="text-xs text-muted mb-4">
            {search ? 'Aucun résultat pour cette recherche.' : 'Créez votre première catégorie.'}
          </p>
          {!search && (
            <button
              onClick={() => setModal({ kind: 'create-category' })}
              className="px-4 py-2 bg-beige-500 text-white text-xs font-semibold rounded-xl hover:bg-beige-400 transition-colors"
            >
              + Nouvelle catégorie
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(cat => (
            <CategoryRow
              key={cat.id}
              category={cat}
              expanded={expandedIds.has(cat.id)}
              onExpand={() => toggleExpand(cat.id)}
              onEdit={() => setModal({ kind: 'edit-category', category: cat })}
              onDelete={() => setDeleteTarget({ type: 'category', id: cat.id, nom: cat.nom })}
              onToggle={() => handleToggleStatus(cat.id)}
              onAddSubcategory={() => setModal({ kind: 'create-subcategory', parentId: cat.id, parentNom: cat.nom })}
              onEditSubcategory={s => setModal({ kind: 'edit-subcategory', subcategory: s, parentNom: cat.nom })}
              onDeleteSubcategory={s => setDeleteTarget({ type: 'subcategory', id: s.id, nom: s.nom })}
              onToggleSubcategory={s => handleToggleStatus(s.id, true, cat.id)}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {modal && (
        <FormModal
          mode={modal}
          parentCategories={parentCategoryOptions}
          onClose={() => setModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          target={deleteTarget}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Toasts ── */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[200] min-w-[280px] max-w-[360px]">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  )
}
