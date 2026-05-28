import { useEffect, useMemo, useState } from 'react'
import {
  Download, Calendar, TrendingUp, ShoppingBag, Users, Boxes, BarChart3,
  LineChart, PieChart, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { rapportsAdminApi } from '@/api/admin/rapports'
import type {
  AdminReportAnalytics,
  AdminReportCatalog,
  AdminReportClients,
  AdminReportCommandes,
  AdminReportDashboard,
  AdminReportFinancier,
  AdminReportProduits,
  AdminReportVentes,
} from '@/types/admin'
import { fmtMoney } from '@/features/admin/orders/orderHelpers'

export default function ReportsPage() {
  const [catalog, setCatalog] = useState<AdminReportCatalog | null>(null)
  const [dashboard, setDashboard] = useState<AdminReportDashboard | null>(null)
  const [ventes, setVentes] = useState<AdminReportVentes | null>(null)
  const [produits, setProduits] = useState<AdminReportProduits | null>(null)
  const [clients, setClients] = useState<AdminReportClients | null>(null)
  const [financier, setFinancier] = useState<AdminReportFinancier | null>(null)
  const [commandes, setCommandes] = useState<AdminReportCommandes | null>(null)
  const [analytics, setAnalytics] = useState<AdminReportAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('30_jours')
  const [exporting, setExporting] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [catalogRes, dashRes, ventesRes, produitsRes, clientsRes, financierRes, commandesRes, analyticsRes] = await Promise.all([
        rapportsAdminApi.catalog(),
        rapportsAdminApi.dashboard(),
        rapportsAdminApi.ventes({ periode: period, group_by: 'day' }),
        rapportsAdminApi.produits({ periode: period, limit: 8 }),
        rapportsAdminApi.clients({ periode: period }),
        rapportsAdminApi.financier({ periode: period }),
        rapportsAdminApi.commandes({ periode: period }),
        rapportsAdminApi.analytics({ periode: period }),
      ])
      setCatalog(catalogRes.data.data)
      setDashboard(dashRes.data.data)
      setVentes(ventesRes.data.data)
      setProduits(produitsRes.data.data)
      setClients(clientsRes.data.data)
      setFinancier(financierRes.data.data)
      setCommandes(commandesRes.data.data)
      setAnalytics(analyticsRes.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setExporting(true)
    try {
      const res = await rapportsAdminApi.export({ type: 'ventes', format, periode: period })
      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport_ventes_${period}.${format === 'excel' ? 'xlsx' : format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const growthLabel = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

  const revenueChart = ventes?.graphique_data ?? { labels: [], chiffre_affaires: [], nombre_commandes: [], panier_moyen: [] }

  const paymentMethods = financier?.paiements_par_methode ?? []

  const topProducts = produits?.produits ?? []

  const cities = clients?.repartition_villes ?? []

  const orderStatuses = commandes?.commandes_par_statut ?? []

  const activePeriodLabel = catalog?.periodes_disponibles?.[period] ?? 'Periode'

  const revenueMax = Math.max(...(revenueChart.chiffre_affaires.length ? revenueChart.chiffre_affaires : [0]))

  const paymentMax = Math.max(...(paymentMethods.length ? paymentMethods.map((item) => item.total_montant) : [0]))

  const statusMax = Math.max(...(orderStatuses.length ? orderStatuses.map((item) => item.montant_total) : [0]))

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Rapports & analyses</h1>
          <p className="text-sm text-muted mt-1">Analysez les performances et revenus de votre boutique.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={exporting}
            onClick={() => handleExport('pdf')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Export PDF
          </button>
          <button
            disabled={exporting}
            onClick={() => handleExport('excel')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted hover:bg-beige-200 transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Rapport mensuel
          </button>
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted">
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent outline-none"
            >
              {catalog?.periodes_disponibles
                ? Object.entries(catalog.periodes_disponibles).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))
                : <option value="30_jours">30 jours</option>
              }
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          {
            title: 'Revenus totaux',
            value: dashboard ? `${fmtMoney(dashboard.ca_ce_mois)} FCFA` : '—',
            delta: dashboard ? growthLabel(dashboard.evolution_ca) : null,
            icon: TrendingUp,
          },
          {
            title: 'Commandes totales',
            value: dashboard ? String(dashboard.commandes_ce_mois) : '—',
            delta: dashboard ? growthLabel(dashboard.evolution_commandes) : null,
            icon: ShoppingBag,
          },
          {
            title: 'Clients actifs',
            value: dashboard ? String(dashboard.nouveaux_clients) : '—',
            delta: dashboard ? growthLabel(dashboard.evolution_clients) : null,
            icon: Users,
          },
          {
            title: 'Panier moyen',
            value: dashboard ? `${fmtMoney(dashboard.panier_moyen)} FCFA` : '—',
            delta: dashboard ? growthLabel(dashboard.evolution_panier) : null,
            icon: Boxes,
          },
          {
            title: 'Periode',
            value: activePeriodLabel,
            delta: null,
            icon: LineChart,
          },
        ].map((card) => (
          <div key={card.title} className="bg-beige-50 rounded-2xl p-5 border border-beige-300 shadow-beige">
            <div className="w-10 h-10 rounded-xl bg-beige-200 flex items-center justify-center mb-3">
              <card.icon className="w-5 h-5 text-beige-500" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold text-ink">{card.value}</p>
            {card.delta && (
              <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${card.delta.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {card.delta.startsWith('+') ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {card.delta}
              </p>
            )}
            <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mt-2">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6 mb-8">
        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Revenus mensuels</p>
              <h3 className="text-lg font-serif font-semibold text-ink">Evolution des ventes</h3>
            </div>
            <LineChart className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="h-44 bg-beige-100 rounded-2xl border border-beige-300 flex items-end gap-2 p-4">
            {loading && <div className="text-xs text-muted">Chargement...</div>}
            {!loading && revenueChart.labels.length === 0 && (
              <div className="text-xs text-muted">Aucune donnee disponible.</div>
            )}
            {!loading && revenueChart.labels.map((label, index) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-lg bg-beige-500/80"
                  style={{ height: revenueMax > 0 ? `${Math.max(8, (revenueChart.chiffre_affaires[index] / revenueMax) * 120)}px` : '8px' }}
                />
                <span className="text-[10px] text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Methodes paiement</p>
              <h3 className="text-lg font-serif font-semibold text-ink">Popularite</h3>
            </div>
            <PieChart className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="space-y-3 text-sm text-muted">
            {paymentMethods.map((item) => (
              <div key={item.methode_paiement} className="flex items-center justify-between bg-beige-100 rounded-xl border border-beige-300 px-3 py-2">
                <span className="text-ink">{item.methode_paiement}</span>
                <span>{fmtMoney(item.total_montant)} FCFA</span>
              </div>
            ))}
            {paymentMethods.length === 0 && <div className="text-xs text-muted">Aucune donnee disponible.</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 mb-8">
        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Produits populaires</p>
              <h3 className="text-lg font-serif font-semibold text-ink">Top ventes</h3>
            </div>
            <ShoppingBag className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="space-y-3">
            {topProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between bg-beige-100 rounded-xl border border-beige-300 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{product.nom}</p>
                  <p className="text-xs text-muted">{product.categorie}</p>
                </div>
                <div className="text-xs text-muted text-right">
                  <p>{product.total_vendu} ventes</p>
                  <p>{fmtMoney(product.chiffre_affaires)} FCFA</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <div className="text-xs text-muted">Aucun produit sur la periode.</div>}
          </div>
        </div>

        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Commandes</p>
              <h3 className="text-lg font-serif font-semibold text-ink">Par statut</h3>
            </div>
            <BarChart3 className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="space-y-3">
            {orderStatuses.map((item) => (
              <div key={item.statut} className="flex items-center gap-3">
                <div className="w-24 text-xs text-muted">{item.statut}</div>
                <div className="flex-1 h-2 bg-beige-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-beige-500"
                    style={{ width: statusMax > 0 ? `${(item.montant_total / statusMax) * 100}%` : '0%' }}
                  />
                </div>
                <div className="text-xs text-muted">{item.nombre_commandes}</div>
              </div>
            ))}
            {orderStatuses.length === 0 && <div className="text-xs text-muted">Aucune donnee disponible.</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Analyse clients</p>
              <h3 className="text-lg font-serif font-semibold text-ink">Repartition geographique</h3>
            </div>
            <Users className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="space-y-3">
            {cities.map((city) => (
              <div key={city.ville ?? 'indefini'} className="flex items-center justify-between bg-beige-100 rounded-xl border border-beige-300 px-3 py-2">
                <span className="text-sm text-ink">{city.ville ?? 'Non renseigne'}</span>
                <span className="text-xs text-muted">{city.nombre_commandes} commandes</span>
              </div>
            ))}
            {cities.length === 0 && <div className="text-xs text-muted">Aucune donnee disponible.</div>}
          </div>
        </div>

        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Analyse clients</p>
              <h3 className="text-lg font-serif font-semibold text-ink">Comportement</h3>
            </div>
            <Users className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="space-y-2 text-sm text-muted">
            <p>Clients actifs: {analytics ? analytics.clients_actifs : '—'}</p>
            <p>Nouveaux clients: {analytics ? analytics.nouveaux_clients : '—'}</p>
            <p>Sessions estimees: {analytics ? analytics.sessions_estimees : '—'}</p>
            <p>Taux conversion: {analytics ? `${analytics.taux_conversion}%` : '—'}</p>
            <p>Panier moyen: {analytics ? `${analytics.analyse_comportement.articles_moyen_panier} articles` : '—'}</p>
          </div>
        </div>
      </div>

      <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-widest">Export rapports</p>
            <h3 className="text-lg font-serif font-semibold text-ink">Fichiers disponibles</h3>
          </div>
          <Download className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={exporting}
            onClick={() => handleExport('pdf')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 transition-colors disabled:opacity-60"
          >
            Export PDF
          </button>
          <button
            disabled={exporting}
            onClick={() => handleExport('excel')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted hover:bg-beige-200 transition-colors disabled:opacity-60"
          >
            Export Excel
          </button>
          <button
            disabled={exporting}
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted hover:bg-beige-200 transition-colors disabled:opacity-60"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}
