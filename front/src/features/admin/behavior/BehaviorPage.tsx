import { useEffect, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
} from 'recharts'
import {
  Users, Eye, ShoppingCart, CreditCard, CheckCircle2, RefreshCw,
  Search, AlertTriangle, TrendingDown, Filter, Package, XCircle,
} from 'lucide-react'
import { rapportsAdminApi, type ComportementReport } from '@/api/admin/rapports'

const PERIODS: { id: string; label: string }[] = [
  { id: '7_jours',       label: '7 jours' },
  { id: '30_jours',      label: '30 jours' },
  { id: 'mois_actuel',   label: 'Ce mois' },
  { id: 'mois_precedent',label: 'Mois dernier' },
]

function fmt(n: number) { return n.toLocaleString('fr-FR') }

function KpiCard({ label, value, icon: Icon, tone }: {
  label: string; value: number; icon: React.ElementType; tone: string
}) {
  return (
    <div className="bg-beige-50 rounded-2xl p-4 border border-beige-300 shadow-beige">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${tone}`}>
        <Icon className="w-4 h-4" strokeWidth={1.5} />
      </div>
      <p className="text-2xl font-bold text-ink leading-none">{fmt(value)}</p>
      <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mt-1.5">{label}</p>
    </div>
  )
}

function Card({ title, subtitle, icon: Icon, children, hint }: {
  title: string; subtitle?: string; icon?: React.ElementType; children: React.ReactNode; hint?: string
}) {
  return (
    <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
      <div className="flex items-start justify-between mb-1">
        <div>
          {subtitle && <p className="text-[11px] font-semibold text-muted uppercase tracking-widest">{subtitle}</p>}
          <h3 className="text-base font-serif font-semibold text-ink mt-0.5">{title}</h3>
        </div>
        {Icon && <Icon className="w-4 h-4 text-beige-500 flex-shrink-0 mt-1" strokeWidth={1.5} />}
      </div>
      {hint && <p className="text-[11.5px] text-muted mb-4 leading-relaxed">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </div>
  )
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted">
      <Package className="w-7 h-7 mb-2 opacity-30" strokeWidth={1.5} />
      <p className="text-xs text-center max-w-xs">{msg}</p>
    </div>
  )
}

/* ── Entonnoir de conversion ─────────────────────────────────────────── */
function Funnel({ data }: { data: ComportementReport['entonnoir'] }) {
  const max = Math.max(...data.map(d => d.valeur), 1)
  const colors = ['#7B9EC4', '#C9A98A', '#D4A94A', '#D89B72', '#6EAB8B']

  return (
    <div className="space-y-3">
      {data.map((step, i) => {
        const widthPct = Math.max((step.valeur / max) * 100, 2)
        const drop = step.taux_depuis_precedent
        const bigDrop = drop != null && drop < 40
        return (
          <div key={step.etape}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12.5px] font-semibold text-ink">{step.etape}</span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-ink tabular-nums">{fmt(step.valeur)}</span>
                {drop != null && (
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    bigDrop ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {drop}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-7 bg-beige-200 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all flex items-center px-2"
                style={{ width: `${widthPct}%`, backgroundColor: colors[i] }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function BehaviorPage() {
  const [period, setPeriod] = useState('30_jours')
  const [data, setData] = useState<ComportementReport | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await rapportsAdminApi.comportement({ periode: period })
      setData(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Comportement & conversion</h1>
          <p className="text-sm text-muted mt-1">
            Où vos visiteurs abandonnent, et ce qui les fait acheter. Données internes fiables (indépendantes de Google Analytics).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-beige-100 border border-beige-300 rounded-xl p-1">
            {PERIODS.map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  period === p.id ? 'bg-beige-500 text-white' : 'text-muted hover:text-ink'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="p-2.5 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 text-muted ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-6 h-6 text-beige-400 animate-spin" strokeWidth={1.5} />
        </div>
      ) : !data ? (
        <Empty msg="Impossible de charger les données." />
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard label="Visiteurs" value={data.resume.visiteurs_uniques} icon={Users} tone="bg-blue-100 text-blue-600" />
            <KpiCard label="Vues produit" value={data.resume.vues_produits} icon={Eye} tone="bg-violet-100 text-violet-600" />
            <KpiCard label="Ajouts panier" value={data.resume.ajouts_panier} icon={ShoppingCart} tone="bg-amber-100 text-amber-600" />
            <KpiCard label="Débuts paiement" value={data.resume.debuts_paiement} icon={CreditCard} tone="bg-orange-100 text-orange-600" />
            <KpiCard label="Achats" value={data.resume.achats} icon={CheckCircle2} tone="bg-emerald-100 text-emerald-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entonnoir */}
            <Card
              title="Entonnoir de conversion"
              subtitle="Le plus important"
              icon={Filter}
              hint="Chaque étape et le % de visiteurs qui passent à la suivante. Une chute forte (badge rouge) = c'est là qu'il faut agir."
            >
              {data.entonnoir.every(e => e.valeur === 0)
                ? <Empty msg="Pas encore assez de données. Les statistiques se remplissent au fil des visites." />
                : <Funnel data={data.entonnoir} />}
            </Card>

            {/* Top catégories */}
            <Card
              title="Catégories les plus visitées"
              subtitle="Intérêt"
              icon={TrendingDown}
              hint="Ce qui attire le plus vos visiteurs — utile pour savoir quoi mettre en avant et quoi réapprovisionner."
            >
              {data.top_categories.length === 0
                ? <Empty msg="Aucune vue de catégorie sur la période." />
                : (
                  <ResponsiveContainer width="100%" height={Math.max(data.top_categories.length * 38, 120)}>
                    <BarChart data={data.top_categories} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6D8CA" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#8B7355' }} />
                      <YAxis type="category" dataKey="nom" width={110} tick={{ fontSize: 11, fill: '#1A1A1A' }} />
                      <Tooltip cursor={{ fill: 'rgba(201,169,138,.1)' }} />
                      <Bar dataKey="vues" fill="#C9A98A" radius={[0, 6, 6, 0]} name="Vues" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </Card>
          </div>

          {/* Produits : vus vs achetés */}
          <Card
            title="Produits : vus vs achetés"
            subtitle="Où sont les blocages"
            icon={Eye}
            hint="Un produit très vu mais peu acheté (taux faible, en rouge) a un problème : prix, photos, ou confiance. C'est là qu'un ajustement rapporte le plus."
          >
            {data.produits_performance.length === 0
              ? <Empty msg="Pas encore de vues produit enregistrées sur la période." />
              : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-semibold text-muted uppercase tracking-widest border-b border-beige-300">
                        <th className="py-2 px-2">Produit</th>
                        <th className="py-2 px-2 text-right">Vues</th>
                        <th className="py-2 px-2 text-right">Panier</th>
                        <th className="py-2 px-2 text-right">Achats</th>
                        <th className="py-2 px-2 text-right">Conversion</th>
                        <th className="py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.produits_performance.map(p => {
                        const faible = p.vues >= 10 && p.taux_conversion < 2
                        return (
                          <tr key={p.produit_id} className="border-b border-beige-200 last:border-0">
                            <td className="py-2.5 px-2 font-medium text-ink max-w-[220px] truncate">{p.nom}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-ink-2">{fmt(p.vues)}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-ink-2">{fmt(p.ajouts_panier)}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-ink-2">{fmt(p.achats)}</td>
                            <td className={`py-2.5 px-2 text-right tabular-nums font-semibold ${
                              faible ? 'text-rose-600' : p.taux_conversion >= 5 ? 'text-emerald-600' : 'text-ink'
                            }`}>
                              {p.taux_conversion}%
                            </td>
                            <td className="py-2.5 px-2">
                              {faible && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                  <AlertTriangle className="w-3 h-3" /> À revoir
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recherches fréquentes */}
            <Card
              title="Recherches les plus fréquentes"
              subtitle="Demande"
              icon={Search}
              hint="Ce que vos visiteurs tapent dans la recherche — la demande réelle, mot pour mot."
            >
              {data.recherches_frequentes.length === 0
                ? <Empty msg="Aucune recherche enregistrée sur la période." />
                : (
                  <div className="space-y-1.5">
                    {data.recherches_frequentes.map((r, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-beige-100 rounded-lg">
                        <span className="text-[13px] text-ink truncate">{r.terme}</span>
                        <span className="text-[12px] font-bold text-beige-600 tabular-nums flex-shrink-0 ml-2">{r.total}×</span>
                      </div>
                    ))}
                  </div>
                )}
            </Card>

            {/* Recherches sans aucun résultat */}
            <Card
              title="Cherché mais pas trouvé"
              subtitle="Opportunités"
              icon={XCircle}
              hint="Recherches qui n'ont renvoyé aucun résultat : des articles que vos clients veulent mais que vous ne vendez pas encore. À envisager d'ajouter au catalogue."
            >
              {data.recherches_sans_resultat.length === 0
                ? <Empty msg="Rien ici — vos visiteurs trouvent ce qu'ils cherchent." />
                : (
                  <div className="space-y-1.5">
                    {data.recherches_sans_resultat.map((r, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg">
                        <span className="text-[13px] text-ink truncate">{r.terme}</span>
                        <span className="text-[12px] font-bold text-rose-500 tabular-nums flex-shrink-0 ml-2">{r.total}×</span>
                      </div>
                    ))}
                  </div>
                )}
            </Card>
          </div>

          {/* Échecs de paiement */}
          {data.echecs_paiement.length > 0 && (
            <Card
              title="Échecs de paiement"
              subtitle="Technique"
              icon={CreditCard}
              hint="Des clients qui voulaient payer mais ont échoué. Si le nombre est élevé, le problème est technique (fournisseur de paiement), pas commercial — de l'argent perdu récupérable."
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.echecs_paiement.map((e, i) => (
                  <div key={i} className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                    <p className="text-xl font-bold text-rose-600 leading-none">{e.total}</p>
                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mt-1.5 capitalize">{e.methode}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
