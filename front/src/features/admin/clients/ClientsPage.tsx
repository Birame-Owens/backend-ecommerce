import { useEffect, useMemo, useState } from 'react'
import {
  Bell, Download, Filter, Search, Users, Star, Mail, Phone, MessageCircle,
  Calendar, MapPin, ShieldCheck, Crown, Eye, Pencil, FileText, Trash2,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { clientsAdminApi } from '@/api/admin/clients'
import type {
  AdminClientDetail,
  AdminClientListItem,
  AdminClientStats,
} from '@/types/admin'
import { fmtMoney } from '@/features/admin/orders/orderHelpers'

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
        ? <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={1.5} />
        : <ShieldCheck className="w-4 h-4 text-rose-500 flex-shrink-0" strokeWidth={1.5} />
      }
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="ml-1 p-0.5 rounded hover:opacity-60 transition-opacity">
        <ShieldCheck className="w-3 h-3" strokeWidth={2} />
      </button>
    </div>
  )
}

function ClientBadge({ client }: { client: AdminClientListItem }) {
  const isVip = client.est_vip || client.type_client === 'vip'
  const isInactive = client.est_inactif
  const label = isVip ? 'VIP' : isInactive ? 'Inactif' : 'Actif'
  const cls = isVip
    ? 'bg-beige-500/20 text-beige-600'
    : isInactive
    ? 'bg-blush/30 text-rose-600'
    : 'bg-sage/30 text-emerald-700'

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cls}`}>
      {isVip && <Crown className="w-3 h-3" strokeWidth={1.5} />}
      {label}
    </span>
  )
}

function formatInitials(name: string) {
  const parts = name.trim().split(' ')
  if (parts.length === 0) return 'CL'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return `${first}${last}`.toUpperCase()
}

function parseDateValue(value: string | null | undefined) {
  if (!value) return null
  const [datePart] = value.split(' ')
  const [day, month, year] = datePart.split('/')
  if (!day || !month || !year) return null
  return new Date(Number(year), Number(month) - 1, Number(day)).getTime()
}

function toInputDate(value: string | null | undefined) {
  if (!value) return ''
  const [datePart] = value.split(' ')
  const [day, month, year] = datePart.split('/')
  if (!day || !month || !year) return ''
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function EditClientModal({
  client,
  loading,
  onClose,
  onSave,
}: {
  client: AdminClientDetail | null
  loading: boolean
  onClose: () => void
  onSave: (payload: Partial<AdminClientDetail>) => void
}) {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    genre: '',
    date_naissance: '',
    ville: '',
    quartier: '',
    adresse_principale: '',
    indications_livraison: '',
    taille_habituelle: '',
    couleurs_preferees: '',
    styles_preferes: '',
    budget_moyen: '',
    priorite: 'normale',
    accepte_whatsapp: false,
    accepte_email: false,
    accepte_sms: false,
    accepte_promotions: false,
    canaux_preferes: '',
    notes_privees: '',
  })

  useEffect(() => {
    if (!client) return
    setForm({
      nom: client.nom ?? '',
      prenom: client.prenom ?? '',
      telephone: client.telephone ?? '',
      email: client.email ?? '',
      genre: client.genre ?? '',
      date_naissance: toInputDate(client.date_naissance),
      ville: client.ville ?? '',
      quartier: client.quartier ?? '',
      adresse_principale: client.adresse_principale ?? '',
      indications_livraison: client.indications_livraison ?? '',
      taille_habituelle: client.taille_habituelle ?? '',
      couleurs_preferees: client.couleurs_preferees ?? '',
      styles_preferes: client.styles_preferes ?? '',
      budget_moyen: client.budget_moyen ? String(client.budget_moyen) : '',
      priorite: client.priorite ?? 'normale',
      accepte_whatsapp: Boolean(client.accepte_whatsapp),
      accepte_email: Boolean(client.accepte_email),
      accepte_sms: Boolean(client.accepte_sms),
      accepte_promotions: Boolean(client.accepte_promotions),
      canaux_preferes: client.canaux_preferes ?? '',
      notes_privees: client.notes_privees ?? '',
    })
  }, [client])

  if (!client && !loading) return null

  return (
    <div className="fixed inset-0 z-[140] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-beige-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-beige-300 shadow-beige-lg">
        <div className="p-6 border-b border-beige-300 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">Edition client</p>
            <h2 className="text-2xl font-serif font-bold text-ink mt-1">{client?.nom_complet ?? 'Client'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200">
            <Eye className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 bg-beige-200 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={form.nom}
                  onChange={(e) => setForm((prev) => ({ ...prev, nom: e.target.value }))}
                  placeholder="Nom"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
                />
                <input
                  value={form.prenom}
                  onChange={(e) => setForm((prev) => ({ ...prev, prenom: e.target.value }))}
                  placeholder="Prenom"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
                />
                <input
                  value={form.telephone}
                  onChange={(e) => setForm((prev) => ({ ...prev, telephone: e.target.value }))}
                  placeholder="Telephone"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
                />
                <input
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
                />
                <select
                  value={form.genre}
                  onChange={(e) => setForm((prev) => ({ ...prev, genre: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
                >
                  <option value="">Genre</option>
                  <option value="masculin">Masculin</option>
                  <option value="feminin">Feminin</option>
                  <option value="autre">Autre</option>
                </select>
                <input
                  type="date"
                  value={form.date_naissance}
                  onChange={(e) => setForm((prev) => ({ ...prev, date_naissance: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
                />
              </div>
              <input
                value={form.adresse_principale}
                onChange={(e) => setForm((prev) => ({ ...prev, adresse_principale: e.target.value }))}
                placeholder="Adresse principale"
                className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={form.ville}
                  onChange={(e) => setForm((prev) => ({ ...prev, ville: e.target.value }))}
                  placeholder="Ville"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
                />
                <input
                  value={form.quartier}
                  onChange={(e) => setForm((prev) => ({ ...prev, quartier: e.target.value }))}
                  placeholder="Quartier"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
                />
              </div>
              <input
                value={form.indications_livraison}
                onChange={(e) => setForm((prev) => ({ ...prev, indications_livraison: e.target.value }))}
                placeholder="Indications de livraison"
                className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={form.taille_habituelle}
                  onChange={(e) => setForm((prev) => ({ ...prev, taille_habituelle: e.target.value }))}
                  placeholder="Taille habituelle"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
                />
                <input
                  value={form.budget_moyen}
                  onChange={(e) => setForm((prev) => ({ ...prev, budget_moyen: e.target.value }))}
                  placeholder="Budget moyen"
                  type="number"
                  min={0}
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
                />
              </div>
              <input
                value={form.couleurs_preferees}
                onChange={(e) => setForm((prev) => ({ ...prev, couleurs_preferees: e.target.value }))}
                placeholder="Couleurs preferees"
                className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
              />
              <input
                value={form.styles_preferes}
                onChange={(e) => setForm((prev) => ({ ...prev, styles_preferes: e.target.value }))}
                placeholder="Styles preferes"
                className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
              />
              <input
                value={form.canaux_preferes}
                onChange={(e) => setForm((prev) => ({ ...prev, canaux_preferes: e.target.value }))}
                placeholder="Canaux preferes"
                className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
              />
              <textarea
                value={form.notes_privees}
                onChange={(e) => setForm((prev) => ({ ...prev, notes_privees: e.target.value }))}
                placeholder="Notes privees"
                className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink min-h-[120px]"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={form.priorite}
                  onChange={(e) => setForm((prev) => ({ ...prev, priorite: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
                >
                  <option value="normale">Priorite normale</option>
                  <option value="haute">Priorite haute</option>
                  <option value="vip">Priorite VIP</option>
                </select>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={form.accepte_whatsapp}
                      onChange={(e) => setForm((prev) => ({ ...prev, accepte_whatsapp: e.target.checked }))}
                      className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                    />
                    WhatsApp
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={form.accepte_email}
                      onChange={(e) => setForm((prev) => ({ ...prev, accepte_email: e.target.checked }))}
                      className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={form.accepte_sms}
                      onChange={(e) => setForm((prev) => ({ ...prev, accepte_sms: e.target.checked }))}
                      className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                    />
                    SMS
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={form.accepte_promotions}
                      onChange={(e) => setForm((prev) => ({ ...prev, accepte_promotions: e.target.checked }))}
                      className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                    />
                    Promotions
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 pb-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-beige-300 text-muted hover:bg-beige-200"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave({
              nom: form.nom.trim(),
              prenom: form.prenom.trim(),
              telephone: form.telephone.trim(),
              email: form.email.trim() || null,
              genre: form.genre || null,
              date_naissance: form.date_naissance || null,
              ville: form.ville.trim(),
              quartier: form.quartier.trim() || null,
              adresse_principale: form.adresse_principale.trim() || null,
              indications_livraison: form.indications_livraison.trim() || null,
              taille_habituelle: form.taille_habituelle.trim() || null,
              couleurs_preferees: form.couleurs_preferees.trim() || null,
              styles_preferes: form.styles_preferes.trim() || null,
              budget_moyen: form.budget_moyen ? Number(form.budget_moyen) : null,
              priorite: form.priorite,
              accepte_whatsapp: form.accepte_whatsapp,
              accepte_email: form.accepte_email,
              accepte_sms: form.accepte_sms,
              accepte_promotions: form.accepte_promotions,
              canaux_preferes: form.canaux_preferes.trim() || null,
              notes_privees: form.notes_privees.trim() || null,
            })}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-beige-500 text-white hover:bg-beige-400"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

function ClientProfileModal({
  client,
  loading,
  onClose,
}: {
  client: AdminClientDetail | null
  loading: boolean
  onClose: () => void
}) {
  if (!client && !loading) return null

  return (
    <div className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-beige-50 w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl border border-beige-300 shadow-beige-lg">
        <div className="p-6 border-b border-beige-300 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">Client</p>
            <h2 className="text-2xl font-serif font-bold text-ink mt-1">
              {client?.nom_complet ?? 'Chargement…'}
            </h2>
            <p className="text-sm text-muted mt-1">
              {client?.email ?? '—'} · {client?.telephone ?? '—'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
            aria-label="Fermer"
          >
            <Eye className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 bg-beige-200 rounded animate-pulse" />
            ))}
          </div>
        ) : client && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-ink">Informations personnelles</h3>
                  <ClientBadge client={client} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted">Nom complet</p>
                    <p className="font-semibold text-ink">{client.nom_complet}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Telephone</p>
                    <p className="font-semibold text-ink">{client.telephone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Email</p>
                    <p className="font-semibold text-ink">{client.email ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Ville</p>
                    <p className="font-semibold text-ink">{client.ville ?? '—'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted">Adresse</p>
                    <p className="font-semibold text-ink">{client.adresse_principale ?? '—'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <a
                    href={client.whatsapp_url ?? undefined}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 flex items-center gap-2 ${client.whatsapp_url ? 'hover:bg-beige-200' : 'opacity-50 pointer-events-none'}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
                    WhatsApp
                  </a>
                  <a
                    href={client.telephone ? `tel:${client.telephone}` : undefined}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 flex items-center gap-2 ${client.telephone ? 'hover:bg-beige-200' : 'opacity-50 pointer-events-none'}`}
                  >
                    <Phone className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                    Appeler
                  </a>
                  <a
                    href={client.email ? `mailto:${client.email}` : undefined}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 flex items-center gap-2 ${client.email ? 'hover:bg-beige-200' : 'opacity-50 pointer-events-none'}`}
                  >
                    <Mail className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                    Email
                  </a>
                </div>
              </div>

              <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Historique commandes</h3>
                {client.commandes_recentes && client.commandes_recentes.length > 0 ? (
                  <div className="space-y-2">
                    {client.commandes_recentes.map((cmd) => (
                      <div key={cmd.id} className="bg-beige-50 border border-beige-300 rounded-xl p-3 text-xs">
                        <div className="flex justify-between">
                          <span className="font-semibold text-ink">{cmd.numero_commande}</span>
                          <span className="text-muted">{cmd.date_commande}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-muted">{cmd.statut}</span>
                          <span className="font-semibold text-ink">{fmtMoney(cmd.montant_total)} FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">Aucune commande recente.</p>
                )}
              </div>

              <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Produits favoris</h3>
                <p className="text-xs text-muted">Aucune donnee disponible.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Statistiques client</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Commandes</span><span>{client.nombre_commandes}</span></div>
                  <div className="flex justify-between"><span>Total depense</span><span>{fmtMoney(client.total_depense)} FCFA</span></div>
                  <div className="flex justify-between"><span>Panier moyen</span><span>{fmtMoney(client.panier_moyen)} FCFA</span></div>
                  <div className="flex justify-between"><span>Score fidelite</span><span>{client.score_fidelite}</span></div>
                  <div className="flex justify-between"><span>Type</span><span>{client.type_client_label ?? client.type_client}</span></div>
                </div>
              </div>

              <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Analyse client</h3>
                <div className="space-y-2 text-xs text-muted">
                  <p>Frequence achat: {client.nombre_commandes > 0 ? 'Reguliere' : 'Aucune'}</p>
                  <p>Categorie preferee: —</p>
                  <p>Depenses mensuelles: —</p>
                </div>
              </div>

              <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Notes privees</h3>
                <p className="text-xs text-muted">{client.notes_privees ?? 'Aucune note.'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ClientsPage() {
  const [clients, setClients] = useState<AdminClientListItem[]>([])
  const [stats, setStats] = useState<AdminClientStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [villeFilter, setVilleFilter] = useState('')
  const [minOrders, setMinOrders] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selected, setSelected] = useState<AdminClientDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminClientDetail | null>(null)
  const [editLoading, setEditLoading] = useState(false)

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
      const res = await clientsAdminApi.stats()
      setStats(res.data.data)
    } catch {
      addToast('Impossible de charger les statistiques.', 'error')
    } finally {
      setStatsLoading(false)
    }
  }

  const loadClients = async (nextPage: number = page) => {
    setLoading(true)
    try {
      const res = await clientsAdminApi.list({
        page: nextPage,
        per_page: 12,
        search: search || undefined,
        ville: villeFilter || undefined,
        type_client: statusFilter === 'vip' ? 'vip' : undefined,
      })
      setClients(res.data.data.clients)
      setLastPage(res.data.data.pagination.last_page || 1)
    } catch {
      addToast('Impossible de charger les clients.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    await Promise.all([loadClients(1), loadStats()])
  }

  useEffect(() => {
    loadClients(1)
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      loadClients(1)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, villeFilter, minOrders, dateStart, dateEnd])

  useEffect(() => {
    if (!selectedId) return
    const fetchDetail = async () => {
      setDetailLoading(true)
      try {
        const res = await clientsAdminApi.show(selectedId)
        setSelected(res.data.data.client)
      } catch {
        addToast('Impossible de charger le client.', 'error')
      } finally {
        setDetailLoading(false)
      }
    }
    fetchDetail()
  }, [selectedId])

  const handleDelete = async (client: AdminClientListItem) => {
    const confirmed = window.confirm(`Supprimer ${client.nom_complet} ?`)
    if (!confirmed) return
    setDeleteLoadingId(client.id)
    try {
      await clientsAdminApi.remove(client.id)
      addToast('Client supprime avec succes.')
      await refresh()
    } catch {
      addToast('Suppression impossible.', 'error')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const openEdit = async (clientId: number) => {
    setEditLoading(true)
    try {
      const res = await clientsAdminApi.show(clientId)
      setEditTarget(res.data.data.client)
    } catch {
      addToast('Impossible de charger le client.', 'error')
    } finally {
      setEditLoading(false)
    }
  }

  const handleSaveEdit = async (payload: Partial<AdminClientDetail>) => {
    if (!editTarget) return
    setEditLoading(true)
    try {
      await clientsAdminApi.update(editTarget.id, payload)
      addToast('Client mis a jour avec succes.')
      setEditTarget(null)
      await refresh()
    } catch {
      addToast('Mise a jour impossible.', 'error')
    } finally {
      setEditLoading(false)
    }
  }

  const filteredClients = useMemo(() => {
    const minOrdersValue = minOrders ? Number(minOrders) : null
    const startDate = dateStart ? new Date(dateStart).getTime() : null
    const endDate = dateEnd ? new Date(dateEnd).getTime() : null

    return clients.filter((client) => {
      if (statusFilter === 'actif' && client.est_inactif) return false
      if (statusFilter === 'inactif' && !client.est_inactif) return false
      if (statusFilter === 'vip' && !client.est_vip && client.type_client !== 'vip') return false
      if (minOrdersValue !== null && client.nombre_commandes < minOrdersValue) return false
      if (startDate || endDate) {
        const created = parseDateValue(client.date_creation)
        if (created === null) return false
        if (startDate && created < startDate) return false
        if (endDate && created > endDate) return false
      }
      return true
    })
  }, [clients, statusFilter, minOrders, dateStart, dateEnd])

  const totalCommandes = useMemo(() =>
    clients.reduce((sum, c) => sum + (c.nombre_commandes || 0), 0), [clients],
  )

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
          <h1 className="text-2xl font-serif font-bold text-ink">Gestion des clients</h1>
          <p className="text-sm text-muted mt-1">Consultez et gerez les informations de vos clients.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => addToast('Export clients bientot disponible.')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-50 border border-beige-300 text-xs font-semibold text-muted hover:bg-beige-200 transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            Exporter clients
          </button>
          <button
            onClick={() => addToast('Notification en preparation.')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 transition-colors flex items-center gap-2"
          >
            <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
            Envoyer notification
          </button>
          <button
            onClick={() => setStatusFilter('vip')}
            className="px-3.5 py-2.5 rounded-xl bg-beige-500/80 text-white text-xs font-semibold hover:bg-beige-400 transition-colors flex items-center gap-2"
          >
            <Star className="w-3.5 h-3.5" strokeWidth={1.5} />
            Clients VIP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total clients" value={stats ? String(stats.total_clients) : '—'} icon={Users} iconBg="bg-beige-200" iconColor="text-beige-500" loading={statsLoading} />
        <StatCard title="Nouveaux clients" value={stats ? String(stats.nouveaux_clients_mois) : '—'} icon={Star} iconBg="bg-sky-50" iconColor="text-sky-600" loading={statsLoading} />
        <StatCard title="Clients actifs" value={stats ? String(stats.clients_actifs) : '—'} icon={ShieldCheck} iconBg="bg-sage/30" iconColor="text-emerald-600" loading={statsLoading} />
        <StatCard title="Clients VIP" value={stats ? String(stats.clients_vip) : '—'} icon={Crown} iconBg="bg-beige-200" iconColor="text-beige-500" loading={statsLoading} />
        <StatCard title="Total commandes" value={stats ? String(totalCommandes) : '—'} icon={FileText} iconBg="bg-amber-100" iconColor="text-amber-700" loading={statsLoading} />
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, email, telephone, commande…"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted focus:outline-none focus:border-beige-400"
          >
            <option value="">Statut client</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="vip">VIP</option>
          </select>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
            <input
              value={villeFilter}
              onChange={(e) => setVilleFilter(e.target.value)}
              placeholder="Ville"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
            />
          </div>
          <div className="relative">
            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
            <input
              type="number"
              min={0}
              value={minOrders}
              onChange={(e) => setMinOrders(e.target.value)}
              placeholder="Nb commandes min"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-100 border border-beige-300 rounded-xl text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all"
            />
          </div>
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
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2.5 bg-beige-50 border border-beige-300 rounded-xl hover:bg-beige-200 transition-colors disabled:opacity-40"
          >
            <Search className={`w-4 h-4 text-muted ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
          <span className="text-xs text-muted">{loading ? 'Chargement…' : `${filteredClients.length} client(s)`}</span>
        </div>
      </div>

      <div className="hidden lg:block bg-beige-50 border border-beige-300 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1.6fr_0.7fr_0.8fr_0.8fr_1fr_0.8fr_1.2fr] gap-4 px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-widest border-b border-beige-300">
          <div>Client</div>
          <div>Commandes</div>
          <div>Depenses</div>
          <div>Statut</div>
          <div>Derniere activite</div>
          <div>Inscription</div>
          <div>Actions</div>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-beige-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-beige-400 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-ink mb-1">Aucun client</p>
            <p className="text-xs text-muted">Ajustez vos filtres ou reessayez plus tard.</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="grid grid-cols-[1.6fr_0.7fr_0.8fr_0.8fr_1fr_0.8fr_1.2fr] gap-4 px-5 py-4 border-b border-beige-200 hover:bg-beige-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-beige-200 flex items-center justify-center text-xs font-semibold text-muted">
                  {formatInitials(client.nom_complet)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{client.nom_complet}</p>
                  <p className="text-xs text-muted">{client.email ?? client.telephone}</p>
                </div>
              </div>
              <div className="text-sm font-semibold text-ink">{client.nombre_commandes}</div>
              <div className="text-sm font-semibold text-ink">{fmtMoney(client.total_depense)} FCFA</div>
              <div>
                <ClientBadge client={client} />
              </div>
              <div className="text-xs text-muted">{client.derniere_commande ?? client.derniere_visite ?? '—'}</div>
              <div className="text-xs text-muted">{client.date_creation}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedId(client.id)}
                  className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                  title="Voir profil"
                >
                  <Eye className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => openEdit(client.id)}
                  className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                  title="Modifier"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setSelectedId(client.id)}
                  className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                  title="Historique"
                >
                  <FileText className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleDelete(client)}
                  disabled={deleteLoadingId === client.id}
                  className="p-2 rounded-xl border border-blush/50 hover:bg-blush/20 transition-colors disabled:opacity-50"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.5} />
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
        ) : filteredClients.map((client) => (
          <div key={client.id} className="bg-beige-50 border border-beige-300 rounded-2xl p-4 shadow-beige">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{client.nom_complet}</p>
                <p className="text-xs text-muted">{client.telephone}</p>
              </div>
              <ClientBadge client={client} />
            </div>
            <div className="mt-3 text-xs text-muted">{client.email ?? '—'}</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{fmtMoney(client.total_depense)} FCFA</span>
              <span className="text-xs text-muted">{client.nombre_commandes} commandes</span>
            </div>
            <button
              onClick={() => setSelectedId(client.id)}
              className="mt-3 w-full px-3 py-2 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 transition-colors"
            >
              Voir profil
            </button>
          </div>
        ))}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => { const next = p - 1; loadClients(next); return next })}
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
                onClick={() => { setPage(p as number); loadClients(p as number) }}
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
            onClick={() => setPage((p) => { const next = p + 1; loadClients(next); return next })}
            disabled={page >= lastPage}
            className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {selectedId && (
        <ClientProfileModal
          client={selected}
          loading={detailLoading}
          onClose={() => { setSelectedId(null); setSelected(null) }}
        />
      )}

      {editTarget && (
        <EditClientModal
          client={editTarget}
          loading={editLoading}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
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

export default ClientsPage
