import { useEffect, useState } from 'react'
import {
  TrendingUp, ShoppingCart, Users, DollarSign,
  Activity, RefreshCw, AlertTriangle, Package,
  TrendingDown,
} from 'lucide-react'
import { dashboardApi } from '@/api/admin/dashboard'
import type { DashboardData } from '@/types/admin'

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string | number
  sub?: string
  subPositive?: boolean
  icon: React.ElementType
  loading: boolean
}

function StatCard({ title, value, sub, subPositive, icon: Icon, loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-2">
            {title}
          </p>
          {loading ? (
            <div className="h-7 w-24 bg-stone-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-stone-900 truncate">{value}</p>
          )}
          {sub && !loading && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${
              subPositive ? 'text-emerald-600' : 'text-rose-500'
            }`}>
              {subPositive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              <span>{sub}</span>
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-stone-100 ml-3 flex-shrink-0">
          <Icon className="w-5 h-5 text-stone-600" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}

// ─── Order Status Badge ───────────────────────────────────────────────────────

interface OrderRowProps {
  label: string
  count: number
  color: string
}

function OrderRow({ label, count, color }: OrderRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-stone-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm text-stone-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-stone-900">{count}</span>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-stone-100 rounded animate-pulse ${className}`} />
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)

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
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-stone-900 mb-1">Erreur de chargement</h3>
          <p className="text-sm text-stone-500 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const ca = data?.overview?.chiffre_affaires_mois ?? 0
  const growthPct = data?.sales?.growth_percentage
  const isPositive = data?.sales?.is_positive_growth ?? true

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Tableau de bord</h1>
          <p className="text-sm text-stone-400 mt-0.5">Vue d'ensemble de la boutique</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-500
            hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Chiffre d'affaires (mois)"
          value={loading ? '—' : `${Math.round(ca).toLocaleString('fr-FR')} FCFA`}
          sub={growthPct != null
            ? `${isPositive ? '+' : ''}${growthPct}% vs mois dernier`
            : undefined}
          subPositive={isPositive}
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Commandes (mois)"
          value={loading ? '—' : (data?.orders?.total_month ?? 0)}
          sub={data?.orders?.pending
            ? `${data.orders.pending} en attente`
            : 'Aucune commande en attente'}
          subPositive={!data?.orders?.pending}
          icon={ShoppingCart}
          loading={loading}
        />
        <StatCard
          title="Total clients"
          value={loading ? '—' : (data?.overview?.total_clients ?? 0)}
          sub={data?.overview?.nouveaux_clients_mois
            ? `+${data.overview.nouveaux_clients_mois} ce mois`
            : undefined}
          subPositive
          icon={Users}
          loading={loading}
        />
      </div>

      {/* ── Contenu principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top produits */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
              Top Produits
            </h2>
            {!loading && (
              <span className="text-[11px] font-medium text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">
                {data?.popular_products?.length ?? 0} produits
              </span>
            )}
          </div>

          <div className="space-y-2">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-32 mb-1.5" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3.5 w-16" />
                </div>
              ))
            ) : data?.popular_products?.length ? (
              data.popular_products.slice(0, 5).map((product, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-stone-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{product.nom}</p>
                    <p className="text-xs text-stone-400 truncate">
                      {product.category ?? product.categorie ?? '—'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-emerald-600">
                      {product.ventes} vente{product.ventes > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-stone-400">
                      {Math.round(product.chiffre_affaires).toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-400 text-center py-8">Aucune vente récente</p>
            )}
          </div>
        </div>

        {/* État des commandes */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-5">
            <ShoppingCart className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
            État des Commandes
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between py-3 border-b border-stone-50">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          ) : data?.orders ? (
            <>
              <OrderRow label="En attente"       count={data.orders.pending}       color="bg-amber-400" />
              <OrderRow label="Confirmées"        count={data.orders.confirmed}     color="bg-blue-400" />
              <OrderRow label="En production"     count={data.orders.in_production} color="bg-violet-400" />
              <OrderRow label="Livrées (ce mois)" count={data.orders.completed}     color="bg-emerald-400" />
            </>
          ) : (
            <p className="text-sm text-stone-400 text-center py-8">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {/* ── Activité récente ── */}
      <div className="mt-6 bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-5">
          <Activity className="w-4 h-4 text-violet-500" strokeWidth={1.5} />
          Activité Récente
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-48 mb-1.5" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.recent_activities?.length ? (
          <div className="space-y-1">
            {data.recent_activities.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.type === 'commande' ? 'bg-blue-50' : 'bg-stone-100'
                }`}>
                  {item.type === 'commande'
                    ? <ShoppingCart className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
                    : <Users className="w-4 h-4 text-stone-500" strokeWidth={1.5} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{item.title}</p>
                  <p className="text-xs text-stone-400 truncate">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400 text-center py-6">Aucune activité récente</p>
        )}
      </div>
    </div>
  )
}
