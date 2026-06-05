import { useEffect, useMemo, useState } from 'react'
import {
  Star, AlertTriangle, BarChart3, Search, Filter, MessageSquare,
  CheckCircle2, Trash2, Flag, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { avisAdminApi } from '@/api/admin/avis'
import type {
  AdminReviewDetail,
  AdminReviewListItem,
  AdminReviewOptions,
  AdminReviewStats,
} from '@/types/admin'

const formatStars = (value: number) => Array.from({ length: 5 }, (_, i) => i < value)

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewListItem[]>([])
  const [stats, setStats] = useState<AdminReviewStats | null>(null)
  const [options, setOptions] = useState<AdminReviewOptions | null>(null)
  const [selected, setSelected] = useState<AdminReviewDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [noteFilter, setNoteFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const res = await avisAdminApi.stats()
      setStats(res.data.data)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadOptions = async () => {
    try {
      const res = await avisAdminApi.options()
      setOptions(res.data.data)
    } catch {
      setOptions(null)
    }
  }

  const loadReviews = async (nextPage: number = page) => {
    setLoading(true)
    try {
      const noteValue = noteFilter ? Number(noteFilter) : undefined
      const res = await avisAdminApi.list({
        page: nextPage,
        per_page: 12,
        search: search || undefined,
        statut: statusFilter || undefined,
        note_min: noteValue,
        note_max: noteValue,
        produit_id: productFilter ? Number(productFilter) : undefined,
        date_debut: dateStart || undefined,
        date_fin: dateEnd || undefined,
      })
      setReviews(res.data.data.avis)
      setLastPage(res.data.data.pagination.last_page || 1)
    } finally {
      setLoading(false)
    }
  }

  const loadReviewDetail = async (reviewId: number) => {
    setDetailLoading(true)
    try {
      const res = await avisAdminApi.show(reviewId)
      setSelected(res.data.data.avis)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    loadReviews(1)
    loadStats()
    loadOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      loadReviews(1)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, noteFilter, productFilter, dateStart, dateEnd])

  useEffect(() => {
    if (!reviews.length) {
      setSelected(null)
      return
    }
    if (selected && reviews.some((item) => item.id === selected.id)) return
    loadReviewDetail(reviews[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews])

  const handleModerate = async (review: AdminReviewListItem, action: 'approuver' | 'rejeter' | 'masquer') => {
    let raison: string | undefined
    if (action === 'rejeter') {
      const reasonInput = window.prompt('Raison du rejet')
      if (!reasonInput) return
      raison = reasonInput
    }
    setActionLoadingId(review.id)
    try {
      await avisAdminApi.moderer(review.id, { action, raison })
      await Promise.all([loadReviews(page), loadStats()])
      await loadReviewDetail(review.id)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReply = async (review: AdminReviewListItem) => {
    const responseText = window.prompt('Votre reponse (min 10 caracteres)')
    if (!responseText || responseText.trim().length < 10) return
    setActionLoadingId(review.id)
    try {
      await avisAdminApi.repondre(review.id, { reponse: responseText })
      await Promise.all([loadReviews(page), loadStats()])
      await loadReviewDetail(review.id)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (review: AdminReviewListItem) => {
    if (!window.confirm('Supprimer cet avis ?')) return
    setActionLoadingId(review.id)
    try {
      await avisAdminApi.remove(review.id)
      await Promise.all([loadReviews(page), loadStats()])
    } finally {
      setActionLoadingId(null)
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
          <h1 className="text-2xl font-serif font-bold text-ink">Gestion des avis clients</h1>
          <p className="text-sm text-muted mt-1">Consultez et moderez les avis et retours des clients.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button disabled className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted flex items-center gap-2 cursor-not-allowed">
            <Star className="w-3.5 h-3.5" strokeWidth={1.5} />
            Avis recents
          </button>
          <button disabled className="px-3.5 py-2.5 rounded-xl bg-blush/30 border border-blush text-xs font-semibold text-rose-600 flex items-center gap-2 cursor-not-allowed">
            <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
            Avis signales
          </button>
          <button disabled className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted flex items-center gap-2 cursor-not-allowed">
            <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Satisfaction clients
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { title: 'Total avis', value: stats ? String(stats.total_avis) : '—' },
          { title: 'Note moyenne', value: stats ? String(stats.note_moyenne_globale) : '—' },
          { title: 'Avis positifs', value: stats ? String(stats.avis_approuves) : '—' },
          { title: 'Avis en attente', value: stats ? String(stats.avis_en_attente) : '—' },
          { title: 'Photos client', value: stats ? String(stats.avis_avec_photos) : '—' },
        ].map((card) => (
          <div key={card.title} className="bg-beige-50 rounded-2xl p-5 border border-beige-300 shadow-beige">
            <div className="w-10 h-10 rounded-xl bg-beige-200 flex items-center justify-center mb-3">
              <Star className="w-5 h-5 text-beige-500" strokeWidth={1.5} />
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
          Filtres & recherche
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Client, produit, commentaire"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          >
            <option value="">Statut</option>
            {options?.statuts.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <select
            value={noteFilter}
            onChange={(e) => setNoteFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          >
            <option value="">Note</option>
            {options?.notes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
          >
            <option value="">Produit</option>
            {options?.produits.map((item) => (
              <option key={item.id} value={item.id}>{item.nom}</option>
            ))}
          </select>
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
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-beige-200 rounded-2xl animate-pulse" />
            ))
          ) : reviews.length === 0 ? (
            <div className="bg-beige-50 border border-beige-300 rounded-2xl p-6 text-sm text-muted">
              Aucun avis disponible.
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{review.client?.nom_complet ?? '—'}</p>
                    <p className="text-xs text-muted">{review.created_at} · {review.produit?.nom ?? '—'}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-beige-200 text-muted">
                    {review.statut_label}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {formatStars(review.note_globale).map((on, idx) => (
                    <Star key={idx} className={`w-4 h-4 ${on ? 'text-amber-500' : 'text-beige-300'}`} fill={on ? 'currentColor' : 'none'} strokeWidth={1.3} />
                  ))}
                </div>
                <p className="mt-3 text-sm text-ink">{review.commentaire}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => loadReviewDetail(review.id)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 text-muted hover:bg-beige-200"
                  >
                    Voir details
                  </button>
                  <button
                    onClick={() => handleModerate(review, 'approuver')}
                    disabled={actionLoadingId === review.id}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-beige-500 text-white hover:bg-beige-400 disabled:opacity-50"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => handleReply(review)}
                    disabled={actionLoadingId === review.id}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 text-muted hover:bg-beige-200 disabled:opacity-50"
                  >
                    Repondre
                  </button>
                  <button
                    onClick={() => handleModerate(review, 'masquer')}
                    disabled={actionLoadingId === review.id}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 text-muted hover:bg-beige-200 disabled:opacity-50"
                  >
                    Signaler
                  </button>
                  <button
                    onClick={() => handleDelete(review)}
                    disabled={actionLoadingId === review.id}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-blush/60 text-rose-600 hover:bg-blush/20 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Detail avis</p>
              <h3 className="text-lg font-serif font-semibold text-ink">{selected?.client?.nom_complet ?? '—'}</h3>
            </div>
            <MessageSquare className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="mt-4 space-y-4 text-sm">
            {!selected && !detailLoading && (
              <div className="bg-beige-100 rounded-xl p-3 border border-beige-300 text-xs text-muted">
                Selectionnez un avis pour afficher les details.
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
                    <p className="text-sm font-semibold text-ink">{selected.client?.nom_complet ?? '—'}</p>
                    <p>{selected.client_detaille?.telephone ?? '—'}</p>
                    <p>{selected.client_detaille?.email ?? '—'}</p>
                  </div>
                </div>
                <div className="bg-beige-100 rounded-xl p-3 border border-beige-300">
                  <p className="text-xs text-muted uppercase tracking-widest">Avis</p>
                  <div className="mt-2 text-xs text-muted space-y-1">
                    <p className="text-sm font-semibold text-ink">{selected.produit?.nom ?? '—'}</p>
                    <p>Note globale: {selected.note_globale}/5</p>
                    <p>{selected.commentaire}</p>
                    {selected.reponse_boutique && (
                      <p className="text-xs text-beige-500">Reponse: {selected.reponse_boutique}</p>
                    )}
                  </div>
                </div>
                <div className="bg-beige-100 rounded-xl p-3 border border-beige-300">
                  <p className="text-xs text-muted uppercase tracking-widest">Moderation</p>
                  <div className="mt-2 text-xs text-muted space-y-1">
                    <p>Statut: {selected.statut_label}</p>
                    <p>Verifie: {selected.avis_verifie ? 'Oui' : 'Non'}</p>
                    <p>Mise en avant: {selected.est_mis_en_avant ? 'Oui' : 'Non'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleModerate(selected, 'approuver')}
                    disabled={actionLoadingId === selected.id}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-beige-500 text-white hover:bg-beige-400 disabled:opacity-50"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => handleModerate(selected, 'rejeter')}
                    disabled={actionLoadingId === selected.id}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 text-muted hover:bg-beige-200 disabled:opacity-50"
                  >
                    Rejeter
                  </button>
                  <button
                    onClick={() => handleReply(selected)}
                    disabled={actionLoadingId === selected.id}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 text-muted hover:bg-beige-200 disabled:opacity-50"
                  >
                    Repondre
                  </button>
                  <button
                    onClick={() => handleDelete(selected)}
                    disabled={actionLoadingId === selected.id}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-blush/60 text-rose-600 hover:bg-blush/20 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Satisfaction</p>
              <h3 className="text-lg font-serif font-semibold text-ink">Produits mieux notes</h3>
            </div>
            <CheckCircle2 className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="space-y-3 text-sm text-muted">
            {(stats?.produits_les_mieux_notes ?? []).map((prod) => (
              <div key={prod.id} className="flex items-center justify-between bg-beige-100 rounded-xl border border-beige-300 px-3 py-2">
                <span className="text-ink">{prod.nom}</span>
                <span>{prod.note_moyenne} / 5</span>
              </div>
            ))}
            {(!stats?.produits_les_mieux_notes || stats.produits_les_mieux_notes.length === 0) && (
              <div className="text-xs text-muted">Aucune donnee disponible.</div>
            )}
          </div>
        </div>

        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Clients actifs</p>
              <h3 className="text-lg font-serif font-semibold text-ink">Top avis clients</h3>
            </div>
            <Flag className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="space-y-3 text-sm text-muted">
            {(stats?.clients_plus_actifs ?? []).map((client) => (
              <div key={client.id} className="flex items-center justify-between bg-beige-100 rounded-xl border border-beige-300 px-3 py-2">
                <span className="text-ink">{client.nom} {client.prenom}</span>
                <span>{client.avis_clients_count} avis</span>
              </div>
            ))}
            {(!stats?.clients_plus_actifs || stats.clients_plus_actifs.length === 0) && (
              <div className="text-xs text-muted">Aucune donnee disponible.</div>
            )}
          </div>
        </div>
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => { const next = Math.max(1, p - 1); loadReviews(next); return next })}
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
                onClick={() => { setPage(p as number); loadReviews(p as number) }}
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
            onClick={() => setPage((p) => { const next = Math.min(lastPage, p + 1); loadReviews(next); return next })}
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
