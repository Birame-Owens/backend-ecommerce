import { useEffect, useMemo, useState } from 'react'
import {
  Search, Filter, Download, Wallet, AlertTriangle, ShieldCheck, Clock3,
  XCircle, RefreshCcw, CreditCard, BadgeCheck, Receipt, Eye,
  ChevronLeft, ChevronRight, LineChart, PieChart, Banknote,
} from 'lucide-react'
import { paiementsAdminApi } from '@/api/admin/paiements'
import type {
  AdminPaymentDetail,
  AdminPaymentListItem,
  AdminPaymentMethod,
  AdminPaymentStats,
} from '@/types/admin'

const statusStyles: Record<string, string> = {
  en_attente: 'bg-amber-100 text-amber-700',
  en_cours: 'bg-sky-100 text-sky-700',
  valide: 'bg-sage/40 text-emerald-700',
  echec: 'bg-blush/40 text-rose-600',
  rembourse: 'bg-beige-200 text-muted',
  partiel_rembourse: 'bg-beige-200 text-muted',
  annule: 'bg-beige-200 text-muted',
}

const statusLabel: Record<string, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  valide: 'Valide',
  echec: 'Echoue',
  rembourse: 'Rembourse',
  partiel_rembourse: 'Partiel rembourse',
  annule: 'Annule',
}

const formatMoney = (value: number) => value.toLocaleString('fr-FR')

const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const parseDate = (value?: string | null) => {
  if (!value) return null
  const [datePart, timePart] = value.split(' ')
  if (!datePart) return null
  const [day, month, year] = datePart.split('/').map((item) => Number(item))
  if (!day || !month || !year) return null
  const [hour, minute] = timePart ? timePart.split(':').map((item) => Number(item)) : [0, 0]
  return new Date(year, month - 1, day, hour || 0, minute || 0)
}

const getRefundStatus = (payment: AdminPaymentListItem) => {
  if (payment.montant_rembourse <= 0) return 'non'
  if (payment.montant_rembourse >= payment.montant) return 'total'
  return 'partiel'
}

const getDisplayReference = (payment: AdminPaymentListItem) =>
  payment.reference_paiement || payment.transaction_id || `PAY-${payment.id}`

export default function PaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentListItem[]>([])
  const [stats, setStats] = useState<AdminPaymentStats | null>(null)
  const [methods, setMethods] = useState<AdminPaymentMethod[]>([])
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [refundFilter, setRefundFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [amountFilter, setAmountFilter] = useState('')
  const [selected, setSelected] = useState<AdminPaymentDetail | null>(null)

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const res = await paiementsAdminApi.stats()
      setStats(res.data.data)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadMethods = async () => {
    try {
      const res = await paiementsAdminApi.paymentMethods()
      setMethods(res.data.data)
    } catch {
      setMethods([])
    }
  }

  const loadPayments = async (nextPage: number = page) => {
    setLoading(true)
    try {
      const res = await paiementsAdminApi.list({
        page: nextPage,
        per_page: 12,
        search: search || undefined,
        statut: statusFilter || undefined,
        methode: methodFilter || undefined,
        date_debut: dateFilter || undefined,
        date_fin: dateFilter || undefined,
      })
      setPayments(res.data.data.paiements)
      setLastPage(res.data.data.pagination.last_page || 1)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (paymentId: number) => {
    setDetailLoading(true)
    try {
      const res = await paiementsAdminApi.show(paymentId)
      setSelected(res.data.data.paiement)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleConfirm = async (payment: AdminPaymentListItem) => {
    if (!window.confirm('Confirmer ce paiement ?')) return
    setActionLoadingId(payment.id)
    try {
      await paiementsAdminApi.confirm(payment.id)
      await Promise.all([loadPayments(page), loadStats()])
      await handleSelect(payment.id)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRefund = async (payment: AdminPaymentListItem) => {
    const montantStr = window.prompt('Montant a rembourser (FCFA)')
    if (!montantStr) return
    const montant = Number(montantStr.replace(/\s/g, ''))
    if (!Number.isFinite(montant) || montant <= 0) return
    const motif = window.prompt('Motif du remboursement')
    if (!motif) return
    setActionLoadingId(payment.id)
    try {
      await paiementsAdminApi.refund(payment.id, { montant, motif })
      await Promise.all([loadPayments(page), loadStats()])
      await handleSelect(payment.id)
    } finally {
      setActionLoadingId(null)
    }
  }

  useEffect(() => {
    loadPayments(1)
    loadStats()
    loadMethods()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      loadPayments(1)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, methodFilter, dateFilter])

  useEffect(() => {
    if (!payments.length) {
      setSelected(null)
      return
    }
    if (selected && payments.some((payment) => payment.id === selected.id)) return
    handleSelect(payments[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments])

  const filtered = useMemo(() => {
    return payments.filter((item) => {
      const matchesRefund = !refundFilter || getRefundStatus(item) === refundFilter
      const matchesAmount = !amountFilter || String(item.montant).includes(amountFilter)
      return matchesRefund && matchesAmount
    })
  }, [payments, refundFilter, amountFilter])

  const revenueTrend = useMemo(() => {
    if (!payments.length) return []
    const totals: Record<string, number> = {}
    payments.forEach((payment) => {
      if (payment.statut !== 'valide') return
      const date = parseDate(payment.date_validation || payment.date_initiation)
      if (!date) return
      const key = date.toDateString()
      totals[key] = (totals[key] ?? 0) + payment.montant
    })
    const today = new Date()
    const points = [] as Array<{ label: string; value: number }>
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const label = dayLabels[d.getDay()]
      const key = d.toDateString()
      points.push({ label, value: totals[key] ?? 0 })
    }
    return points
  }, [payments])

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
          <h1 className="text-2xl font-serif font-bold text-ink">Gestion des paiements</h1>
          <p className="text-sm text-muted mt-1">Suivez et gerez toutes les transactions de votre boutique.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled
            className="px-3.5 py-2.5 rounded-xl bg-beige-500/70 text-white text-xs font-semibold flex items-center gap-2 cursor-not-allowed"
            title="Export en preparation"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Exporter transactions
          </button>
          <button
            disabled
            className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted flex items-center gap-2 cursor-not-allowed"
            title="Analyses avancees bientot disponibles"
          >
            <Wallet className="w-3.5 h-3.5" strokeWidth={1.5} />
            Voir revenus
          </button>
          <button
            disabled
            className="px-3.5 py-2.5 rounded-xl bg-blush/30 border border-blush text-xs font-semibold text-rose-600 flex items-center gap-2 cursor-not-allowed"
            title="Filtre dedie bientot disponible"
          >
            <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
            Paiements echoues
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { title: 'Revenus totaux', value: stats ? `${formatMoney(stats.montant_total_valide)} FCFA` : '—', icon: Banknote },
          { title: 'Paiements reussis', value: stats ? String(stats.paiements_valides) : '—', icon: BadgeCheck },
          { title: 'En attente', value: stats ? String(stats.paiements_en_attente) : '—', icon: Clock3 },
          { title: 'Echoues', value: stats ? String(stats.paiements_echecs) : '—', icon: XCircle },
          { title: 'Remboursements', value: stats ? `${formatMoney(stats.montant_total_rembourse)} FCFA` : '—', icon: RefreshCcw },
        ].map((card) => (
          <div key={card.title} className="bg-beige-50 rounded-2xl p-5 border border-beige-300 shadow-beige">
            <div className="w-10 h-10 rounded-xl bg-beige-200 flex items-center justify-center mb-3">
              <card.icon className="w-5 h-5 text-beige-500" strokeWidth={1.5} />
            </div>
            {statsLoading ? (
              <div className="h-6 w-24 bg-beige-200 rounded-lg animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-ink">{card.value}</p>
            )}
            <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="bg-beige-50 border border-beige-300 rounded-2xl p-4 lg:p-5 mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-widest mb-4">
          <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
          Recherche & filtres
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ID transaction, commande, client, telephone"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          >
            <option value="">Statut paiement</option>
            <option value="paye">Paye</option>
            <option value="en_attente">En attente</option>
            <option value="echoue">Echoue</option>
            <option value="rembourse">Rembourse</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          >
            <option value="">Methode paiement</option>
            {methods.map((method) => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          />
          <input
            value={amountFilter}
            onChange={(e) => setAmountFilter(e.target.value)}
            placeholder="Montant"
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          />
          <select
            value={refundFilter}
            onChange={(e) => setRefundFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          >
            <option value="">Remboursement</option>
            <option value="non">Non</option>
            <option value="partiel">Partiel</option>
            <option value="total">Total</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-6 mb-8">
        <div className="hidden lg:block bg-beige-50 border border-beige-300 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[0.9fr_1.1fr_1fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-widest border-b border-beige-300">
            <div>Transaction</div>
            <div>Commande / client</div>
            <div>Methode</div>
            <div>Montant</div>
            <div>Statut</div>
            <div>Actions</div>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-beige-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-8 h-8 text-beige-400 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm font-medium text-ink mb-1">Aucun paiement trouve</p>
              <p className="text-xs text-muted">Ajustez les filtres pour afficher des transactions.</p>
            </div>
          ) : filtered.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[0.9fr_1.1fr_1fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-4 border-b border-beige-200 hover:bg-beige-100 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{getDisplayReference(item)}</p>
                <p className="text-xs text-muted">{item.date_validation || item.date_initiation || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{item.commande?.numero_commande ?? '—'}</p>
                <p className="text-xs text-muted">{item.client?.nom_complet ?? '—'}</p>
              </div>
              <div className="text-xs text-muted flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                {item.methode_label}
              </div>
              <div className="text-sm font-semibold text-ink">{formatMoney(item.montant)} FCFA</div>
              <div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyles[item.statut] ?? 'bg-beige-200 text-muted'}`}>
                  {item.statut_label || statusLabel[item.statut] || item.statut}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelect(item.id)}
                  className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                  title="Voir details"
                >
                  <Eye className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleConfirm(item)}
                  disabled={actionLoadingId === item.id}
                  className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors disabled:opacity-50"
                  title="Confirmer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleRefund(item)}
                  disabled={actionLoadingId === item.id}
                  className="p-2 rounded-xl border border-blush/50 hover:bg-blush/20 transition-colors disabled:opacity-50"
                  title="Rembourser"
                >
                  <RefreshCcw className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.5} />
                </button>
                <button
                  className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                  title="Telecharger recu"
                >
                  <Receipt className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Details transaction</p>
              <h3 className="text-lg font-serif font-semibold text-ink">
                {selected ? getDisplayReference(selected) : '—'}
              </h3>
            </div>
            {selected && (
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyles[selected.statut] ?? 'bg-beige-200 text-muted'}`}>
                {selected.statut_label || statusLabel[selected.statut] || selected.statut}
              </span>
            )}
          </div>

          <div className="mt-4 space-y-4 text-sm">
            {!selected && !detailLoading && (
              <div className="bg-beige-100 rounded-xl p-3 border border-beige-300 text-xs text-muted">
                Selectionnez un paiement pour afficher les details.
              </div>
            )}
            {detailLoading && (
              <div className="h-24 bg-beige-200 rounded-xl animate-pulse" />
            )}
            {selected && !detailLoading && (
              <>
            <div className="bg-beige-100 rounded-xl p-3 border border-beige-300">
              <p className="text-xs text-muted uppercase tracking-widest">Paiement</p>
              <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-muted">
                <div>
                  <p className="text-[11px]">ID transaction</p>
                  <p className="text-sm font-semibold text-ink">{getDisplayReference(selected)}</p>
                </div>
                <div>
                  <p className="text-[11px]">Montant</p>
                  <p className="text-sm font-semibold text-ink">{formatMoney(selected.montant)} FCFA</p>
                </div>
                <div>
                  <p className="text-[11px]">Methode</p>
                  <p className="text-sm font-semibold text-ink">{selected.methode_label}</p>
                </div>
                <div>
                  <p className="text-[11px]">Date</p>
                  <p className="text-sm font-semibold text-ink">{selected.date_validation || selected.date_initiation || '—'}</p>
                </div>
              </div>
            </div>

            <div className="bg-beige-100 rounded-xl p-3 border border-beige-300">
              <p className="text-xs text-muted uppercase tracking-widest">Client</p>
              <div className="mt-2 text-xs text-muted">
                <p className="text-sm font-semibold text-ink">{selected.client?.nom_complet ?? '—'}</p>
                <p>{selected.client?.telephone ?? '—'}</p>
                <p>{selected.client?.email ?? '—'}</p>
              </div>
            </div>

            <div className="bg-beige-100 rounded-xl p-3 border border-beige-300">
              <p className="text-xs text-muted uppercase tracking-widest">Commande</p>
              <div className="mt-2 text-xs text-muted space-y-1">
                <p className="text-sm font-semibold text-ink">{selected.commande?.numero_commande ?? '—'}</p>
                <p>Montant commande: {selected.commande ? `${formatMoney(selected.commande.montant_total)} FCFA` : '—'}</p>
                <p>Rembourse: {formatMoney(selected.montant_rembourse)} FCFA</p>
                <p>Reste a payer: {formatMoney(selected.montant_restant)} FCFA</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleRefund(selected)}
                disabled={actionLoadingId === selected.id}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-beige-500 text-white hover:bg-beige-400 disabled:opacity-50"
              >
                Rembourser total
              </button>
              <button
                onClick={() => handleRefund(selected)}
                disabled={actionLoadingId === selected.id}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 text-muted hover:bg-beige-200 disabled:opacity-50"
              >
                Rembourser partiel
              </button>
              <button
                onClick={() => handleConfirm(selected)}
                disabled={actionLoadingId === selected.id}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-blush/60 text-rose-600 hover:bg-blush/20 col-span-2 disabled:opacity-50"
              >
                Annuler paiement
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 mb-8">
        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Analyse revenus</p>
              <h3 className="text-lg font-serif font-semibold text-ink">Revenus journaliers</h3>
            </div>
            <LineChart className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="h-40 bg-beige-100 rounded-2xl border border-beige-300 flex items-end gap-2 p-4">
            {revenueTrend.length === 0 && (
              <div className="text-xs text-muted">Aucune donnee disponible.</div>
            )}
            {revenueTrend.map((item) => (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-lg bg-beige-400/80"
                  style={{ height: `${Math.max(6, item.value / 500)}px` }}
                />
                <span className="text-[10px] text-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Methodes</p>
              <h3 className="text-lg font-serif font-semibold text-ink">Paiements populaires</h3>
            </div>
            <PieChart className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="space-y-3">
            {methods.length === 0 && (
              <div className="text-xs text-muted">Aucune methode disponible.</div>
            )}
            {methods.map((method) => (
              <div key={method.value} className="flex items-center justify-between bg-beige-100 rounded-xl border border-beige-300 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-ink">
                  <CreditCard className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                  {method.label}
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${method.active ? 'bg-sage/40 text-emerald-700' : 'bg-beige-200 text-muted'}`}>
                  {method.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-widest">Paiements echoues</p>
            <h3 className="text-lg font-serif font-semibold text-ink">Transactions a surveiller</h3>
          </div>
          <AlertTriangle className="w-4 h-4 text-rose-500" strokeWidth={1.5} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {payments.filter((item) => item.statut === 'echec').map((item) => (
            <div key={item.id} className="bg-beige-100 border border-beige-300 rounded-2xl p-4">
              <p className="text-xs text-muted">{item.client?.nom_complet ?? '—'}</p>
              <p className="text-sm font-semibold text-ink">{formatMoney(item.montant)} FCFA</p>
              <p className="text-xs text-rose-600 mt-2">Erreur: verification 3-D secure</p>
              <button className="mt-3 px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 text-muted hover:bg-beige-200">
                Relancer
              </button>
            </div>
          ))}
          {payments.filter((item) => item.statut === 'echec').length === 0 && (
            <div className="bg-beige-100 border border-beige-300 rounded-2xl p-4 text-xs text-muted">
              Aucun paiement echoue sur cette page.
            </div>
          )}
        </div>
      </div>

      <div className="lg:hidden space-y-4">
        {filtered.map((item) => (
          <div key={item.id} className="bg-beige-50 border border-beige-300 rounded-2xl p-4 shadow-beige">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{getDisplayReference(item)}</p>
                <p className="text-xs text-muted">{item.commande?.numero_commande ?? '—'} · {item.client?.nom_complet ?? '—'}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyles[item.statut] ?? 'bg-beige-200 text-muted'}`}>
                {item.statut_label || statusLabel[item.statut] || item.statut}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>{item.methode_label}</span>
              <span>{formatMoney(item.montant)} FCFA</span>
            </div>
            <button
              onClick={() => handleSelect(item.id)}
              className="mt-3 w-full px-3 py-2 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400"
            >
              Voir details
            </button>
          </div>
        ))}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => { const next = Math.max(1, p - 1); loadPayments(next); return next })}
            className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
          {pages.map((p, index) =>
            p === '…' ? (
              <span key={`gap-${index}`} className="text-muted text-sm px-1">…</span>
            ) : (
              <button
                key={p}
                onClick={() => { setPage(p as number); loadPayments(p as number) }}
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
            onClick={() => setPage((p) => { const next = Math.min(lastPage, p + 1); loadPayments(next); return next })}
            className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
            disabled={page >= lastPage}
          >
            <ChevronRight className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  )
}
