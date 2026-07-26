import { useEffect, useState } from 'react'
import { MapPin, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, GripVertical, X, Check } from 'lucide-react'
import { deliveryZonesAdminApi, type AdminDeliveryZone, type DeliveryZonePayload } from '@/api/admin/deliveryZones'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F CFA' }

interface ZoneFormState {
  nom: string
  prix: string
  est_active: boolean
  ordre_affichage: string
  eligible_gratuite: boolean
}

const emptyForm = (): ZoneFormState => ({
  nom: '',
  prix: '',
  est_active: true,
  ordre_affichage: '0',
  eligible_gratuite: false,
})

function ZoneModal({
  zone,
  onClose,
  onSave,
}: {
  zone: AdminDeliveryZone | null
  onClose: () => void
  onSave: (payload: DeliveryZonePayload) => Promise<void>
}) {
  const [form, setForm] = useState<ZoneFormState>(
    zone
      ? { nom: zone.nom, prix: String(zone.prix), est_active: zone.est_active, ordre_affichage: String(zone.ordre_affichage), eligible_gratuite: zone.eligible_gratuite }
      : emptyForm()
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const prix = Number(form.prix)
    if (!form.nom.trim()) { setError('Le nom est requis.'); return }
    if (isNaN(prix) || prix < 0) { setError('Prix invalide.'); return }
    setSaving(true)
    setError('')
    try {
      await onSave({
        nom: form.nom.trim(),
        prix,
        est_active: form.est_active,
        ordre_affichage: Number(form.ordre_affichage) || 0,
        eligible_gratuite: form.eligible_gratuite,
      })
      onClose()
    } catch {
      setError("Une erreur est survenue.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative bg-beige-50 rounded-2xl border border-beige-300 shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif font-bold text-[18px] text-ink">
            {zone ? 'Modifier la zone' : 'Nouvelle zone'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-beige-200 transition-colors">
            <X className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">
              Nom de la zone
            </label>
            <input
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              placeholder="ex: Dakar centre"
              className="w-full h-10 px-3.5 rounded-xl border border-beige-300 bg-beige-100 text-[13px] text-ink
                focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">
              Prix (FCFA)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={form.prix}
              onChange={(e) => setForm((f) => ({ ...f, prix: e.target.value }))}
              placeholder="0"
              className="w-full h-10 px-3.5 rounded-xl border border-beige-300 bg-beige-100 text-[13px] text-ink
                focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400"
            />
            <p className="text-[11px] text-muted mt-1">Mettre 0 pour "Retrait / livraison gratuite"</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">
                Ordre d'affichage
              </label>
              <input
                type="number"
                min={0}
                value={form.ordre_affichage}
                onChange={(e) => setForm((f) => ({ ...f, ordre_affichage: e.target.value }))}
                className="w-full h-10 px-3.5 rounded-xl border border-beige-300 bg-beige-100 text-[13px] text-ink
                  focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">
                Statut
              </label>
              <label className="flex items-center gap-2 h-10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.est_active}
                  onChange={(e) => setForm((f) => ({ ...f, est_active: e.target.checked }))}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-5 rounded-full transition-colors ${form.est_active ? 'bg-beige-500' : 'bg-beige-300'}`}
                  onClick={() => setForm((f) => ({ ...f, est_active: !f.est_active }))}
                >
                  <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${form.est_active ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-[12px] text-ink">{form.est_active ? 'Active' : 'Inactive'}</span>
              </label>
            </div>
          </div>

          {/* Éligibilité à la livraison gratuite au-dessus du seuil */}
          <div className="rounded-xl border border-beige-300 bg-beige-100 p-3.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.eligible_gratuite}
                onChange={(e) => setForm((f) => ({ ...f, eligible_gratuite: e.target.checked }))}
                className="sr-only"
              />
              <div
                className={`mt-0.5 w-10 h-5 rounded-full flex-shrink-0 transition-colors ${form.eligible_gratuite ? 'bg-beige-500' : 'bg-beige-300'}`}
                onClick={() => setForm((f) => ({ ...f, eligible_gratuite: !f.eligible_gratuite }))}
              >
                <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${form.eligible_gratuite ? 'translate-x-5' : ''}`} />
              </div>
              <div>
                <span className="text-[12.5px] font-semibold text-ink">Livraison gratuite au-dessus du seuil</span>
                <p className="text-[11px] text-muted mt-0.5">
                  Si coché, cette zone devient gratuite quand le panier dépasse le seuil (Paramètres → Livraison).
                  À réserver aux zones proches (Dakar) pour protéger la marge.
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-beige-300 text-[13px] font-semibold text-muted hover:bg-beige-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-beige-500 text-white text-[13px] font-semibold
                hover:bg-beige-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" strokeWidth={2} />
              )}
              {zone ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<AdminDeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; zone: AdminDeliveryZone | null }>({ open: false, zone: null })
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  async function loadZones() {
    setLoading(true)
    try {
      const res = await deliveryZonesAdminApi.list()
      setZones(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadZones() }, [])

  async function handleSave(payload: DeliveryZonePayload) {
    if (modal.zone) {
      await deliveryZonesAdminApi.update(modal.zone.id, payload)
    } else {
      await deliveryZonesAdminApi.create(payload)
    }
    await loadZones()
  }

  async function handleToggle(zone: AdminDeliveryZone) {
    setActionLoading(zone.id)
    try {
      await deliveryZonesAdminApi.toggleStatus(zone.id)
      setZones((prev) => prev.map((z) => z.id === zone.id ? { ...z, est_active: !z.est_active } : z))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id: number) {
    setActionLoading(id)
    try {
      await deliveryZonesAdminApi.delete(id)
      setZones((prev) => prev.filter((z) => z.id !== id))
      setDeleteConfirm(null)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Zones de livraison</h1>
          <p className="text-sm text-muted mt-1">Configurez les zones et les frais de livraison proposés aux clients.</p>
        </div>
        <button
          onClick={() => setModal({ open: true, zone: null })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Nouvelle zone
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total zones', value: zones.length },
          { label: 'Zones actives', value: zones.filter((z) => z.est_active).length },
          { label: 'Prix moyen', value: zones.length ? Math.round(zones.reduce((s, z) => s + z.prix, 0) / zones.length).toLocaleString('fr-FR') + ' F' : '—' },
        ].map((s) => (
          <div key={s.label} className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
            {loading ? (
              <div className="h-7 w-16 bg-beige-200 rounded-lg animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-ink">{s.value}</p>
            )}
            <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Zones list */}
      <div className="bg-beige-50 border border-beige-300 rounded-2xl overflow-hidden shadow-beige">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[2rem_1fr_0.8fr_0.6fr_0.8fr] gap-4 px-5 py-3
          text-[11px] font-semibold text-muted uppercase tracking-widest border-b border-beige-300 bg-beige-100">
          <div />
          <div>Zone</div>
          <div>Prix</div>
          <div>Statut</div>
          <div className="text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-beige-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : zones.length === 0 ? (
          <div className="py-16 text-center">
            <MapPin className="w-10 h-10 text-beige-300 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-muted">Aucune zone configurée.</p>
            <button
              onClick={() => setModal({ open: true, zone: null })}
              className="mt-4 text-[12px] font-semibold text-beige-500 underline hover:no-underline"
            >
              Créer la première zone
            </button>
          </div>
        ) : (
          zones.map((zone, index) => (
            <div
              key={zone.id}
              className={`grid grid-cols-1 sm:grid-cols-[2rem_1fr_0.8fr_0.6fr_0.8fr] gap-3 sm:gap-4
                px-4 sm:px-5 py-4 transition-colors hover:bg-beige-100
                ${index < zones.length - 1 ? 'border-b border-beige-200' : ''}`}
            >
              {/* Drag handle (visual only) */}
              <div className="hidden sm:flex items-center text-beige-300">
                <GripVertical className="w-4 h-4" strokeWidth={1.5} />
              </div>

              {/* Name */}
              <div className="flex items-center">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-ink">{zone.nom}</p>
                    {zone.eligible_gratuite && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-ok/10 text-ok text-[10px] font-semibold">
                        Gratuite au seuil
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">Ordre: {zone.ordre_affichage}</p>
                </div>
              </div>

              {/* Prix */}
              <div className="flex items-center">
                <span className={`text-[14px] font-bold tabular-nums ${zone.prix === 0 ? 'text-ok' : 'text-ink'}`}>
                  {zone.prix === 0 ? 'Gratuit' : fmt(zone.prix)}
                </span>
              </div>

              {/* Statut */}
              <div className="flex items-center">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
                  ${zone.est_active ? 'bg-ok/10 text-ok' : 'bg-beige-200 text-muted'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${zone.est_active ? 'bg-ok' : 'bg-muted'}`} />
                  {zone.est_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(zone)}
                  disabled={actionLoading === zone.id}
                  title={zone.est_active ? 'Désactiver' : 'Activer'}
                  className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors disabled:opacity-50"
                >
                  {zone.est_active
                    ? <ToggleRight className="w-4 h-4 text-ok" strokeWidth={1.5} />
                    : <ToggleLeft className="w-4 h-4 text-muted" strokeWidth={1.5} />}
                </button>

                {/* Edit */}
                <button
                  onClick={() => setModal({ open: true, zone })}
                  title="Modifier"
                  className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                </button>

                {/* Delete */}
                {deleteConfirm === zone.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(zone.id)}
                      disabled={actionLoading === zone.id}
                      className="px-2.5 py-1.5 rounded-xl bg-red-500 text-white text-[11px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="p-1.5 rounded-xl border border-beige-300 hover:bg-beige-200"
                    >
                      <X className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(zone.id)}
                    title="Supprimer"
                    className="p-2 rounded-xl border border-beige-300 hover:bg-red-50 hover:border-red-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[11px] text-muted mt-4 text-center">
        Ces zones s'affichent dans le bon de commande pour que le client choisisse sa zone de livraison.
      </p>

      {/* Modal */}
      {modal.open && (
        <ZoneModal
          zone={modal.zone}
          onClose={() => setModal({ open: false, zone: null })}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
