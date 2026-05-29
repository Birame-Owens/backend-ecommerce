import { useEffect, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts'
import {
  Download, Calendar, TrendingUp, TrendingDown, ShoppingBag, Users,
  Boxes, BarChart3, Package, CreditCard, MapPin, Palette, Shirt,
  Eye, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Activity,
} from 'lucide-react'
import { rapportsAdminApi } from '@/api/admin/rapports'
import type {
  AdminReportAnalytics,
  AdminReportCatalog,
  AdminReportClients,
  AdminReportCommandes,
  AdminReportDashboard,
  AdminReportFinancier,
  AdminReportPerformanceProduits,
  AdminReportProduits,
  AdminReportVentes,
} from '@/types/admin'
import { fmtMoney } from '@/features/admin/orders/orderHelpers'

type TabId = 'ventes' | 'produits' | 'clients' | 'commandes' | 'financier'

const PALETTE = ['#C9A98A', '#6EAB8B', '#7B9EC4', '#E8888A', '#D4A94A', '#9B7EC4', '#D89B72', '#A0C4A0', '#E8C4A0', '#B68A64']

const STATUS_COLORS: Record<string, string> = {
  nouvelle: '#7B9EC4',
  confirmee: '#C9A98A',
  en_preparation: '#D4A94A',
  prete: '#9B7EC4',
  livree: '#6EAB8B',
  annulee: '#E8888A',
}

function ChartTip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-beige-50 border border-beige-300 rounded-xl px-3 py-2 shadow-beige text-xs">
      {label && <p className="font-semibold text-ink mb-1.5">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 mt-0.5" style={{ color: p.color || '#8B7355' }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <strong>{fmt ? fmt(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function EmptyState({ message = 'Aucune donnée disponible.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-10 text-muted">
      <BarChart3 className="w-8 h-8 mb-2 opacity-30" strokeWidth={1.5} />
      <p className="text-xs">{message}</p>
    </div>
  )
}

function Skeleton() {
  return <div className="h-full bg-beige-200 rounded-xl animate-pulse" />
}

function KpiCard({
  label, value, delta, icon: Icon, color,
}: { label: string; value: string; delta?: number | null; icon: React.ElementType; color: string }) {
  const positive = (delta ?? 0) >= 0
  return (
    <div className="bg-beige-50 rounded-2xl p-5 border border-beige-300 shadow-beige">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5 text-beige-600" strokeWidth={1.5} />
      </div>
      <p className="text-2xl font-bold text-ink leading-tight">{value}</p>
      {delta != null && (
        <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {positive ? '+' : ''}{delta.toFixed(1)}% vs mois préc.
        </p>
      )}
      <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mt-1">{label}</p>
    </div>
  )
}

function ChartCard({ title, subtitle, icon: Icon, children }: {
  title: string; subtitle?: string; icon?: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
      <div className="flex items-center justify-between mb-4">
        <div>
          {subtitle && <p className="text-[11px] font-semibold text-muted uppercase tracking-widest">{subtitle}</p>}
          <h3 className="text-base font-serif font-semibold text-ink mt-0.5">{title}</h3>
        </div>
        {Icon && <Icon className="w-4 h-4 text-beige-500 flex-shrink-0" strokeWidth={1.5} />}
      </div>
      {children}
    </div>
  )
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'ventes',    label: 'Ventes',    icon: TrendingUp   },
  { id: 'produits',  label: 'Produits',  icon: Package      },
  { id: 'clients',   label: 'Clients',   icon: Users        },
  { id: 'commandes', label: 'Commandes', icon: ShoppingBag  },
  { id: 'financier', label: 'Financier', icon: CreditCard   },
]

export default function ReportsPage() {
  const [tab, setTab] = useState<TabId>('ventes')
  const [period, setPeriod] = useState('30_jours')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [catalog,     setCatalog]     = useState<AdminReportCatalog | null>(null)
  const [dashboard,   setDashboard]   = useState<AdminReportDashboard | null>(null)
  const [ventes,      setVentes]      = useState<AdminReportVentes | null>(null)
  const [produits,    setProduits]    = useState<AdminReportProduits | null>(null)
  const [performance, setPerformance] = useState<AdminReportPerformanceProduits | null>(null)
  const [clients,     setClients]     = useState<AdminReportClients | null>(null)
  const [financier,   setFinancier]   = useState<AdminReportFinancier | null>(null)
  const [commandes,   setCommandes]   = useState<AdminReportCommandes | null>(null)
  const [analytics,   setAnalytics]   = useState<AdminReportAnalytics | null>(null)

  const groupBy = ['annee_actuelle', '12_mois'].includes(period) ? 'month' : 'day'

  const loadAll = async () => {
    setLoading(true)
    try {
      const [cRes, dRes, vRes, prRes, peRes, clRes, fiRes, coRes, anRes] = await Promise.all([
        rapportsAdminApi.catalog(),
        rapportsAdminApi.dashboard(),
        rapportsAdminApi.ventes({ periode: period, group_by: groupBy }),
        rapportsAdminApi.produits({ periode: period, limit: 10 }),
        rapportsAdminApi.performanceProduits({ periode: period }),
        rapportsAdminApi.clients({ periode: period }),
        rapportsAdminApi.financier({ periode: period }),
        rapportsAdminApi.commandes({ periode: period }),
        rapportsAdminApi.analytics({ periode: period }),
      ])
      setCatalog(cRes.data.data)
      setDashboard(dRes.data.data)
      setVentes(vRes.data.data)
      setProduits(prRes.data.data)
      setPerformance(peRes.data.data)
      setClients(clRes.data.data)
      setFinancier(fiRes.data.data)
      setCommandes(coRes.data.data)
      setAnalytics(anRes.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setExporting(true)
    try {
      const res = await rapportsAdminApi.export({ type: 'ventes', format, periode: period })
      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport_ventes_${period}.${format === 'excel' ? 'xlsx' : format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  // ── Data transforms ──────────────────────────────────────────────────────
  const salesData = ventes?.ventes.map(v => ({
    date:      v.periode,
    ca:        Number(v.chiffre_affaires),
    commandes: Number(v.nombre_commandes),
    panier:    Number(v.panier_moyen),
  })) ?? []

  const topProduitsData = (produits?.produits ?? []).slice(0, 10).map(p => ({
    name:    p.nom.length > 22 ? p.nom.slice(0, 22) + '…' : p.nom,
    vendu:   Number(p.total_vendu),
    ca:      Number(p.chiffre_affaires),
  }))

  const categoriesData = (produits?.categories ?? []).map((c, i) => ({
    name:  c.categorie,
    value: Number(c.chiffre_affaires),
    color: PALETTE[i % PALETTE.length],
  }))

  const topClientsData = (clients?.top_clients ?? []).slice(0, 8).map(c => ({
    name:   `${c.prenom} ${c.nom}`.trim().slice(0, 18),
    depense: Number(c.total_depense),
    commandes: Number(c.nombre_commandes),
  }))

  const citiesData = (clients?.repartition_villes ?? []).slice(0, 8).map((c, i) => ({
    name:  c.ville ?? 'Non renseigné',
    commandes: Number(c.nombre_commandes),
    ca:    Number(c.chiffre_affaires),
    color: PALETTE[i % PALETTE.length],
  }))

  const commandesStatutData = (commandes?.commandes_par_statut ?? []).map((s, i) => ({
    name:  s.statut,
    value: Number(s.nombre_commandes),
    color: STATUS_COLORS[s.statut] ?? PALETTE[i % PALETTE.length],
  }))

  const commandesEvolutionData = (commandes?.evolution_quotidienne ?? []).map(e => ({
    date:      e.date,
    commandes: Number(e.nombre_commandes),
    montant:   Number(e.montant_total),
  }))

  const paymentData = (financier?.paiements_par_methode ?? []).map((p, i) => ({
    name:  p.methode_paiement,
    value: Number(p.total_montant),
    tx:    Number(p.nombre_transactions),
    color: PALETTE[i % PALETTE.length],
  }))

  const financierEvolutionData = (financier?.evolution_quotidienne ?? []).map(e => ({
    date: e.date,
    ca:   Number(e.chiffre_affaires),
    tx:   Number(e.nombre_paiements),
  }))

  const couleursData = (performance?.top_couleurs ?? []).map(c => ({
    name:  c.couleur,
    value: Number(c.total_vendus),
  }))

  const taillesData = (performance?.top_tailles ?? []).map(t => ({
    name:  t.taille,
    value: Number(t.total_vendus),
  }))

  const prodPerf = (performance?.produits_performance ?? []).slice(0, 10)

  // ── Custom Y-axis tick ────────────────────────────────────────────────────
  const fmtAxis = (v: number) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Rapports & Business Intelligence</h1>
          <p className="text-sm text-muted mt-1">Analysez les performances, tendances et revenus de votre boutique.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted">
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-transparent outline-none">
              {catalog?.periodes_disponibles
                ? Object.entries(catalog.periodes_disponibles).map(([key, label]) => (
                    <option key={key} value={key}>{label as string}</option>
                  ))
                : <>
                    <option value="7_jours">7 jours</option>
                    <option value="30_jours">30 jours</option>
                    <option value="mois_actuel">Mois actuel</option>
                    <option value="annee_actuelle">Année</option>
                  </>
              }
            </select>
          </div>
          <button onClick={() => loadAll()} disabled={loading}
            className="p-2.5 rounded-xl bg-beige-50 border border-beige-300 hover:bg-beige-200 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 text-muted ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
          <button disabled={exporting} onClick={() => handleExport('excel')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted hover:bg-beige-200 flex items-center gap-2 disabled:opacity-60">
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            Excel
          </button>
          <button disabled={exporting} onClick={() => handleExport('pdf')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 flex items-center gap-2 disabled:opacity-60">
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            PDF
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Chiffre d'affaires" value={dashboard ? `${fmtMoney(dashboard.ca_ce_mois)} F` : '—'}
          delta={dashboard?.evolution_ca} icon={TrendingUp} color="bg-beige-200" />
        <KpiCard label="Commandes" value={dashboard ? String(dashboard.commandes_ce_mois) : '—'}
          delta={dashboard?.evolution_commandes} icon={ShoppingBag} color="bg-amber-100" />
        <KpiCard label="Nouveaux clients" value={dashboard ? String(dashboard.nouveaux_clients) : '—'}
          delta={dashboard?.evolution_clients} icon={Users} color="bg-sky-50" />
        <KpiCard label="Panier moyen" value={dashboard ? `${fmtMoney(dashboard.panier_moyen)} F` : '—'}
          delta={dashboard?.evolution_panier} icon={Boxes} color="bg-sage/30" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-beige-100 border border-beige-300 rounded-2xl mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              tab === id
                ? 'bg-beige-50 text-ink shadow-beige border border-beige-300'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: VENTES ────────────────────────────────────────────────────── */}
      {tab === 'ventes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
            <ChartCard title="Évolution du chiffre d'affaires" subtitle="Revenus" icon={TrendingUp}>
              <div className="h-64">
                {loading ? <Skeleton /> : salesData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9A98A" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#C9A98A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} width={48} />
                      <Tooltip content={<ChartTip fmt={(v: number) => `${fmtMoney(v)} F`} />} />
                      <Area type="monotone" dataKey="ca" name="CA" stroke="#C9A98A" strokeWidth={2.5} fill="url(#caGrad)" dot={false} activeDot={{ r: 4, fill: '#C9A98A' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Nombre de commandes" subtitle="Volume" icon={ShoppingBag}>
              <div className="h-64">
                {loading ? <Skeleton /> : salesData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="cmdGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6EAB8B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6EAB8B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} width={32} />
                      <Tooltip content={<ChartTip />} />
                      <Area type="monotone" dataKey="commandes" name="Commandes" stroke="#6EAB8B" strokeWidth={2.5} fill="url(#cmdGrad)" dot={false} activeDot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Panier moyen par période" subtitle="Comportement d'achat" icon={Boxes}>
            <div className="h-52">
              {loading ? <Skeleton /> : salesData.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} width={48} />
                    <Tooltip content={<ChartTip fmt={(v: number) => `${fmtMoney(v)} F`} />} />
                    <Bar dataKey="panier" name="Panier moyen" fill="#D4A94A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          {ventes?.totaux && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'CA total période', value: `${fmtMoney(ventes.totaux.total_ca)} FCFA` },
                { label: 'Total commandes', value: String(ventes.totaux.total_commandes) },
                { label: 'Panier moyen global', value: `${fmtMoney(ventes.totaux.panier_moyen_global)} FCFA` },
                { label: 'Clients uniques', value: String(ventes.totaux.total_clients_uniques) },
              ].map((s) => (
                <div key={s.label} className="bg-beige-100 border border-beige-300 rounded-xl px-4 py-3">
                  <p className="text-lg font-bold text-ink">{s.value}</p>
                  <p className="text-[11px] text-muted uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: PRODUITS ──────────────────────────────────────────────────── */}
      {tab === 'produits' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
            <ChartCard title="Top 10 produits les plus vendus" subtitle="Performance produits" icon={Package}>
              <div className="h-72">
                {loading ? <Skeleton /> : topProduitsData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProduitsData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6B5B4E' }} tickLine={false} axisLine={false} width={120} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="vendu" name="Qté vendue" fill="#C9A98A" radius={[0, 4, 4, 0]}>
                        {topProduitsData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="CA par catégorie" subtitle="Répartition" icon={BarChart3}>
              <div className="h-72">
                {loading ? <Skeleton /> : categoriesData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoriesData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        outerRadius={100} innerRadius={45}
                        label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                        labelLine={{ stroke: '#C9A98A', strokeWidth: 1 }}
                        stroke="none">
                        {categoriesData.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTip fmt={(v: number) => `${fmtMoney(v)} F`} />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard title="Top couleurs vendues" subtitle="Variants" icon={Palette}>
              <div className="h-52">
                {loading ? <Skeleton /> : couleursData.length === 0 ? <EmptyState message="Aucune donnée couleur disponible." /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={couleursData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} width={28} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="value" name="Qté vendue" radius={[4, 4, 0, 0]}>
                        {couleursData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Top tailles vendues" subtitle="Variants" icon={Shirt}>
              <div className="h-52">
                {loading ? <Skeleton /> : taillesData.length === 0 ? <EmptyState message="Aucune donnée taille disponible." /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taillesData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} width={28} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="value" name="Qté vendue" fill="#9B7EC4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Vues vs ventes — performance produits" subtitle="Taux de conversion" icon={Eye}>
            <div className="h-64">
              {loading ? <Skeleton /> : prodPerf.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prodPerf.map(p => ({ name: p.nom.slice(0, 18), vues: p.nombre_vues, ventes: p.ventes }))}
                    margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#8B7355' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} width={32} />
                    <Tooltip content={<ChartTip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="vues" name="Vues" fill="#7B9EC4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ventes" name="Ventes" fill="#C9A98A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </div>
      )}

      {/* ── TAB: CLIENTS ───────────────────────────────────────────────────── */}
      {tab === 'clients' && (
        <div className="space-y-6">
          {clients?.statistiques && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Nouveaux clients', value: String(clients.statistiques.total_nouveaux), icon: Users },
                { label: 'Clients actifs', value: String(clients.statistiques.total_actifs), icon: Activity },
                { label: 'Dépense moyenne', value: `${fmtMoney(clients.statistiques.ca_moyen_par_client)} F`, icon: TrendingUp },
              ].map((s) => (
                <div key={s.label} className="bg-beige-50 border border-beige-300 rounded-2xl px-4 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-beige-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <s.icon className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-ink">{s.value}</p>
                    <p className="text-[11px] text-muted uppercase tracking-widest">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
            <ChartCard title="Top 8 clients par dépenses" subtitle="Clients VIP" icon={Users}>
              <div className="h-64">
                {loading ? <Skeleton /> : topClientsData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topClientsData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D0" horizontal={false} />
                      <XAxis type="number" tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6B5B4E' }} tickLine={false} axisLine={false} width={100} />
                      <Tooltip content={<ChartTip fmt={(v: number) => `${fmtMoney(v)} F`} />} />
                      <Bar dataKey="depense" name="Dépenses" fill="#D89B72" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Commandes par ville" subtitle="Géographie" icon={MapPin}>
              <div className="h-64">
                {loading ? <Skeleton /> : citiesData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={citiesData} dataKey="commandes" nameKey="name"
                        cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                        label={({ name, percent }) => percent > 0.06 ? `${name}` : ''}
                        stroke="none">
                        {citiesData.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          {analytics?.analyse_comportement && (
            <ChartCard title="Comportement d'achat" subtitle="Panier & conversion" icon={ShoppingBag}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Total paniers', value: String(analytics.analyse_comportement.total_paniers) },
                  { label: 'Paniers transformés', value: String(analytics.analyse_comportement.paniers_transformes) },
                  { label: 'Taux abandon', value: `${analytics.analyse_comportement.taux_abandon}%` },
                  { label: 'Articles / panier', value: String(analytics.analyse_comportement.articles_moyen_panier) },
                ].map((s) => (
                  <div key={s.label} className="bg-beige-100 border border-beige-300 rounded-xl px-3 py-3">
                    <p className="text-lg font-bold text-ink">{s.value}</p>
                    <p className="text-[11px] text-muted uppercase tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          {(clients?.top_clients ?? []).length > 0 && (
            <ChartCard title="Détail top clients" subtitle="Tableau" icon={Users}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-beige-300">
                      {['Client', 'Ville', 'Commandes', 'Total dépensé', 'Panier moyen'].map(h => (
                        <th key={h} className="text-left text-[11px] font-semibold text-muted uppercase tracking-widest py-2 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(clients?.top_clients ?? []).slice(0, 8).map((c) => (
                      <tr key={c.id} className="border-b border-beige-200 hover:bg-beige-100 transition-colors">
                        <td className="py-2 pr-4 font-medium text-ink">{c.prenom} {c.nom}</td>
                        <td className="py-2 pr-4 text-muted">{c.ville ?? '—'}</td>
                        <td className="py-2 pr-4 text-muted">{c.nombre_commandes}</td>
                        <td className="py-2 pr-4 font-semibold text-ink">{fmtMoney(c.total_depense)} F</td>
                        <td className="py-2 pr-4 text-muted">{fmtMoney(c.panier_moyen)} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}
        </div>
      )}

      {/* ── TAB: COMMANDES ─────────────────────────────────────────────────── */}
      {tab === 'commandes' && (
        <div className="space-y-6">
          {commandes?.statistiques && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'Total commandes', value: String(commandes.statistiques.total_commandes) },
                { label: 'Montant total', value: `${fmtMoney(commandes.statistiques.montant_total)} F` },
                { label: 'Panier moyen', value: `${fmtMoney(commandes.statistiques.panier_moyen_global)} F` },
                { label: 'Urgentes', value: String(commandes.statistiques.commandes_urgentes) },
                { label: 'En retard', value: String(commandes.statistiques.commandes_en_retard) },
              ].map((s, i) => (
                <div key={s.label} className={`border rounded-xl px-3 py-3 ${i >= 3 ? 'bg-rose-50 border-blush/40' : 'bg-beige-100 border-beige-300'}`}>
                  <p className="text-lg font-bold text-ink">{s.value}</p>
                  <p className="text-[11px] text-muted uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
            <ChartCard title="Évolution quotidienne des commandes" subtitle="Volume" icon={Activity}>
              <div className="h-64">
                {loading ? <Skeleton /> : commandesEvolutionData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={commandesEvolutionData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="cmdEvGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7B9EC4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#7B9EC4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} width={32} />
                      <Tooltip content={<ChartTip />} />
                      <Area type="monotone" dataKey="commandes" name="Commandes" stroke="#7B9EC4" strokeWidth={2.5} fill="url(#cmdEvGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Répartition par statut" subtitle="Statuts" icon={BarChart3}>
              <div className="h-64">
                {loading ? <Skeleton /> : commandesStatutData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={commandesStatutData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" outerRadius={95} innerRadius={48}
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={{ stroke: '#C9A98A', strokeWidth: 1 }}
                        stroke="none">
                        {commandesStatutData.map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          {(commandes?.modes_livraison ?? []).length > 0 && (
            <ChartCard title="Modes de livraison" subtitle="Logistique" icon={ShoppingBag}>
              <div className="h-52">
                {loading ? <Skeleton /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(commandes?.modes_livraison ?? []).map(m => ({
                        name: m.mode_livraison ?? 'Non défini',
                        commandes: Number(m.nombre_commandes),
                        montant: Number(m.montant_total),
                      }))}
                      margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} width={32} />
                      <Tooltip content={<ChartTip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="commandes" name="Commandes" fill="#C9A98A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          )}
        </div>
      )}

      {/* ── TAB: FINANCIER ─────────────────────────────────────────────────── */}
      {tab === 'financier' && (
        <div className="space-y-6">
          {financier?.totaux && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'CA total', value: `${fmtMoney(financier.totaux.ca_total)} F` },
                { label: 'Nb transactions', value: String(financier.totaux.nombre_transactions) },
                { label: 'Ticket moyen', value: `${fmtMoney(financier.totaux.ticket_moyen)} F` },
                { label: 'Total impayé', value: `${fmtMoney(financier.totaux.total_impaye)} F` },
              ].map((s, i) => (
                <div key={s.label} className={`border rounded-xl px-3 py-3 ${i === 3 ? 'bg-rose-50 border-blush/40' : 'bg-beige-100 border-beige-300'}`}>
                  <p className="text-lg font-bold text-ink">{s.value}</p>
                  <p className="text-[11px] text-muted uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
            <ChartCard title="Évolution du CA journalier" subtitle="Financier" icon={TrendingUp}>
              <div className="h-64">
                {loading ? <Skeleton /> : financierEvolutionData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financierEvolutionData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6EAB8B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6EAB8B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={false} width={48} />
                      <Tooltip content={<ChartTip fmt={(v: number) => `${fmtMoney(v)} F`} />} />
                      <Area type="monotone" dataKey="ca" name="CA" stroke="#6EAB8B" strokeWidth={2.5} fill="url(#finGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Méthodes de paiement" subtitle="Répartition" icon={CreditCard}>
              <div className="h-64">
                {loading ? <Skeleton /> : paymentData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" outerRadius={95} innerRadius={48}
                        label={({ name, percent }) => percent > 0.06 ? `${(percent * 100).toFixed(0)}%` : ''}
                        stroke="none">
                        {paymentData.map((p, i) => <Cell key={i} fill={p.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTip fmt={(v: number) => `${fmtMoney(v)} F`} />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          {(financier?.commandes_non_payees ?? []).length > 0 && (
            <ChartCard title="Commandes non payées" subtitle="Créances" icon={AlertCircle}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-beige-300">
                      {['N° commande', 'Client', 'Montant', 'Date', 'Restant'].map(h => (
                        <th key={h} className="text-left text-[11px] font-semibold text-muted uppercase tracking-widest py-2 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(financier?.commandes_non_payees ?? []).slice(0, 10).map((c) => (
                      <tr key={c.numero_commande} className="border-b border-beige-200 hover:bg-beige-100">
                        <td className="py-2 pr-4 font-mono text-muted">{c.numero_commande}</td>
                        <td className="py-2 pr-4 text-ink">{c.nom_destinataire}</td>
                        <td className="py-2 pr-4 font-semibold text-ink">{fmtMoney(c.montant_total)} F</td>
                        <td className="py-2 pr-4 text-muted">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                        <td className="py-2 pr-4 text-rose-600 font-semibold">{fmtMoney(c.montant_restant)} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}

          <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest">Export rapports</p>
                <h3 className="text-base font-serif font-semibold text-ink mt-0.5">Fichiers</h3>
              </div>
              <Download className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['pdf', 'excel', 'csv'] as const).map((fmt) => (
                <button key={fmt} disabled={exporting} onClick={() => handleExport(fmt)}
                  className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted hover:bg-beige-200 flex items-center gap-2 disabled:opacity-60">
                  <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
