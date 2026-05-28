import { useEffect, useMemo, useState } from 'react'
import {
  Bell, Download, Filter, Search, Package, Clock, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Eye, Truck, RefreshCw, Calendar, CreditCard,
  MapPin, MoreHorizontal, FileText, Plus,
} from 'lucide-react'
import { ordersAdminApi } from '@/api/admin/orders'
import { CreateOrderModal } from '@/features/admin/orders/components/CreateOrderModal'
import { OrderDetailsModal } from '@/features/admin/orders/components/OrderDetailsModal'
import { PaymentModal } from '@/features/admin/orders/components/PaymentModal'
import type {
  AdminOrderPayment,
  AdminOrderDetail,
  AdminOrderListItem,
  AdminOrderStats,
} from '@/types/admin'
import { fmtMoney, paymentBadge, statusBadge, statusLabels } from '@/features/admin/orders/orderHelpers'

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
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={1.5} />
        : <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" strokeWidth={1.5} />
      }
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="ml-1 p-0.5 rounded hover:opacity-60 transition-opacity">
        <XCircle className="w-3 h-3" strokeWidth={2} />
      </button>
    </div>
  )
}

function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([])
  const [stats, setStats] = useState<AdminOrderStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const [numeroFilter, setNumeroFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [prioriteFilter, setPrioriteFilter] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selected, setSelected] = useState<AdminOrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState<AdminOrderDetail | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
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
      const res = await ordersAdminApi.stats()
      setStats(res.data.data)
    } catch {
      addToast('Impossible de charger les statistiques.', 'error')
    } finally {
      setStatsLoading(false)
    }
  }

  const loadOrders = async (nextPage: number = page) => {
    setLoading(true)
    try {
      const res = await ordersAdminApi.list({
        page: nextPage,
        per_page: 12,
        statut: statutFilter || undefined,
        priorite: prioriteFilter || undefined,
        numero_commande: numeroFilter || undefined,
        client_search: clientFilter || undefined,
        date_debut: dateStart || undefined,
        date_fin: dateEnd || undefined,
      })
      setOrders(res.data.data.commandes)
      setLastPage(res.data.data.pagination.last_page || 1)
    } catch {
      addToast('Impossible de charger les commandes.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    await Promise.all([loadOrders(1), loadStats()])
  }

  useEffect(() => {
    loadOrders(1)
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      loadOrders(1)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeroFilter, clientFilter, statutFilter, paymentFilter, prioriteFilter, dateStart, dateEnd])

  useEffect(() => {
    if (!selectedId) return
    const fetchDetail = async () => {
      setDetailLoading(true)
      try {
        const res = await ordersAdminApi.show(selectedId)
        setSelected(res.data.data.commande)
      } catch {
        addToast('Impossible de charger la commande.', 'error')
      } finally {
        setDetailLoading(false)
      }
    }
    fetchDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const handleExport = async () => {
    try {
      const res = await ordersAdminApi.export()
      const url = res.data.data.url
      window.open(url, '_blank')
    } catch {
      addToast('Export indisponible.', 'error')
    }
  }

  const handleUpdateStatus = async (statut: string) => {
    if (!selected) return
    setUpdateLoading(true)
    try {
      await ordersAdminApi.updateStatus(selected.id, { statut })
      addToast('Statut mis a jour.')
      await refresh()
      const res = await ordersAdminApi.show(selected.id)
      setSelected(res.data.data.commande)
    } catch {
      addToast('Mise a jour impossible.', 'error')
    } finally {
      setUpdateLoading(false)
    }
  }

  const handlePayment = async (payload: { montant: number; methode_paiement: string; reference_paiement?: string | null }) => {
    if (!paymentTarget) return
    setPaymentLoading(true)
    try {
      const res = await ordersAdminApi.markPaid(paymentTarget.id, payload)
      const paiement = res.data.data.paiement as AdminOrderPayment
      addToast(`Paiement enregistre: ${fmtMoney(paiement.montant)} FCFA.`)
      setPaymentTarget(null)
      await refresh()
      const orderId = paymentTarget.id
      if (selectedId === orderId) {
        const detail = await ordersAdminApi.show(orderId)
        setSelected(detail.data.data.commande)
      }
    } catch {
      addToast('Paiement impossible.', 'error')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleDelete = async (order: AdminOrderListItem) => {
    const canDelete = order.statut === 'en_attente' && order.peut_supprimer
    if (!canDelete) {
      addToast('Suppression impossible pour ce statut.', 'error')
      return
    }
    const confirmed = window.confirm(`Supprimer la commande ${order.numero_commande} ?`)
    if (!confirmed) return
    setDeleteLoadingId(order.id)
    try {
      await ordersAdminApi.remove(order.id)
      addToast('Commande supprimee avec succes.')
      await refresh()
    } catch {
      addToast('Suppression impossible.', 'error')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const filteredOrders = useMemo(() => {
    if (!paymentFilter) return orders
    const shouldBePaid = paymentFilter === 'paid'
    return orders.filter((order) => order.est_payee === shouldBePaid)
  }, [orders, paymentFilter])

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

  const countLivrees = stats?.commandes_livrees ?? stats?.commandes_par_statut?.livree ?? 0
  const countAnnulees = stats?.commandes_annulees ?? stats?.commandes_par_statut?.annulee ?? 0

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Gestion des commandes</h1>
          <p className="text-sm text-muted mt-1">Suivez, gerez et traitez les commandes de votre boutique.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 transition-colors flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            Nouvelle commande
          </button>
          <button
            onClick={handleExport}
            className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted hover:bg-beige-200 transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            Exporter
          </button>
          <button
            onClick={() => setStatutFilter('en_attente')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 transition-colors flex items-center gap-2"
          >
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            Commandes en attente
          </button>
          <button
            onClick={() => addToast('Notifications bientot disponibles.')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted hover:bg-beige-200 transition-colors flex items-center gap-2"
          >
            <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
            Notifications
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total commandes" value={stats ? String(stats.total_commandes) : '—'} icon={Package} iconBg="bg-beige-200" iconColor="text-beige-500" loading={statsLoading} />
        <StatCard title="En attente" value={stats ? String(stats.commandes_en_attente) : '—'} icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-700" loading={statsLoading} />
        <StatCard title="Livrees" value={stats ? String(countLivrees) : '—'} icon={Truck} iconBg="bg-sage/30" iconColor="text-emerald-600" loading={statsLoading} />
        <StatCard title="Revenus" value={stats ? `${fmtMoney(stats.ca_total)} FCFA` : '—'} icon={CreditCard} iconBg="bg-beige-200" iconColor="text-beige-500" loading={statsLoading} />
        <StatCard title="Annulees" value={stats ? String(countAnnulees) : '—'} icon={XCircle} iconBg="bg-blush/30" iconColor="text-rose-500" loading={statsLoading} />
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
              value={numeroFilter}
              onChange={(e) => setNumeroFilter(e.target.value)}
              placeholder="Numero commande…"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
            <input
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              placeholder="Client, telephone, email…"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
            />
          </div>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted focus:outline-none focus:border-beige-400"
          >
            <option value="">Statut commande</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted focus:outline-none focus:border-beige-400"
          >
            <option value="">Paiement</option>
            <option value="paid">Payee</option>
            <option value="unpaid">En attente</option>
          </select>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
            />
          </div>
          <select
            value={prioriteFilter}
            onChange={(e) => setPrioriteFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted focus:outline-none focus:border-beige-400"
          >
            <option value="">Priorite</option>
            <option value="normale">Normale</option>
            <option value="urgente">Urgente</option>
            <option value="tres_urgente">Tres urgente</option>
          </select>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
            <input
              placeholder="Ville (bientot)"
              disabled
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-50 border border-beige-300 rounded-xl text-muted/60"
            />
          </div>
          <div className="relative">
            <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
            <input
              placeholder="Methode paiement (bientot)"
              disabled
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-50 border border-beige-300 rounded-xl text-muted/60"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2.5 bg-beige-50 border border-beige-300 rounded-xl hover:bg-beige-200 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 text-muted ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
          <span className="text-xs text-muted">{loading ? 'Chargement…' : `${filteredOrders.length} commande(s)`}</span>
        </div>
      </div>

      <div className="hidden lg:block bg-beige-50 border border-beige-300 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1.6fr_1.2fr_1fr_1fr_1fr_1.2fr_1.2fr] gap-4 px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-widest border-b border-beige-300">
          <div>Numero</div>
          <div>Client</div>
          <div>Produits</div>
          <div>Montant</div>
          <div>Paiement</div>
          <div>Livraison</div>
          <div>Date</div>
          <div>Actions</div>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-beige-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-8 h-8 text-beige-400 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-ink mb-1">Aucune commande</p>
            <p className="text-xs text-muted">Ajustez vos filtres ou reessayez plus tard.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-[1.2fr_1.6fr_1.2fr_1fr_1fr_1fr_1.2fr_1.2fr] gap-4 px-5 py-4 border-b border-beige-200 hover:bg-beige-100 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{order.numero_commande}</p>
                {order.est_en_retard && (
                  <span className="text-[11px] text-rose-600 font-semibold">En retard</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{order.client?.nom_complet ?? order.nom_destinataire}</p>
                <p className="text-xs text-muted">{order.client?.telephone ?? order.telephone_livraison}</p>
              </div>
              <div className="text-xs text-muted">
                {order.nb_articles} article(s)
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{fmtMoney(order.montant_total)} FCFA</p>
                <p className="text-[11px] text-muted">Livraison incluse</p>
              </div>
              <div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${paymentBadge(order.est_payee)}`}>
                  {order.est_payee ? 'Payee' : 'En attente'}
                </span>
              </div>
              <div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge(order.statut)}`}>
                  {order.statut_label}
                </span>
              </div>
              <div className="text-xs text-muted">{order.date_commande}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedId(order.id)}
                  className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                  title="Voir details"
                >
                  <Eye className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                </button>
                <button
                  className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                  title="Facture"
                  disabled
                >
                  <FileText className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleDelete(order)}
                  disabled={deleteLoadingId === order.id || order.statut !== 'en_attente' || !order.peut_supprimer}
                  className="p-2 rounded-xl border border-blush/50 hover:bg-blush/20 transition-colors disabled:opacity-50"
                  title="Supprimer"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.5} />
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
        ) : filteredOrders.map((order) => (
          <div key={order.id} className="bg-beige-50 border border-beige-300 rounded-2xl p-4 shadow-beige">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{order.numero_commande}</p>
                <p className="text-xs text-muted">{order.date_commande}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge(order.statut)}`}>
                {order.statut_label}
              </span>
            </div>
            <div className="mt-3 text-sm text-ink font-semibold">
              {order.client?.nom_complet ?? order.nom_destinataire}
            </div>
            <div className="text-xs text-muted">{order.client?.telephone ?? order.telephone_livraison}</div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{fmtMoney(order.montant_total)} FCFA</span>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${paymentBadge(order.est_payee)}`}>
                {order.est_payee ? 'Payee' : 'En attente'}
              </span>
            </div>
            <button
              onClick={() => setSelectedId(order.id)}
              className="mt-3 w-full px-3 py-2 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 transition-colors"
            >
              Voir details
            </button>
          </div>
        ))}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => { const next = p - 1; loadOrders(next); return next })}
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
                onClick={() => { setPage(p as number); loadOrders(p as number) }}
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
            onClick={() => setPage((p) => { const next = p + 1; loadOrders(next); return next })}
            disabled={page >= lastPage}
            className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {selectedId && (
        <OrderDetailsModal
          order={selected}
          loading={detailLoading}
          updating={updateLoading}
          onClose={() => { setSelectedId(null); setSelected(null) }}
          onUpdateStatus={handleUpdateStatus}
          onOpenPayment={(order) => setPaymentTarget(order)}
        />
      )}

      {paymentTarget && (
        <PaymentModal
          order={paymentTarget}
          loading={paymentLoading}
          onClose={() => setPaymentTarget(null)}
          onSubmit={handlePayment}
        />
      )}

      {createOpen && (
        <CreateOrderModal
          onClose={() => setCreateOpen(false)}
          onError={(msg) => addToast(msg, 'error')}
          onCreated={(order) => {
            addToast('Commande creee avec succes.')
            setCreateOpen(false)
            setPage(1)
            loadOrders(1)
            loadStats()
            setSelectedId(order.id)
          }}
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

export { OrdersPage }
export default OrdersPage
