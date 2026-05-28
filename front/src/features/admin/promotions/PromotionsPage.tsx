import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles, Download, Filter, Search, Tag, Percent, Gift, Timer,
  Megaphone, Calendar, FileText, Eye, Pencil, Power, Trash2,
  ChevronLeft, ChevronRight, Crown,
} from 'lucide-react'
import { promotionsAdminApi } from '@/api/admin/promotions'
import type {
  AdminPromotionDetail,
  AdminPromotionListItem,
  AdminPromotionOptions,
  AdminPromotionStats,
} from '@/types/admin'
import { fmtMoney } from '@/features/admin/orders/orderHelpers'

interface ToastItem { id: number; message: string; type: 'success' | 'error' }

function StatCard({ title, value, icon: Icon, iconBg, iconColor, loading }: {
  title: string
  value: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  loading: boolean
}) {
  return (
    <div className="bg-beige-50 rounded-2xl p-5 border border-beige-300 shadow-beige">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.5} />
      </div>
      {loading
        ? <div className="h-7 w-20 bg-beige-200 rounded-lg animate-pulse mb-1" />
        : <p className="text-2xl font-bold text-ink">{value}</p>
      }
      <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mt-1">{title}</p>
    </div>
  )
}

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-beige-lg border text-sm font-medium animate-[fadeInUp_0.2s_ease]
      ${type === 'success' ? 'bg-beige-50 border-beige-300 text-ink' : 'bg-blush/20 border-blush text-rose-700'}`}>
      {type === 'success'
        ? <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={1.5} />
        : <Sparkles className="w-4 h-4 text-rose-500 flex-shrink-0" strokeWidth={1.5} />
      }
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="ml-1 p-0.5 rounded hover:opacity-60 transition-opacity">
        <Sparkles className="w-3 h-3" strokeWidth={2} />
      </button>
    </div>
  )
}

function statusBadge(promo: AdminPromotionListItem) {
  switch (promo.statut) {
    case 'active':
      return 'bg-sage/30 text-emerald-700'
    case 'future':
      return 'bg-sky-50 text-sky-600'
    case 'expiree':
      return 'bg-blush/30 text-rose-600'
    case 'inactive':
      return 'bg-beige-200 text-muted'
    default:
      return 'bg-beige-200 text-muted'
  }
}

function PromotionFormModal({
  mode,
  promotion,
  options,
  loading,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit'
  promotion: AdminPromotionDetail | null
  options: AdminPromotionOptions | null
  loading: boolean
  onClose: () => void
  onSave: (payload: FormData) => void
}) {
  const [form, setForm] = useState({
    nom: '',
    description: '',
    code: '',
    type_promotion: 'pourcentage',
    valeur: '0',
    montant_minimum: '',
    reduction_maximum: '',
    date_debut: '',
    date_fin: '',
    utilisation_maximum: '',
    utilisation_par_client: '1',
    cible_client: 'tous',
    categories_eligibles: [] as number[],
    produits_eligibles: [] as number[],
    cumul_avec_autres: false,
    premiere_commande_seulement: false,
    jours_semaine_valides: [] as number[],
    afficher_site: true,
    envoyer_whatsapp: false,
    envoyer_email: false,
    couleur_affichage: '#C9A98A',
    est_active: true,
    image: null as File | null,
  })

  useEffect(() => {
    if (!promotion) return
    setForm({
      nom: promotion.nom ?? '',
      description: promotion.description ?? '',
      code: promotion.code ?? '',
      type_promotion: promotion.type_promotion ?? 'pourcentage',
      valeur: String(promotion.valeur ?? 0),
      montant_minimum: promotion.montant_minimum != null ? String(promotion.montant_minimum) : '',
      reduction_maximum: promotion.reduction_maximum != null ? String(promotion.reduction_maximum) : '',
      date_debut: promotion.date_debut ? promotion.date_debut.split('/').reverse().join('-') : '',
      date_fin: promotion.date_fin ? promotion.date_fin.split('/').reverse().join('-') : '',
      utilisation_maximum: promotion.utilisation_maximum != null ? String(promotion.utilisation_maximum) : '',
      utilisation_par_client: promotion.utilisation_par_client != null ? String(promotion.utilisation_par_client) : '1',
      cible_client: promotion.cible_client ?? 'tous',
      categories_eligibles: promotion.categories_eligibles ?? [],
      produits_eligibles: promotion.produits_eligibles ?? [],
      cumul_avec_autres: Boolean(promotion.cumul_avec_autres),
      premiere_commande_seulement: Boolean(promotion.premiere_commande_seulement),
      jours_semaine_valides: promotion.jours_semaine_valides ?? [],
      afficher_site: promotion.afficher_site ?? true,
      envoyer_whatsapp: Boolean(promotion.envoyer_whatsapp),
      envoyer_email: Boolean(promotion.envoyer_email),
      couleur_affichage: promotion.couleur_affichage ?? '#C9A98A',
      est_active: Boolean(promotion.est_active),
      image: null,
    })
  }, [promotion])

  if (!options && mode === 'create') return null

  const toggleArrayValue = (list: number[], value: number) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const handleSubmit = () => {
    const fd = new FormData()
    fd.append('nom', form.nom.trim())
    fd.append('description', form.description.trim())
    if (form.code.trim()) fd.append('code', form.code.trim())
    fd.append('type_promotion', form.type_promotion)
    fd.append('valeur', form.valeur || '0')
    if (form.montant_minimum) fd.append('montant_minimum', form.montant_minimum)
    if (form.reduction_maximum) fd.append('reduction_maximum', form.reduction_maximum)
    fd.append('date_debut', form.date_debut)
    fd.append('date_fin', form.date_fin)
    if (form.utilisation_maximum) fd.append('utilisation_maximum', form.utilisation_maximum)
    fd.append('utilisation_par_client', form.utilisation_par_client || '1')
    fd.append('cible_client', form.cible_client)
    form.categories_eligibles.forEach((id) => fd.append('categories_eligibles[]', String(id)))
    form.produits_eligibles.forEach((id) => fd.append('produits_eligibles[]', String(id)))
    form.jours_semaine_valides.forEach((day) => fd.append('jours_semaine_valides[]', String(day)))
    fd.append('cumul_avec_autres', form.cumul_avec_autres ? '1' : '0')
    fd.append('premiere_commande_seulement', form.premiere_commande_seulement ? '1' : '0')
    fd.append('afficher_site', form.afficher_site ? '1' : '0')
    fd.append('envoyer_whatsapp', form.envoyer_whatsapp ? '1' : '0')
    fd.append('envoyer_email', form.envoyer_email ? '1' : '0')
    fd.append('couleur_affichage', form.couleur_affichage)
    fd.append('est_active', form.est_active ? '1' : '0')
    if (form.image) fd.append('image', form.image)
    onSave(fd)
  }

  return (
    <div className="fixed inset-0 z-[140] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-beige-50 w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-beige-300 shadow-beige-lg">
        <div className="p-6 border-b border-beige-300 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">
              {mode === 'create' ? 'Nouvelle promotion' : 'Edition promotion'}
            </p>
            <h2 className="text-2xl font-serif font-bold text-ink mt-1">Promotion marketing</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200">
            <Eye className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">Informations principales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={form.nom}
                  onChange={(e) => setForm((prev) => ({ ...prev, nom: e.target.value }))}
                  placeholder="Nom promotion"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <input
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="Code promo"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink md:col-span-2 min-h-[100px]"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.files?.[0] ?? null }))}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-50 border border-beige-300 text-muted md:col-span-2"
                />
              </div>
            </div>

            <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">Type et reduction</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={form.type_promotion}
                  onChange={(e) => setForm((prev) => ({ ...prev, type_promotion: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-50 border border-beige-300 text-muted"
                >
                  {options?.types_promotion.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={form.valeur}
                  onChange={(e) => setForm((prev) => ({ ...prev, valeur: e.target.value }))}
                  placeholder="Valeur"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <input
                  type="number"
                  min={0}
                  value={form.montant_minimum}
                  onChange={(e) => setForm((prev) => ({ ...prev, montant_minimum: e.target.value }))}
                  placeholder="Montant minimum"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <input
                  type="number"
                  min={0}
                  value={form.reduction_maximum}
                  onChange={(e) => setForm((prev) => ({ ...prev, reduction_maximum: e.target.value }))}
                  placeholder="Reduction maximum"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
              </div>
            </div>

            <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">Application</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={form.cible_client}
                  onChange={(e) => setForm((prev) => ({ ...prev, cible_client: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-50 border border-beige-300 text-muted"
                >
                  {options?.cibles_client.map((cible) => (
                    <option key={cible.value} value={cible.value}>{cible.label}</option>
                  ))}
                </select>
                <input
                  value={form.couleur_affichage}
                  onChange={(e) => setForm((prev) => ({ ...prev, couleur_affichage: e.target.value }))}
                  placeholder="#C9A98A"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-beige-50 border border-beige-300 rounded-xl p-3 max-h-40 overflow-y-auto">
                    <p className="text-[11px] text-muted uppercase tracking-widest mb-2">Categories</p>
                    <div className="space-y-2">
                      {options?.categories.map((cat) => (
                        <label key={cat.id} className="flex items-center gap-2 text-xs text-muted">
                          <input
                            type="checkbox"
                            checked={form.categories_eligibles.includes(cat.id)}
                            onChange={() => setForm((prev) => ({
                              ...prev,
                              categories_eligibles: toggleArrayValue(prev.categories_eligibles, cat.id),
                            }))}
                            className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                          />
                          {cat.nom}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="bg-beige-50 border border-beige-300 rounded-xl p-3 max-h-40 overflow-y-auto">
                    <p className="text-[11px] text-muted uppercase tracking-widest mb-2">Produits</p>
                    <div className="space-y-2">
                      {options?.produits.map((prod) => (
                        <label key={prod.id} className="flex items-center gap-2 text-xs text-muted">
                          <input
                            type="checkbox"
                            checked={form.produits_eligibles.includes(prod.id)}
                            onChange={() => setForm((prev) => ({
                              ...prev,
                              produits_eligibles: toggleArrayValue(prev.produits_eligibles, prod.id),
                            }))}
                            className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                          />
                          {prod.nom}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">Periode</h3>
              <div className="space-y-3">
                <input
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => setForm((prev) => ({ ...prev, date_debut: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <input
                  type="date"
                  value={form.date_fin}
                  onChange={(e) => setForm((prev) => ({ ...prev, date_fin: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
              </div>
            </div>

            <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">Conditions</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  min={1}
                  value={form.utilisation_par_client}
                  onChange={(e) => setForm((prev) => ({ ...prev, utilisation_par_client: e.target.value }))}
                  placeholder="Utilisations par client"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <input
                  type="number"
                  min={1}
                  value={form.utilisation_maximum}
                  onChange={(e) => setForm((prev) => ({ ...prev, utilisation_maximum: e.target.value }))}
                  placeholder="Utilisations max"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <div className="space-y-2">
                  {options?.jours_semaine.map((jour) => (
                    <label key={jour.value} className="flex items-center gap-2 text-xs text-muted">
                      <input
                        type="checkbox"
                        checked={form.jours_semaine_valides.includes(Number(jour.value))}
                        onChange={() => setForm((prev) => ({
                          ...prev,
                          jours_semaine_valides: toggleArrayValue(prev.jours_semaine_valides, Number(jour.value)),
                        }))}
                        className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                      />
                      {jour.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">Visibilite</h3>
              <div className="space-y-2 text-xs text-muted">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.est_active}
                    onChange={(e) => setForm((prev) => ({ ...prev, est_active: e.target.checked }))}
                    className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.afficher_site}
                    onChange={(e) => setForm((prev) => ({ ...prev, afficher_site: e.target.checked }))}
                    className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                  />
                  Afficher sur le site
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.cumul_avec_autres}
                    onChange={(e) => setForm((prev) => ({ ...prev, cumul_avec_autres: e.target.checked }))}
                    className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                  />
                  Cumulable
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.premiere_commande_seulement}
                    onChange={(e) => setForm((prev) => ({ ...prev, premiere_commande_seulement: e.target.checked }))}
                    className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                  />
                  Premiere commande
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.envoyer_whatsapp}
                    onChange={(e) => setForm((prev) => ({ ...prev, envoyer_whatsapp: e.target.checked }))}
                    className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                  />
                  Envoyer WhatsApp
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.envoyer_email}
                    onChange={(e) => setForm((prev) => ({ ...prev, envoyer_email: e.target.checked }))}
                    className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                  />
                  Envoyer email
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-beige-300 text-muted hover:bg-beige-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-beige-500 text-white hover:bg-beige-400 disabled:opacity-50"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<AdminPromotionListItem[]>([])
  const [stats, setStats] = useState<AdminPromotionStats | null>(null)
  const [options, setOptions] = useState<AdminPromotionOptions | null>(null)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [formTarget, setFormTarget] = useState<AdminPromotionDetail | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = (message: string, type: ToastItem['type'] = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const res = await promotionsAdminApi.stats()
      setStats(res.data.data)
    } catch {
      addToast('Impossible de charger les statistiques.', 'error')
    } finally {
      setStatsLoading(false)
    }
  }

  const loadPromotions = async (nextPage: number = page) => {
    setLoading(true)
    try {
      const res = await promotionsAdminApi.list({
        page: nextPage,
        per_page: 12,
        search: search || undefined,
        statut: statusFilter || undefined,
        type: typeFilter || undefined,
        date_debut: dateStart || undefined,
        date_fin: dateEnd || undefined,
      })
      setPromotions(res.data.data.promotions)
      setLastPage(res.data.data.pagination.last_page || 1)
    } catch {
      addToast('Impossible de charger les promotions.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadOptions = async () => {
    if (options) return
    try {
      const res = await promotionsAdminApi.options()
      setOptions(res.data.data)
    } catch {
      addToast('Impossible de charger les options.', 'error')
    }
  }

  const refresh = async () => {
    await Promise.all([loadPromotions(1), loadStats()])
  }

  useEffect(() => {
    loadPromotions(1)
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      loadPromotions(1)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, typeFilter, dateStart, dateEnd])

  const activePromotions = useMemo(
    () => promotions.filter((p) => p.is_current_active),
    [promotions],
  )

  const openCreate = async () => {
    await loadOptions()
    setFormTarget(null)
    setFormMode('create')
  }

  const openEdit = async (promotionId: number) => {
    setFormLoading(true)
    try {
      await loadOptions()
      const res = await promotionsAdminApi.show(promotionId)
      setFormTarget(res.data.data.promotion)
      setFormMode('edit')
    } catch {
      addToast('Impossible de charger la promotion.', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const handleSavePromotion = async (payload: FormData) => {
    if (!formMode) return
    setFormLoading(true)
    try {
      if (formMode === 'create') {
        await promotionsAdminApi.create(payload)
        addToast('Promotion creee avec succes.')
      } else if (formMode === 'edit' && formTarget) {
        await promotionsAdminApi.update(formTarget.id, payload)
        addToast('Promotion mise a jour.')
      }
      setFormMode(null)
      setFormTarget(null)
      await refresh()
    } catch {
      addToast('Enregistrement impossible.', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (promotion: AdminPromotionListItem) => {
    const confirmed = window.confirm(`Supprimer ${promotion.nom} ?`)
    if (!confirmed) return
    setDeleteLoadingId(promotion.id)
    try {
      await promotionsAdminApi.remove(promotion.id)
      addToast('Promotion supprimee avec succes.')
      await refresh()
    } catch {
      addToast('Suppression impossible.', 'error')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleToggleStatus = async (promotion: AdminPromotionListItem) => {
    try {
      await promotionsAdminApi.toggleStatus(promotion.id)
      addToast(promotion.est_active ? 'Promotion desactivee.' : 'Promotion activee.')
      await refresh()
    } catch {
      addToast('Action impossible.', 'error')
    }
  }

  const pages = useMemo(() => {
    const items: Array<number | '…'> = []
    if (lastPage <= 6) {
      for (let i = 1; i <= lastPage; i += 1) items.push(i)
      return items
    }
    const start = Math.max(1, page - 1)
    const end = Math.min(lastPage, page + 1)
    if (start > 1) items.push(1, '…')
    for (let i = start; i <= end; i += 1) items.push(i)
    if (end < lastPage) items.push('…', lastPage)
    return items
  }, [lastPage, page])

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Gestion des promotions</h1>
          <p className="text-sm text-muted mt-1">Creez et gerez les offres promotionnelles de votre boutique.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openCreate}
            className="px-3.5 py-2.5 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
            Nouvelle promotion
          </button>
          <button
            onClick={() => addToast('Campagne bientot disponible.')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted hover:bg-beige-200 transition-colors flex items-center gap-2"
          >
            <Megaphone className="w-3.5 h-3.5" strokeWidth={1.5} />
            Nouvelle campagne
          </button>
          <button
            onClick={() => addToast('Codes promo bientot disponibles.')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted hover:bg-beige-200 transition-colors flex items-center gap-2"
          >
            <Tag className="w-3.5 h-3.5" strokeWidth={1.5} />
            Codes promo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Promotions actives" value={stats ? String(stats.promotions_actives) : '—'} icon={Sparkles} iconBg="bg-beige-200" iconColor="text-beige-500" loading={statsLoading} />
        <StatCard title="Produits en promo" value={stats ? String(stats.total_promotions) : '—'} icon={Tag} iconBg="bg-amber-100" iconColor="text-amber-700" loading={statsLoading} />
        <StatCard title="Revenus generes" value={stats ? `${fmtMoney(stats.ca_genere_total)} FCFA` : '—'} icon={FileText} iconBg="bg-sage/30" iconColor="text-emerald-600" loading={statsLoading} />
        <StatCard title="Codes utilises" value={stats ? String(stats.utilisations_totales) : '—'} icon={Percent} iconBg="bg-sky-50" iconColor="text-sky-600" loading={statsLoading} />
        <StatCard title="Campagnes terminees" value={stats ? String(stats.promotions_expirees) : '—'} icon={Timer} iconBg="bg-blush/30" iconColor="text-rose-500" loading={statsLoading} />
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-serif font-semibold text-ink">Promotions actives</h3>
          <span className="text-xs text-muted">{activePromotions.length} en cours</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activePromotions.map((promo) => (
            <div key={promo.id} className="relative overflow-hidden rounded-3xl border border-beige-300 bg-gradient-to-br from-[#D89B72] to-[#B68A64] text-white p-5 shadow-beige-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/70">{promo.type_label ?? promo.type_promotion}</p>
                  <h4 className="text-xl font-serif font-semibold mt-1">{promo.nom}</h4>
                </div>
                <Crown className="w-5 h-5 text-white/80" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-white/90 mt-3">{promo.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="bg-white/15 px-2.5 py-1 rounded-full">{promo.valeur_formatted ?? promo.valeur}</span>
                <span>{promo.date_debut} → {promo.date_fin}</span>
              </div>
            </div>
          ))}
          {activePromotions.length === 0 && (
            <div className="bg-beige-50 border border-beige-300 rounded-2xl p-6 text-sm text-muted">
              Aucune promotion active pour le moment.
            </div>
          )}
        </div>
      </div>

      <div className="bg-beige-50 border border-beige-300 rounded-2xl p-4 lg:p-5 mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-widest mb-4">
          <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
          Filtres & recherche
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, code, description…"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          >
            <option value="">Statut</option>
            <option value="active">Active</option>
            <option value="future">Programmee</option>
            <option value="expiree">Terminee</option>
            <option value="inactive">Suspendue</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          >
            <option value="">Type promotion</option>
            <option value="pourcentage">Pourcentage</option>
            <option value="montant_fixe">Montant fixe</option>
            <option value="livraison_gratuite">Livraison gratuite</option>
          </select>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink"
            />
          </div>
        </div>
      </div>

      <div className="hidden lg:block bg-beige-50 border border-beige-300 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1.6fr_0.8fr_0.9fr_0.7fr_1fr_0.9fr_1fr] gap-4 px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-widest border-b border-beige-300">
          <div>Promotion</div>
          <div>Type</div>
          <div>Produits</div>
          <div>Reduction</div>
          <div>Periode</div>
          <div>Statut</div>
          <div>Actions</div>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-beige-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : promotions.length === 0 ? (
          <div className="p-12 text-center">
            <Gift className="w-8 h-8 text-beige-400 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-ink mb-1">Aucune promotion</p>
            <p className="text-xs text-muted">Créez une nouvelle offre pour booster les ventes.</p>
          </div>
        ) : (
          promotions.map((promo) => (
            <div
              key={promo.id}
              className="grid grid-cols-[1.6fr_0.8fr_0.9fr_0.7fr_1fr_0.9fr_1fr] gap-4 px-5 py-4 border-b border-beige-200 hover:bg-beige-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-beige-200 flex items-center justify-center text-xs font-semibold text-muted">
                  {promo.code ? promo.code.slice(0, 2).toUpperCase() : 'PR'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{promo.nom}</p>
                  <p className="text-xs text-muted">{promo.code ?? 'Sans code'}</p>
                </div>
              </div>
              <div className="text-xs text-muted">{promo.type_label ?? promo.type_promotion}</div>
              <div className="text-xs text-muted">{promo.nombre_commandes} commandes</div>
              <div className="text-sm font-semibold text-ink">{promo.valeur_formatted ?? promo.valeur}</div>
              <div className="text-xs text-muted">{promo.date_debut} → {promo.date_fin}</div>
              <div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge(promo)}`}>
                  {promo.statut_label ?? promo.statut}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(promo.id)}
                  className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                  title="Modifier"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleToggleStatus(promo)}
                  className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                  title="Activer / Desactiver"
                >
                  <Power className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleDelete(promo)}
                  disabled={deleteLoadingId === promo.id}
                  className="p-2 rounded-xl border border-blush/50 hover:bg-blush/20 transition-colors disabled:opacity-50"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="lg:hidden space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-beige-200 rounded-2xl animate-pulse" />
          ))
        ) : promotions.map((promo) => (
          <div key={promo.id} className="bg-beige-50 border border-beige-300 rounded-2xl p-4 shadow-beige">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{promo.nom}</p>
                <p className="text-xs text-muted">{promo.code ?? 'Sans code'}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge(promo)}`}>
                {promo.statut_label ?? promo.statut}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted">{promo.type_label ?? promo.type_promotion}</div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{promo.valeur_formatted ?? promo.valeur}</span>
              <span className="text-xs text-muted">{promo.date_debut} → {promo.date_fin}</span>
            </div>
            <button
              onClick={() => openEdit(promo.id)}
              className="mt-3 w-full px-3 py-2 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 transition-colors"
            >
              Modifier
            </button>
          </div>
        ))}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => { const next = p - 1; loadPromotions(next); return next })}
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
                onClick={() => { setPage(p as number); loadPromotions(p as number) }}
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
            onClick={() => setPage((p) => { const next = p + 1; loadPromotions(next); return next })}
            disabled={page >= lastPage}
            className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {formMode && (
        <PromotionFormModal
          mode={formMode}
          promotion={formTarget}
          options={options}
          loading={formLoading}
          onClose={() => { setFormMode(null); setFormTarget(null) }}
          onSave={handleSavePromotion}
        />
      )}

      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[200] min-w-[280px] max-w-[360px]">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  )
}
