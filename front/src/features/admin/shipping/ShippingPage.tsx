import { useEffect, useMemo, useState } from 'react'
import {
  Search, Filter, Truck, MapPin, PackageCheck, AlertTriangle, Wallet,
  ClipboardList, PhoneCall, Route, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { ordersAdminApi } from '@/api/admin/orders'
import { shippingAdminApi } from '@/api/admin/shipping'
import type { AdminOrderDetail, AdminOrderListItem, AdminOrderStats, AdminShippingSettings } from '@/types/admin'
import { fmtMoney, statusBadge, statusLabels } from '@/features/admin/orders/orderHelpers'

const deliveryStatuses = ['en_preparation', 'prete', 'en_livraison', 'livree', 'annulee']

const timelineSteps = [
  { key: 'confirmee', label: 'Commande validee' },
  { key: 'en_preparation', label: 'Preparation' },
  { key: 'prete', label: 'Expediee' },
  { key: 'en_livraison', label: 'En route' },
  { key: 'livree', label: 'Livree' },
]

/* ─── Réglages de livraison éditables (seuil, tarif par défaut, on/off) ─── */
function ShippingSettingsCard({
  settings,
  onSaved,
}: {
  settings: AdminShippingSettings | null
  onSaved: (s: AdminShippingSettings) => void
}) {
  const [threshold, setThreshold] = useState('')
  const [defaultCost, setDefaultCost] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (settings) {
      setThreshold(String(Math.round(settings.free_threshold)))
      setDefaultCost(String(Math.round(settings.default_cost)))
      setEnabled(settings.is_enabled)
    }
  }, [settings])

  const dirty = !!settings && (
    Number(threshold) !== Math.round(settings.free_threshold) ||
    Number(defaultCost) !== Math.round(settings.default_cost) ||
    enabled !== settings.is_enabled
  )

  async function handleSave() {
    const ft = Number(threshold)
    const dc = Number(defaultCost)
    if (isNaN(ft) || ft < 0 || isNaN(dc) || dc < 0) {
      setMsg({ type: 'err', text: 'Valeurs invalides.' })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const res = await shippingAdminApi.updateSettings({ default_cost: dc, free_threshold: ft, is_enabled: enabled })
      onSaved(res.data.data)
      setMsg({ type: 'ok', text: 'Paramètres enregistrés.' })
    } catch {
      setMsg({ type: 'err', text: "Échec de l'enregistrement." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-widest">Réglages</p>
          <h3 className="text-lg font-serif font-semibold text-ink">Livraison & gratuité</h3>
        </div>
        <Truck className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
      </div>

      <div className="space-y-4">
        {/* Activation */}
        <div className="flex items-start gap-3 bg-beige-100 rounded-xl border border-beige-300 p-3">
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`mt-0.5 w-10 h-5 rounded-full flex-shrink-0 transition-colors ${enabled ? 'bg-beige-500' : 'bg-beige-300'}`}
            aria-pressed={enabled}
          >
            <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${enabled ? 'translate-x-5' : ''}`} />
          </button>
          <div>
            <p className="text-sm font-semibold text-ink">{enabled ? 'Règles de livraison actives' : 'Règles de livraison désactivées'}</p>
            <p className="text-[11px] text-muted mt-0.5">
              Doit être <b>Active</b> pour que la gratuité au-dessus du seuil s'applique. N'ajoute aucun frais : les zones facturent déjà leur prix.
            </p>
          </div>
        </div>

        {/* Seuil de gratuité */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">
            Livraison gratuite dès (FCFA)
          </label>
          <input
            type="number" min={0} step={500}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl border border-beige-300 bg-beige-100 text-[13px] text-ink
              focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400"
          />
          <p className="text-[11px] text-muted mt-1">Gratuité appliquée aux zones marquées « éligibles » (Admin → Zones de livraison).</p>
        </div>

        {/* Tarif par défaut */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">
            Tarif par défaut (FCFA)
          </label>
          <input
            type="number" min={0} step={100}
            value={defaultCost}
            onChange={(e) => setDefaultCost(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl border border-beige-300 bg-beige-100 text-[13px] text-ink
              focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400"
          />
          <p className="text-[11px] text-muted mt-1">Utilisé seulement si aucune zone n'est sélectionnée (rare).</p>
        </div>

        {msg && (
          <p className={`text-[12px] font-medium ${msg.type === 'ok' ? 'text-ok' : 'text-red-500'}`}>{msg.text}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="w-full h-10 rounded-xl bg-beige-500 text-white text-[13px] font-semibold
            hover:bg-beige-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default function ShippingPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([])
  const [stats, setStats] = useState<AdminOrderStats | null>(null)
  const [settings, setSettings] = useState<AdminShippingSettings | null>(null)
  const [selected, setSelected] = useState<AdminOrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const res = await ordersAdminApi.stats()
      setStats(res.data.data)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const res = await shippingAdminApi.getSettings()
      setSettings(res.data.data)
    } catch {
      setSettings(null)
    }
  }

  const loadOrders = async (nextPage: number = page) => {
    setLoading(true)
    try {
      const res = await ordersAdminApi.list({
        page: nextPage,
        per_page: 12,
        client_search: search || undefined,
        numero_commande: search || undefined,
        statut: statusFilter || undefined,
        date_debut: dateStart || undefined,
        date_fin: dateEnd || undefined,
      })
      setOrders(res.data.data.commandes)
      setLastPage(res.data.data.pagination.last_page || 1)
    } finally {
      setLoading(false)
    }
  }

  const loadOrderDetail = async (orderId: number) => {
    setDetailLoading(true)
    try {
      const res = await ordersAdminApi.show(orderId)
      setSelected(res.data.data.commande)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(1)
    loadStats()
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      loadOrders(1)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, dateStart, dateEnd])

  useEffect(() => {
    if (!orders.length) {
      setSelected(null)
      return
    }
    if (selected && orders.some((order) => order.id === selected.id)) return
    loadOrderDetail(orders[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders])

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      if (!zoneFilter) return true
      const address = order.adresse_livraison ?? ''
      return address.toLowerCase().includes(zoneFilter.toLowerCase())
    })
  }, [orders, zoneFilter])

  const statusCounts = useMemo(() => {
    const map = stats?.commandes_par_statut ?? {}
    const get = (key: string) => Number(map[key] ?? 0)
    return {
      enCours: get('en_livraison') + get('prete') + get('en_preparation'),
      terminees: get('livree'),
      expediees: get('prete') + get('en_livraison') + get('livree'),
      retards: stats?.commandes_en_retard ?? 0,
    }
  }, [stats])

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
          <h1 className="text-2xl font-serif font-bold text-ink">Gestion des livraisons</h1>
          <p className="text-sm text-muted mt-1">Suivez et gerez les expeditions et livraisons des commandes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button disabled className="px-3.5 py-2.5 rounded-xl bg-beige-500/70 text-white text-xs font-semibold flex items-center gap-2 cursor-not-allowed">
            <Truck className="w-3.5 h-3.5" strokeWidth={2} />
            Nouvelle livraison
          </button>
          <button disabled className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted flex items-center gap-2 cursor-not-allowed">
            <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
            Zones livraison
          </button>
          <button disabled className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted flex items-center gap-2 cursor-not-allowed">
            <PackageCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
            Commandes expediees
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { title: 'Livraisons en cours', value: statusCounts.enCours, icon: Truck },
          { title: 'Livraisons terminees', value: statusCounts.terminees, icon: PackageCheck },
          { title: 'Commandes expediees', value: statusCounts.expediees, icon: ClipboardList },
          { title: 'Retards livraison', value: statusCounts.retards, icon: AlertTriangle },
          { title: 'Revenus livraison', value: '—', icon: Wallet },
        ].map((card) => (
          <div key={card.title} className="bg-beige-50 rounded-2xl p-5 border border-beige-300 shadow-beige">
            <div className="w-10 h-10 rounded-xl bg-beige-200 flex items-center justify-center mb-3">
              <card.icon className="w-5 h-5 text-beige-500" strokeWidth={1.5} />
            </div>
            {statsLoading ? (
              <div className="h-6 w-20 bg-beige-200 rounded-lg animate-pulse" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Commande, client, telephone, suivi"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          >
            <option value="">Statut livraison</option>
            {deliveryStatuses.map((status) => (
              <option key={status} value={status}>{statusLabels[status] ?? status}</option>
            ))}
          </select>
          <input
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            placeholder="Zone / ville"
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          />
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          />
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-6 mb-8">
        <div className="hidden lg:block bg-beige-50 border border-beige-300 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[0.9fr_1.3fr_0.9fr_0.8fr_0.7fr_1fr] gap-4 px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-widest border-b border-beige-300">
            <div>Commande</div>
            <div>Adresse livraison</div>
            <div>Livreur</div>
            <div>Statut</div>
            <div>Frais</div>
            <div>Actions</div>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-beige-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted">Aucune livraison disponible.</div>
          ) : (
            filtered.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[0.9fr_1.3fr_0.9fr_0.8fr_0.7fr_1fr] gap-4 px-5 py-4 border-b border-beige-200 hover:bg-beige-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{order.numero_commande}</p>
                  <p className="text-xs text-muted">{order.client?.nom_complet ?? order.nom_destinataire}</p>
                </div>
                <div>
                  <p className="text-sm text-ink">{order.adresse_livraison ?? '—'}</p>
                  <p className="text-xs text-muted">{order.telephone_livraison}</p>
                </div>
                <div className="text-xs text-muted">—</div>
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge(order.statut)}`}>
                    {order.statut_label}
                  </span>
                </div>
                <div className="text-sm font-semibold text-ink">—</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadOrderDetail(order.id)}
                    className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                    title="Voir details"
                  >
                    <PackageCheck className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                  </button>
                  <button
                    className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                    title="Modifier statut"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                  </button>
                  <button
                    className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                    title="Contacter client"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                  </button>
                  <button
                    className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                    title="Voir trajet"
                  >
                    <Route className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Details livraison</p>
              <h3 className="text-lg font-serif font-semibold text-ink">{selected?.numero_commande ?? '—'}</h3>
            </div>
            {selected && (
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge(selected.statut)}`}>
                {selected.statut_label}
              </span>
            )}
          </div>

          <div className="mt-4 space-y-4 text-sm">
            {!selected && !detailLoading && (
              <div className="bg-beige-100 rounded-xl p-3 border border-beige-300 text-xs text-muted">
                Selectionnez une livraison pour afficher les details.
              </div>
            )}
            {detailLoading && (
              <div className="h-24 bg-beige-200 rounded-xl animate-pulse" />
            )}
            {selected && !detailLoading && (
              <>
                <div className="bg-beige-100 rounded-xl p-3 border border-beige-300">
                  <p className="text-xs text-muted uppercase tracking-widest">Client</p>
                  <div className="mt-2 text-xs text-muted">
                    <p className="text-sm font-semibold text-ink">{selected.client?.nom_complet ?? selected.nom_destinataire}</p>
                    <p>{selected.telephone_livraison}</p>
                    <p>{selected.adresse_livraison}</p>
                  </div>
                </div>
                <div className="bg-beige-100 rounded-xl p-3 border border-beige-300">
                  <p className="text-xs text-muted uppercase tracking-widest">Commande</p>
                  <div className="mt-2 text-xs text-muted space-y-1">
                    <p className="text-sm font-semibold text-ink">{selected.numero_commande}</p>
                    <p>Montant total: {fmtMoney(selected.montant_total)} FCFA</p>
                    <p>Articles: {selected.nb_articles}</p>
                  </div>
                </div>
                <div className="bg-beige-100 rounded-xl p-3 border border-beige-300">
                  <p className="text-xs text-muted uppercase tracking-widest">Livraison</p>
                  <div className="mt-2 text-xs text-muted space-y-1">
                    <p>Mode: {selected.mode_livraison ?? '—'}</p>
                    <p>Date prevue: {selected.date_livraison_prevue ?? '—'}</p>
                    <p>Livreur: —</p>
                    <p>Numero suivi: —</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 mb-8">
        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Suivi livraison</p>
              <h3 className="text-lg font-serif font-semibold text-ink">Timeline statut</h3>
            </div>
            <ClipboardList className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="space-y-4">
            {timelineSteps.map((step, index) => {
              const isActive = selected ? deliveryStatuses.includes(selected.statut)
                ? deliveryStatuses.indexOf(selected.statut) >= index - 1
                : selected.statut === 'confirmee' && index === 0
                : false
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1 ${isActive ? 'bg-beige-500' : 'bg-beige-200'}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isActive ? 'text-ink' : 'text-muted'}`}>{step.label}</p>
                    <p className="text-xs text-muted">{isActive ? 'Etape atteinte' : 'En attente'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <ShippingSettingsCard settings={settings} onSaved={(s) => setSettings(s)} />
      </div>

      <div className="lg:hidden space-y-4">
        {filtered.map((order) => (
          <div key={order.id} className="bg-beige-50 border border-beige-300 rounded-2xl p-4 shadow-beige">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{order.numero_commande}</p>
                <p className="text-xs text-muted">{order.client?.nom_complet ?? order.nom_destinataire}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge(order.statut)}`}>
                {order.statut_label}
              </span>
            </div>
            <div className="mt-3 text-xs text-muted">
              <p>{order.adresse_livraison ?? '—'}</p>
              <p>{order.telephone_livraison}</p>
            </div>
            <button
              onClick={() => loadOrderDetail(order.id)}
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
            onClick={() => setPage((p) => { const next = Math.max(1, p - 1); loadOrders(next); return next })}
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
            onClick={() => setPage((p) => { const next = Math.min(lastPage, p + 1); loadOrders(next); return next })}
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
