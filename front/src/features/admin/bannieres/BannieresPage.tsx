import { useState, useEffect, useRef } from 'react'
import {
  Plus, ImageIcon, Edit2, Trash2, ToggleLeft, ToggleRight, X,
  ArrowUp, ArrowDown, AlertTriangle, CheckCircle2, GalleryHorizontal,
} from 'lucide-react'
import { bannieresAdminApi, type Banniere } from '@/api/admin/bannieres'

// ─── Helpers ────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-beige-200 rounded-lg animate-pulse ${className}`} />
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
      active ? 'bg-sage/30 text-emerald-700' : 'bg-blush/30 text-rose-600'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-400'}`} />
      {active ? 'Active' : 'Masquée'}
    </span>
  )
}

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

// ─── Form Modal (créer / modifier) ─────────────────────────────────────────

interface FormModalProps {
  banniere: Banniere | null
  onClose: () => void
  onSuccess: () => void
}

function FormModal({ banniere, onClose, onSuccess }: FormModalProps) {
  const isEdit = banniere !== null

  const [titre, setTitre] = useState(banniere?.titre ?? '')
  const [sousTitre, setSousTitre] = useState(banniere?.sous_titre ?? '')
  const [lienUrl, setLienUrl] = useState(banniere?.lien_url ?? '')
  const [estActive, setEstActive] = useState(banniere?.est_active ?? true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(banniere?.image ?? null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isEdit && !imageFile) { setError('L\'image est obligatoire.'); return }

    setSubmitting(true)
    try {
      const fd = new FormData()
      if (titre) fd.append('titre', titre.trim())
      if (sousTitre) fd.append('sous_titre', sousTitre.trim())
      if (lienUrl) fd.append('lien_url', lienUrl.trim())
      fd.append('est_active', estActive ? '1' : '0')
      if (imageFile) fd.append('image', imageFile)

      if (isEdit) {
        await bannieresAdminApi.update(banniere.id, fd)
      } else {
        await bannieresAdminApi.create(fd)
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
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-beige-300">
          <div>
            <h2 className="font-serif font-bold text-ink text-lg">
              {isEdit ? 'Modifier la bannière' : 'Nouvelle bannière'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Image du carrousel affiché en haut de la page d'accueil
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-beige-200 transition-colors">
            <X className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Image <span className="text-rose-400">*</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative w-full h-40 rounded-2xl border-2 border-dashed border-beige-400
                bg-beige-100 flex items-center justify-center cursor-pointer
                hover:bg-beige-200 transition-colors overflow-hidden"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="aperçu" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-beige-400" strokeWidth={1.5} />
                  <span className="text-xs text-muted">Cliquer pour uploader (paysage recommandé)</span>
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

          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Mode Femme"
              className="w-full px-4 py-2.5 rounded-xl border border-beige-300 bg-white text-sm text-ink
                focus:outline-none focus:ring-2 focus:ring-beige-400"
            />
          </div>

          {/* Sous-titre */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Sous-titre (optionnel)
            </label>
            <input
              type="text"
              value={sousTitre}
              onChange={(e) => setSousTitre(e.target.value)}
              placeholder="Ex: Nouvelle collection disponible"
              className="w-full px-4 py-2.5 rounded-xl border border-beige-300 bg-white text-sm text-ink
                focus:outline-none focus:ring-2 focus:ring-beige-400"
            />
          </div>

          {/* Lien */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Lien au clic (optionnel)
            </label>
            <input
              type="text"
              value={lienUrl}
              onChange={(e) => setLienUrl(e.target.value)}
              placeholder="Ex: /categories/mode-femme"
              className="w-full px-4 py-2.5 rounded-xl border border-beige-300 bg-white text-sm text-ink
                focus:outline-none focus:ring-2 focus:ring-beige-400"
            />
            <p className="text-[11px] text-muted mt-1.5">
              Sans lien, l'image s'affiche seule sans bouton "Découvrir".
            </p>
          </div>

          {/* Active */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={estActive}
              onChange={(e) => setEstActive(e.target.checked)}
              className="w-4 h-4 rounded border-beige-400 text-beige-500 focus:ring-beige-400"
            />
            <span className="text-sm text-ink">Visible sur le site immédiatement</span>
          </label>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blush/20 border border-blush text-rose-700 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-beige-300 text-sm font-semibold text-muted hover:bg-beige-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-beige-500 text-white text-sm font-semibold
                hover:bg-beige-400 transition-colors disabled:opacity-50 shadow-beige"
            >
              {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Dialog ──────────────────────────────────────────────────────────

function DeleteDialog({ banniere, loading, onConfirm, onCancel }: {
  banniere: Banniere; loading: boolean; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-beige-50 rounded-3xl border border-beige-300 shadow-beige-lg w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-blush/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-rose-500" strokeWidth={1.5} />
        </div>
        <h3 className="font-serif font-bold text-ink text-center mb-1">Supprimer cette bannière ?</h3>
        <p className="text-sm text-muted text-center mb-5">
          « {banniere.titre || 'Bannière sans titre'} » sera supprimée définitivement. Cette action est irréversible.
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

// ─── Main Page ──────────────────────────────────────────────────────────────

export function BannieresPage() {
  const [bannieres, setBannieres] = useState<Banniere[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Banniere | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Banniere | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const pushToast = (message: string, type: ToastItem['type'] = 'success') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await bannieresAdminApi.list()
      setBannieres(res.data.data.bannieres)
    } catch {
      pushToast('Erreur lors du chargement des bannières', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (b: Banniere) => {
    try {
      await bannieresAdminApi.toggleStatus(b.id)
      setBannieres((prev) => prev.map((x) => x.id === b.id ? { ...x, est_active: !x.est_active } : x))
    } catch {
      pushToast('Erreur lors du changement de statut', 'error')
    }
  }

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= bannieres.length) return

    const reordered = [...bannieres]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setBannieres(reordered)

    try {
      await bannieresAdminApi.reorder(reordered.map((b) => b.id))
    } catch {
      pushToast('Erreur lors de la réorganisation', 'error')
      load()
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await bannieresAdminApi.delete(deleteTarget.id)
      setBannieres((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      pushToast('Bannière supprimée')
      setDeleteTarget(null)
    } catch {
      pushToast('Erreur lors de la suppression', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleSuccess = () => {
    setModalOpen(false)
    setEditing(null)
    pushToast(editing ? 'Bannière mise à jour' : 'Bannière ajoutée')
    load()
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif font-bold text-2xl text-ink flex items-center gap-2.5">
            <GalleryHorizontal className="w-6 h-6 text-beige-500" strokeWidth={1.5} />
            Bannières accueil
          </h1>
          <p className="text-sm text-muted mt-1">
            2 ou 3 images recommandées — elles tournent automatiquement toutes les 4 secondes sur le site.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-beige-500 text-white text-sm font-semibold
            hover:bg-beige-400 transition-colors shadow-beige flex-shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Ajouter
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : bannieres.length === 0 ? (
        <div className="text-center py-16 bg-beige-50 rounded-3xl border border-beige-300">
          <ImageIcon className="w-10 h-10 text-beige-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-ink font-medium mb-1">Aucune bannière pour le moment</p>
          <p className="text-sm text-muted mb-5">
            Ajoutez 2 ou 3 images pour activer le carrousel sur la page d'accueil.
          </p>
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-beige-500 text-white text-sm font-semibold hover:bg-beige-400 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Ajouter la première bannière
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bannieres.map((b, index) => (
            <div
              key={b.id}
              className="flex items-center gap-4 p-4 bg-beige-50 rounded-2xl border border-beige-300"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-beige-200 flex-shrink-0">
                {b.image ? (
                  <img src={b.image} alt={b.titre || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-beige-400" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-ink truncate">{b.titre || '(sans titre)'}</p>
                  <StatusBadge active={b.est_active} />
                </div>
                {b.sous_titre && <p className="text-sm text-muted truncate">{b.sous_titre}</p>}
                {b.lien_url && <p className="text-xs text-beige-500 truncate mt-0.5">→ {b.lien_url}</p>}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  className="p-2 rounded-lg hover:bg-beige-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Monter"
                >
                  <ArrowUp className="w-4 h-4 text-muted" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleMove(index, 1)}
                  disabled={index === bannieres.length - 1}
                  className="p-2 rounded-lg hover:bg-beige-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Descendre"
                >
                  <ArrowDown className="w-4 h-4 text-muted" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleToggle(b)}
                  className="p-2 rounded-lg hover:bg-beige-200 transition-colors"
                  title={b.est_active ? 'Désactiver' : 'Activer'}
                >
                  {b.est_active
                    ? <ToggleRight className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
                    : <ToggleLeft className="w-5 h-5 text-muted" strokeWidth={1.5} />}
                </button>
                <button
                  onClick={() => { setEditing(b); setModalOpen(true) }}
                  className="p-2 rounded-lg hover:bg-beige-200 transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4 text-muted" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setDeleteTarget(b)}
                  className="p-2 rounded-lg hover:bg-blush/30 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <FormModal
          banniere={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSuccess={handleSuccess}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          banniere={deleteTarget}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[60] space-y-2 max-w-sm">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </div>
  )
}
