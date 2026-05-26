import { useState, useEffect, useRef } from 'react'
import {
  Plus, Search, Package, Eye, EyeOff, Copy, Trash2,
  AlertTriangle, RefreshCw, TrendingUp, ImageIcon,
  CheckCircle2, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { produitsAdminApi, type ProduitListItem, type ProduitDetail } from '@/api/admin/products'
import { categoriesAdminApi } from '@/api/admin/categories'
import { ProductFormModal, type CategoryOption } from './ProductFormModal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToastItem { id: number; message: string; type: 'success' | 'error' }
interface ProduitStats { total: number; visibles: number; masques: number; enPromo: number }

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon: Icon, iconBg, iconColor, loading }: {
  title: string; value: number; icon: React.ElementType
  iconBg: string; iconColor: string; loading: boolean
}) {
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

// ─── ProductCard ──────────────────────────────────────────────────────────────

function ProductCard({ produit, onEdit, onDelete, onDuplicate, onToggle }: {
  produit: ProduitListItem
  onEdit: () => void; onDelete: () => void; onDuplicate: () => void; onToggle: () => void
}) {
  const stockCls = produit.stock_status.status === 'in_stock'
    ? 'bg-sage/30 text-emerald-700'
    : produit.stock_status.status === 'low_stock'
    ? 'bg-amber-100 text-amber-700'
    : produit.stock_status.status === 'out_of_stock'
    ? 'bg-blush/30 text-rose-600'
    : 'bg-beige-200 text-muted'

  const dotCls = produit.stock_status.status === 'in_stock' ? 'bg-emerald-500'
    : produit.stock_status.status === 'low_stock' ? 'bg-amber-500'
    : produit.stock_status.status === 'out_of_stock' ? 'bg-rose-400'
    : 'bg-beige-400'

  return (
    <div className="bg-beige-50 rounded-2xl border border-beige-300 shadow-beige overflow-hidden group hover:shadow-beige-lg transition-shadow">
      {/* Image */}
      <div className="relative aspect-square bg-beige-200 overflow-hidden">
        {produit.image_principale
          ? <img src={produit.image_principale} alt={produit.nom}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-beige-400" strokeWidth={1.5} />
            </div>
        }

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {produit.en_promo && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">Promo</span>
          )}
          {produit.est_nouveaute && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-500 text-white rounded-full">Nouveau</span>
          )}
        </div>

        {/* Visibility */}
        <button
          onClick={onToggle}
          className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-lg hover:bg-white transition-colors"
          title={produit.est_visible ? 'Masquer' : 'Afficher'}
        >
          {produit.est_visible
            ? <Eye className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
            : <EyeOff className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
          }
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-[11px] text-muted truncate mb-0.5">{produit.categorie?.nom ?? '—'}</p>
        <h3 className="font-semibold text-sm text-ink truncate mb-2" title={produit.nom}>{produit.nom}</h3>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="font-bold text-sm text-ink">{produit.prix_actuel.toLocaleString('fr-FR')} FCFA</span>
          {produit.en_promo && (
            <span className="text-xs text-muted line-through">{produit.prix.toLocaleString('fr-FR')}</span>
          )}
        </div>

        {/* Stock */}
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${stockCls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
            {produit.stock_status.label}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <button onClick={onEdit}
            className="flex-1 py-1.5 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 transition-colors">
            Modifier
          </button>
          <button onClick={onDuplicate} title="Dupliquer"
            className="p-1.5 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors">
            <Copy className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
          </button>
          <button onClick={onDelete} title="Supprimer"
            className="p-1.5 rounded-xl border border-blush/50 hover:bg-blush/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-rose-400" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-beige-50 rounded-2xl border border-beige-300 overflow-hidden">
      <div className="aspect-square bg-beige-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-20 bg-beige-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-beige-200 rounded animate-pulse" />
        <div className="h-4 w-24 bg-beige-200 rounded animate-pulse" />
        <div className="h-7 bg-beige-200 rounded-xl animate-pulse mt-3" />
      </div>
    </div>
  )
}

// ─── DeleteDialog ─────────────────────────────────────────────────────────────

function DeleteDialog({ nom, loading, onConfirm, onCancel }: {
  nom: string; loading: boolean; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-beige-50 rounded-3xl border border-beige-300 shadow-beige-lg w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-blush/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-rose-500" strokeWidth={1.5} />
        </div>
        <h3 className="font-serif font-bold text-ink text-center mb-1">Supprimer le produit ?</h3>
        <p className="text-sm text-muted text-center mb-5">
          « {nom} » sera supprimé définitivement. Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-beige-300 text-sm font-semibold text-muted hover:bg-beige-200 transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors disabled:opacity-50">
            {loading ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-beige-lg border text-sm font-medium animate-[fadeInUp_0.2s_ease]
      ${type === 'success' ? 'bg-beige-50 border-beige-300 text-ink' : 'bg-blush/20 border-blush text-rose-700'}`}>
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

export function ProductsPage() {
  const [produits, setProduits] = useState<ProduitListItem[]>([])
  const [stats, setStats] = useState<ProduitStats>({ total: 0, visibles: 0, masques: 0, enPromo: 0 })
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modal, setModal] = useState<'create' | ProduitDetail | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nom: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const skipFirstRef = useRef(true)

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [allRes, visRes] = await Promise.all([
        produitsAdminApi.list({ per_page: 1 }),
        produitsAdminApi.list({ per_page: 1, status: 'visible' }),
      ])
      const allBody = allRes.data as any
      const visBody = visRes.data as any
      const tot = allBody?.data?.pagination?.total ?? 0
      const vis = visBody?.data?.pagination?.total ?? 0
      setStats(prev => ({ ...prev, total: tot, visibles: vis, masques: tot - vis }))
    } catch { /* ignore stats errors */ }
    finally { setStatsLoading(false) }
  }

  const loadCategories = async () => {
    try {
      const res = await categoriesAdminApi.options()
      const body = res.data as any
      setCategories(body?.data ?? body ?? [])
    } catch { /* ignore */ }
  }

  const loadProduits = async (p: number) => {
    setLoading(true)
    try {
      const res = await produitsAdminApi.list({
        page: p,
        per_page: 12,
        search: search || undefined,
        category_id: categoryFilter ? Number(categoryFilter) : undefined,
        status: statusFilter || undefined,
      })
      const body = res.data as any
      const list: ProduitListItem[] = body?.data?.produits ?? body?.produits ?? []
      const pag = body?.data?.pagination ?? body?.pagination ?? {}
      setProduits(list)
      setLastPage(pag.last_page ?? 1)
      setTotal(pag.total ?? 0)
      setStats(prev => ({ ...prev, enPromo: list.filter(p => p.en_promo).length }))
    } catch {
      addToast('Impossible de charger les produits.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadStats()
    loadCategories()
    loadProduits(1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter-driven reload with debounce for search
  useEffect(() => {
    if (skipFirstRef.current) { skipFirstRef.current = false; return }
    const delay = search ? 400 : 0
    const timer = setTimeout(() => { setPage(1); loadProduits(1) }, delay)
    return () => clearTimeout(timer)
  }, [search, categoryFilter, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (p: number) => { setPage(p); loadProduits(p) }

  const handleEdit = async (id: number) => {
    try {
      const res = await produitsAdminApi.show(id)
      const body = res.data as any
      setModal(body?.data?.produit ?? body?.produit ?? body)
    } catch {
      addToast('Impossible de charger le produit.', 'error')
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await produitsAdminApi.toggleStatus(id)
      setProduits(prev => prev.map(p => p.id === id ? { ...p, est_visible: !p.est_visible } : p))
      addToast('Visibilité modifiée.')
    } catch {
      addToast('Impossible de modifier la visibilité.', 'error')
    }
  }

  const handleDuplicate = async (id: number) => {
    try {
      await produitsAdminApi.duplicate(id)
      addToast('Produit dupliqué avec succès !')
      loadProduits(page)
      loadStats()
    } catch {
      addToast('Impossible de dupliquer le produit.', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const nom = deleteTarget.nom
    try {
      await produitsAdminApi.delete(deleteTarget.id)
      setDeleteTarget(null)
      addToast(`« ${nom} » supprimé avec succès.`)
      loadProduits(page)
      loadStats()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      addToast(msg ?? 'Impossible de supprimer.', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleModalSuccess = (message: string) => {
    setModal(null)
    addToast(message)
    loadProduits(page)
    loadStats()
  }

  const parentCats = categories.filter(c => !c.parent_id)
  const childrenOf = (pid: number) => categories.filter(c => c.parent_id === pid)

  // Pagination numbers
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1)
    .filter(p => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
      if (idx > 0 && (arr[idx - 1] as number) !== p - 1) acc.push('…')
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Gestion des produits</h1>
          <p className="text-sm text-muted mt-1">
            {loading ? '…' : `${total} produit${total !== 1 ? 's' : ''} au total`}
          </p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-beige-500 text-white text-sm font-semibold hover:bg-beige-400 transition-colors shadow-beige"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          Nouveau produit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total" value={stats.total} icon={Package} iconBg="bg-beige-200" iconColor="text-beige-500" loading={statsLoading} />
        <StatCard title="Visibles" value={stats.visibles} icon={Eye} iconBg="bg-sage/30" iconColor="text-emerald-600" loading={statsLoading} />
        <StatCard title="Masqués" value={stats.masques} icon={EyeOff} iconBg="bg-blush/30" iconColor="text-rose-500" loading={statsLoading} />
        <StatCard title="En promo" value={stats.enPromo} icon={TrendingUp} iconBg="bg-sky-50" iconColor="text-sky-500" loading={statsLoading} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-50 border border-beige-300 rounded-xl text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Category dropdown */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-50 border border-beige-300 text-muted focus:outline-none focus:border-beige-400 transition-colors"
          >
            <option value="">Toutes catégories</option>
            {parentCats.map(p => (
              <optgroup key={p.id} label={p.nom}>
                <option value={p.id}>{p.nom}</option>
                {childrenOf(p.id).map(c => (
                  <option key={c.id} value={c.id}>&nbsp;&nbsp;└ {c.nom}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Status filters */}
          {(['', 'visible', 'hidden'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === f
                  ? 'bg-beige-500 text-white shadow-beige'
                  : 'bg-beige-50 border border-beige-300 text-muted hover:bg-beige-200'
              }`}
            >
              {f === '' ? 'Tous' : f === 'visible' ? 'Visibles' : 'Masqués'}
            </button>
          ))}

          <button
            onClick={() => { loadProduits(page); loadStats() }}
            disabled={loading}
            className="p-2.5 bg-beige-50 border border-beige-300 rounded-xl hover:bg-beige-200 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 text-muted ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : produits.length === 0 ? (
        <div className="bg-beige-50 rounded-2xl border border-beige-300 p-12 text-center">
          <Package className="w-8 h-8 text-beige-400 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink mb-1">Aucun produit</p>
          <p className="text-xs text-muted mb-4">
            {search ? 'Aucun résultat pour cette recherche.' : 'Ajoutez votre premier produit.'}
          </p>
          {!search && (
            <button
              onClick={() => setModal('create')}
              className="px-4 py-2 bg-beige-500 text-white text-xs font-semibold rounded-xl hover:bg-beige-400 transition-colors"
            >
              + Nouveau produit
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {produits.map(p => (
            <ProductCard
              key={p.id}
              produit={p}
              onEdit={() => handleEdit(p.id)}
              onDelete={() => setDeleteTarget({ id: p.id, nom: p.nom })}
              onDuplicate={() => handleDuplicate(p.id)}
              onToggle={() => handleToggle(p.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>

          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="text-muted text-sm px-1">…</span>
            ) : (
              <button
                key={p}
                onClick={() => handlePageChange(p as number)}
                className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                  p === page
                    ? 'bg-beige-500 text-white shadow-beige'
                    : 'border border-beige-300 text-muted hover:bg-beige-200'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= lastPage}
            className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Form Modal */}
      {modal !== null && (
        <ProductFormModal
          produit={modal === 'create' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteDialog
          nom={deleteTarget.nom}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[200] min-w-[280px] max-w-[360px]">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  )
}
