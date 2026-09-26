import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Gift, Pencil, Power, Search, Trash2, X, Package } from 'lucide-react'
import {
  offresCadeauxAdminApi,
  type AdminOffreCadeau,
  type OffreCadeauPayload,
  type RaisonIndisponibilite,
} from '@/api/admin/offresCadeaux'
import { produitsAdminApi } from '@/api/admin/products'
import { fmtMoney } from '@/features/admin/orders/orderHelpers'

const RAISONS: Record<RaisonIndisponibilite, string> = {
  inactive: 'Inactive',
  programmee: 'Programmée',
  expiree: 'Expirée',
  produit_indisponible: 'Produit masqué ou supprimé',
  rupture_cadeau: 'Cadeau en rupture — offre suspendue',
}

interface PickedProduit {
  id: number
  nom: string
  prix: number
  image: string | null
  variantes?: Record<string, Record<string, number>> | null
}

function errorMessage(err: unknown): string {
  const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
  const first = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
  return first ?? data?.message ?? 'Une erreur est survenue.'
}

/* ── Sélecteur de produit avec recherche ── */
function ProduitPicker({ label, value, onChange }: {
  label: string
  value: PickedProduit | null
  onChange: (p: PickedProduit | null) => void
}) {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['admin-offre-cadeau-produits', debounced],
    queryFn: () => produitsAdminApi.list({ search: debounced, per_page: 8 }).then((r) => r.data.data.produits),
    enabled: !value && debounced.length >= 2,
  })

  return (
    <div>
      <label className="block text-xs font-semibold text-ink mb-1.5">{label}</label>
      {value ? (
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-beige-300 bg-beige-50">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-beige-200 flex items-center justify-center flex-shrink-0">
            {value.image
              ? <img src={value.image} alt={value.nom} className="w-full h-full object-cover" />
              : <Package className="w-4 h-4 text-beige-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{value.nom}</p>
            <p className="text-xs text-muted">{fmtMoney(value.prix)} FCFA</p>
          </div>
          <button type="button" onClick={() => onChange(null)} className="p-1.5 rounded-lg text-muted hover:bg-beige-200" aria-label="Changer de produit">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit (2 lettres min.)"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-beige-300 bg-white text-sm focus:outline-none focus:border-beige-500"
          />
          {debounced.length >= 2 && (
            <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-beige-300 bg-white shadow-lg">
              {isFetching && <p className="px-3 py-2 text-xs text-muted">Recherche…</p>}
              {!isFetching && results.length === 0 && <p className="px-3 py-2 text-xs text-muted">Aucun produit trouvé.</p>}
              {results.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    onChange({ id: p.id, nom: p.nom, prix: p.prix, image: p.image_principale, variantes: p.couleur_tailles_stock })
                    setSearch('')
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-beige-50"
                >
                  <span className="truncate">{p.nom}</span>
                  <span className="text-xs text-muted flex-shrink-0">{fmtMoney(p.prix)} F · stock {p.stock_disponible}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Formulaire création / édition ── */
function OffreFormModal({ offre, onClose, onSaved }: {
  offre: AdminOffreCadeau | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const [declencheur, setDeclencheur] = useState<PickedProduit | null>(
    offre?.declencheur ? { ...offre.declencheur } : null,
  )
  const [cadeau, setCadeau] = useState<PickedProduit | null>(
    offre?.cadeau ? { ...offre.cadeau } : null,
  )
  const [form, setForm] = useState({
    quantite_declencheur: offre?.quantite_declencheur ?? 1,
    quantite_offerte: offre?.quantite_offerte ?? 1,
    couleur_offerte: offre?.couleur_offerte ?? '',
    taille_offerte: offre?.taille_offerte ?? '',
    est_active: offre?.est_active ?? true,
    date_debut: offre?.date_debut ?? '',
    date_fin: offre?.date_fin ?? '',
  })
  const [error, setError] = useState('')

  // En édition, on recharge les variantes du cadeau pour proposer couleur / taille.
  const cadeauId = cadeau?.id
  const { data: cadeauDetail } = useQuery({
    queryKey: ['admin-produit', cadeauId],
    queryFn: () => produitsAdminApi.show(cadeauId!).then((r) => r.data.data.produit),
    enabled: cadeauId != null && cadeau?.variantes === undefined,
  })
  const variantes = cadeau?.variantes ?? cadeauDetail?.couleur_tailles_stock ?? null
  const couleurs = useMemo(() => Object.keys(variantes ?? {}), [variantes])
  const tailles = useMemo(
    () => (form.couleur_offerte && variantes?.[form.couleur_offerte] ? Object.keys(variantes[form.couleur_offerte]) : []),
    [variantes, form.couleur_offerte],
  )

  const mutation = useMutation({
    mutationFn: (payload: OffreCadeauPayload) =>
      offre ? offresCadeauxAdminApi.update(offre.id, payload) : offresCadeauxAdminApi.create(payload),
    onSuccess: (res) => onSaved(res.data.message),
    onError: (err) => setError(errorMessage(err)),
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!declencheur || !cadeau) {
      setError('Choisissez le produit à acheter et le produit offert.')
      return
    }
    if (couleurs.length > 0 && (!form.couleur_offerte || !form.taille_offerte)) {
      setError('Ce cadeau a des variantes : choisissez la couleur et la taille offertes.')
      return
    }
    mutation.mutate({
      produit_declencheur_id: declencheur.id,
      produit_offert_id: cadeau.id,
      quantite_declencheur: Number(form.quantite_declencheur) || 1,
      quantite_offerte: Number(form.quantite_offerte) || 1,
      couleur_offerte: form.couleur_offerte || null,
      taille_offerte: form.taille_offerte || null,
      est_active: form.est_active,
      date_debut: form.date_debut || null,
      date_fin: form.date_fin || null,
    })
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-beige-300 bg-white text-sm focus:outline-none focus:border-beige-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-ink flex items-center gap-2">
            <Gift className="w-5 h-5 text-beige-500" />
            {offre ? 'Modifier l\'offre cadeau' : 'Nouvelle offre cadeau'}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-beige-100" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ProduitPicker label="Produit acheté (déclencheur)" value={declencheur} onChange={setDeclencheur} />
        <ProduitPicker
          label="Produit offert (cadeau)"
          value={cadeau}
          onChange={(p) => {
            setCadeau(p)
            setForm((f) => ({ ...f, couleur_offerte: '', taille_offerte: '' }))
          }}
        />

        {cadeau && (
          <p className="text-xs text-muted bg-beige-50 border border-beige-200 rounded-xl px-3 py-2">
            Valeur du cadeau : <strong className="text-ink">{fmtMoney(cadeau.prix)} FCFA</strong> (prix catalogue) —
            prix appliqué au panier : <strong className="text-ink">0 FCFA</strong>
          </p>
        )}

        {couleurs.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Couleur offerte</label>
              <select
                value={form.couleur_offerte}
                onChange={(e) => setForm((f) => ({ ...f, couleur_offerte: e.target.value, taille_offerte: '' }))}
                className={inputCls}
              >
                <option value="">Choisir…</option>
                {couleurs.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Taille offerte</label>
              <select
                value={form.taille_offerte}
                onChange={(e) => setForm((f) => ({ ...f, taille_offerte: e.target.value }))}
                className={inputCls}
                disabled={!form.couleur_offerte}
              >
                <option value="">Choisir…</option>
                {tailles.map((t) => (
                  <option key={t} value={t}>{t} (stock {variantes?.[form.couleur_offerte]?.[t] ?? 0})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Quantité à acheter</label>
            <input type="number" min={1} max={100} value={form.quantite_declencheur}
              onChange={(e) => setForm((f) => ({ ...f, quantite_declencheur: Number(e.target.value) }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Quantité offerte</label>
            <input type="number" min={1} max={100} value={form.quantite_offerte}
              onChange={(e) => setForm((f) => ({ ...f, quantite_offerte: Number(e.target.value) }))} className={inputCls} />
          </div>
        </div>
        <p className="text-xs text-muted -mt-2">
          Pour {form.quantite_declencheur || 1} acheté{(form.quantite_declencheur || 1) > 1 ? 's' : ''}, {form.quantite_offerte || 1} offert{(form.quantite_offerte || 1) > 1 ? 's' : ''} — le cadeau se multiplie avec la quantité achetée.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Début (optionnel)</label>
            <input type="date" value={form.date_debut} onChange={(e) => setForm((f) => ({ ...f, date_debut: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Fin (optionnel)</label>
            <input type="date" value={form.date_fin} onChange={(e) => setForm((f) => ({ ...f, date_fin: e.target.value }))} className={inputCls} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.est_active} onChange={(e) => setForm((f) => ({ ...f, est_active: e.target.checked }))} />
          Offre active
        </label>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-beige-300 text-sm font-semibold text-muted hover:bg-beige-100">
            Annuler
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="px-4 py-2.5 rounded-xl bg-beige-500 text-white text-sm font-semibold hover:bg-beige-400 disabled:opacity-60">
            {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Liste des offres ── */
export function OffresCadeauxPanel({ onToast }: { onToast: (message: string, type?: 'success' | 'error') => void }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<AdminOffreCadeau | null | 'new'>(null)

  const { data: offres = [], isLoading } = useQuery({
    queryKey: ['admin-offres-cadeaux'],
    queryFn: () => offresCadeauxAdminApi.list().then((r) => r.data.data.offres),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-offres-cadeaux'] })

  const toggle = useMutation({
    mutationFn: (id: number) => offresCadeauxAdminApi.toggleStatus(id),
    onSuccess: (res) => { onToast(res.data.message); refresh() },
    onError: (err) => onToast(errorMessage(err), 'error'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => offresCadeauxAdminApi.delete(id),
    onSuccess: (res) => { onToast(res.data.message); refresh() },
    onError: (err) => onToast(errorMessage(err), 'error'),
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <p className="text-sm text-muted">
          Un produit acheté donne droit à un produit offert, ajouté automatiquement au panier à 0 F.
          Une offre dont le cadeau est en rupture est suspendue automatiquement.
        </p>
        <button
          onClick={() => setEditing('new')}
          className="px-3.5 py-2.5 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <Gift className="w-3.5 h-3.5" strokeWidth={2} />
          Nouvelle offre cadeau
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : offres.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-beige-300 rounded-2xl">
          <Gift className="w-8 h-8 text-beige-400 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-muted">Aucune offre cadeau pour l'instant.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offres.map((o) => (
            <div key={o.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-2xl border border-beige-300 bg-white">
              <div className="flex-1 min-w-0 text-sm text-ink">
                <p>
                  Acheter <strong>{o.quantite_declencheur > 1 ? `${o.quantite_declencheur} × ` : ''}{o.declencheur?.nom ?? '—'}</strong>
                  {' → '}recevoir <strong>{o.quantite_offerte > 1 ? `${o.quantite_offerte} × ` : ''}{o.cadeau?.nom ?? '—'}</strong>
                  {(o.couleur_offerte || o.taille_offerte) && (
                    <span className="text-muted"> ({[o.couleur_offerte, o.taille_offerte].filter(Boolean).join(' · ')})</span>
                  )}
                </p>
                <p className="text-xs text-muted mt-1">
                  Valeur {fmtMoney((o.cadeau?.prix ?? 0) * o.quantite_offerte)} FCFA · stock cadeau {o.stock_cadeau ?? 'illimité'}
                  {(o.date_debut || o.date_fin) && ` · ${o.date_debut ?? '…'} → ${o.date_fin ?? '…'}`}
                </p>
              </div>
              <span className={`self-start md:self-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                o.disponible ? 'bg-green-100 text-green-700' : 'bg-beige-200 text-muted'
              }`}>
                {o.disponible ? 'En ligne' : RAISONS[o.raison_indisponibilite ?? 'inactive']}
              </span>
              <div className="flex gap-1.5">
                <button onClick={() => setEditing(o)} className="p-2 rounded-lg text-muted hover:bg-beige-100" aria-label="Modifier">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => toggle.mutate(o.id)} className="p-2 rounded-lg text-muted hover:bg-beige-100"
                  aria-label={o.est_active ? 'Désactiver' : 'Activer'}>
                  <Power className={`w-4 h-4 ${o.est_active ? 'text-green-600' : ''}`} />
                </button>
                <button
                  onClick={() => { if (window.confirm('Supprimer cette offre cadeau ?')) remove.mutate(o.id) }}
                  className="p-2 rounded-lg text-muted hover:bg-red-50 hover:text-red-600" aria-label="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <OffreFormModal
          offre={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => { setEditing(null); onToast(message); refresh() }}
        />
      )}
    </div>
  )
}
