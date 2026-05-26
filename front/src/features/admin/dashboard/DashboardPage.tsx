import { useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown, ShoppingCart, Users, DollarSign,
  Activity, RefreshCw, AlertTriangle, Package, Clock,
  Bell, Search,
} from 'lucide-react'
import { dashboardApi } from '@/api/admin/dashboard'
import { useAdminAuthStore } from '@/store/adminAuthStore'
import type { DashboardData } from '@/types/admin'

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  title:       string
  value:       string | number
  sub?:        string
  subPositive?: boolean
  icon:        React.ElementType
  iconBg:      string
  iconColor:   string
  loading:     boolean
}

function StatCard({ title, value, sub, subPositive, icon: Icon, iconBg, iconColor, loading }: StatCardProps) {
  return (
    <div className="bg-beige-50 rounded-2xl p-5 border border-beige-300 shadow-beige hover:shadow-beige-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.5} />
        </div>
        {sub && !loading && (
          <div className={`flex items-center gap-1 text-xs font-medium ${subPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
            {subPositive
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            <span>{sub}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-7 w-28 bg-beige-200 rounded-lg animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-bold text-ink truncate">{value}</p>
      )}

      <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mt-1.5">{title}</p>
    </div>
  )
}

// ─── Order Status Row ─────────────────────────────────────────────────────────

interface OrderRowProps {
  label: string
  count: number
  total: number
  dotColor: string
  barColor: string
}

function OrderRow({ label, count, total, dotColor, barColor }: OrderRowProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
          <span className="text-sm text-muted">{label}</span>
        </div>
        <span className="text-sm font-semibold text-ink">{count}</span>
      </div>
      <div className="h-1.5 bg-beige-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-beige-200 rounded-lg animate-pulse ${className}`} />
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [data,    setData]    = useState<DashboardData | null>(null)

  const { user } = useAdminAuthStore()

  const firstName = user?.name?.split(' ')[0] ?? 'Admin'

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashRes, quickRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getQuickStats(),
      ])
      setData({ ...dashRes.data.data, quickStats: quickRes.data.data })
    } catch {
      setError('Impossible de charger les données du tableau de bord.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // ── Erreur ──
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
            className="px-5 py-2.5 bg-beige-500 text-white text-xs font-semibold rounded-xl
              hover:bg-beige-400 transition-colors shadow-beige"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const ca         = data?.overview?.chiffre_affaires_mois ?? 0
  const growthPct  = data?.sales?.growth_percentage
  const isPositive = data?.sales?.is_positive_growth ?? true

  const totalOrders = (data?.orders?.pending ?? 0)
    + (data?.orders?.confirmed ?? 0)
    + (data?.orders?.in_production ?? 0)
    + (data?.orders?.completed ?? 0)

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-sm text-muted mt-1">
            Voici un aperçu de votre boutique aujourd'hui.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher…"
              className="pl-8 pr-3 py-2 text-xs bg-beige-50 border border-beige-300 rounded-xl
                text-ink placeholder:text-muted/60
                focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400
                w-40 transition-all"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2.5 bg-beige-50 border border-beige-300 rounded-xl
            hover:bg-beige-200 transition-colors">
            <Bell className="w-4 h-4 text-muted" strokeWidth={1.5} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-beige-500 rounded-full" />
          </button>

          {/* Date */}
          <span className="hidden md:inline-block text-xs font-medium text-muted
            bg-beige-50 border border-beige-300 rounded-xl px-3 py-2 whitespace-nowrap">
            {todayLabel}
          </span>

          {/* Actualiser */}
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted
              bg-beige-50 border border-beige-300 rounded-xl
              hover:bg-beige-200 hover:text-ink
              transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Chiffre d'affaires"
          value={loading ? '—' : `${Math.round(ca).toLocaleString('fr-FR')} F`}
          sub={growthPct != null ? `${isPositive ? '+' : ''}${growthPct}% ce mois` : undefined}
          subPositive={isPositive}
          icon={DollarSign}
          iconBg="bg-beige-200"
          iconColor="text-beige-500"
          loading={loading}
        />
        <StatCard
          title="Commandes ce mois"
          value={loading ? '—' : (data?.orders?.total_month ?? 0)}
          sub={data?.orders?.pending ? `${data.orders.pending} en attente` : undefined}
          subPositive={false}
          icon={ShoppingCart}
          iconBg="bg-sky-50"
          iconColor="text-sky-500"
          loading={loading}
        />
        <StatCard
          title="Total clients"
          value={loading ? '—' : (data?.overview?.total_clients ?? 0)}
          sub={data?.overview?.nouveaux_clients_mois ? `+${data.overview.nouveaux_clients_mois} nouveaux` : undefined}
          subPositive
          icon={Users}
          iconBg="bg-sage/30"
          iconColor="text-emerald-600"
          loading={loading}
        />
        <StatCard
          title="Livrées ce mois"
          value={loading ? '—' : (data?.orders?.completed ?? 0)}
          icon={Package}
          iconBg="bg-beige-300"
          iconColor="text-beige-500"
          loading={loading}
        />
      </div>

      {/* ── Contenu principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Top produits (col-span-2) */}
        <div className="lg:col-span-2 bg-beige-50 rounded-2xl border border-beige-300 shadow-beige p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
              Top Produits
            </h2>
            {!loading && (
              <span className="text-[11px] font-semibold text-beige-500 bg-beige-200 px-2.5 py-1 rounded-full">
                {data?.popular_products?.length ?? 0} produits
              </span>
            )}
          </div>

          <div className="space-y-1">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-36 mb-1.5" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : data?.popular_products?.length ? (
              data.popular_products.slice(0, 5).map((product, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-beige-100 transition-colors"
                >
                  <div className="w-9 h-9 bg-beige-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{product.nom}</p>
                    <p className="text-xs text-muted truncate">
                      {product.category ?? product.categorie ?? '—'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-emerald-600">
                      {product.ventes} vente{product.ventes > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted">
                      {Math.round(product.chiffre_affaires).toLocaleString('fr-FR')} F
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted text-center py-10">Aucune vente récente</p>
            )}
          </div>
        </div>

        {/* État des commandes (col-span-1) */}
        <div className="bg-beige-50 rounded-2xl border border-beige-300 shadow-beige p-6">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            État des commandes
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3.5 w-6" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : data?.orders ? (
            <div className="space-y-1">
              <OrderRow
                label="En attente"
                count={data.orders.pending}
                total={totalOrders}
                dotColor="bg-amber-400"
                barColor="bg-amber-400"
              />
              <OrderRow
                label="Confirmées"
                count={data.orders.confirmed}
                total={totalOrders}
                dotColor="bg-sky-400"
                barColor="bg-sky-400"
              />
              <OrderRow
                label="En production"
                count={data.orders.in_production}
                total={totalOrders}
                dotColor="bg-violet-400"
                barColor="bg-violet-400"
              />
              <OrderRow
                label="Livrées"
                count={data.orders.completed}
                total={totalOrders}
                dotColor="bg-sage"
                barColor="bg-sage"
              />
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-8">Aucune donnée disponible</p>
          )}

          {!loading && data?.orders && (
            <div className="mt-5 pt-4 border-t border-beige-300 flex items-center justify-between">
              <span className="text-xs text-muted">Total</span>
              <span className="text-sm font-bold text-ink">{totalOrders} commandes</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Activité récente ── */}
      <div className="bg-beige-50 rounded-2xl border border-beige-300 shadow-beige p-6">
        <h2 className="text-sm font-semibold text-ink flex items-center gap-2 mb-5">
          <Activity className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          Activité récente
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-52 mb-1.5" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.recent_activities?.length ? (
          <div className="space-y-1">
            {data.recent_activities.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-beige-100 transition-colors"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.type === 'commande' ? 'bg-sky-50' : 'bg-beige-200'
                }`}>
                  {item.type === 'commande'
                    ? <ShoppingCart className="w-4 h-4 text-sky-500" strokeWidth={1.5} />
                    : <Users className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{item.title}</p>
                  <p className="text-xs text-muted truncate">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted text-center py-8">Aucune activité récente</p>
        )}
      </div>
    </div>
  )
}
