import { useEffect, useState } from 'react'
import {
  Settings, Store, CreditCard, Truck, Bell, Shield, Users, Palette,
  Search, Upload, KeyRound, Save, RefreshCw,
} from 'lucide-react'
import { shippingAdminApi } from '@/api/admin/shipping'
import { paiementsAdminApi } from '@/api/admin/paiements'
import { shopSettingsApi } from '@/api/admin/settings'
import type {
  AdminPaymentMethod,
  AdminShippingSettings,
  AdminShopSettings,
} from '@/types/admin'
import { fmtMoney } from '@/features/admin/orders/orderHelpers'

const sections = [
  { id: 'general',       label: 'Général',          icon: Settings  },
  { id: 'boutique',      label: 'Boutique',          icon: Store     },
  { id: 'paiements',     label: 'Paiements',         icon: CreditCard },
  { id: 'livraisons',    label: 'Livraisons',        icon: Truck     },
  { id: 'notifications', label: 'Notifications',     icon: Bell      },
  { id: 'securite',      label: 'Sécurité',          icon: Shield    },
  { id: 'utilisateurs',  label: 'Utilisateurs',      icon: Users     },
  { id: 'apparence',     label: 'Apparence',         icon: Palette   },
  { id: 'seo',           label: 'SEO',               icon: Search    },
  { id: 'reseaux',       label: 'Réseaux sociaux',   icon: Upload    },
]

type ToastType = 'success' | 'error'

function Toast({ message, type }: { message: string; type: ToastType }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-beige-lg border text-sm font-medium
      ${type === 'success' ? 'bg-beige-50 border-beige-300 text-ink' : 'bg-blush/20 border-blush text-rose-700'}`}>
      {message}
    </div>
  )
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general')
  const [shipping, setShipping]           = useState<AdminShippingSettings | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<AdminPaymentMethod[]>([])
  const [shopSettings, setShopSettings]   = useState<AdminShopSettings | null>(null)
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [toast, setToast]                 = useState<{ message: string; type: ToastType } | null>(null)

  // Formulaire général
  const [generalForm, setGeneralForm] = useState({
    boutique_nom: '', boutique_email: '', boutique_telephone: '',
    boutique_adresse: '', boutique_devise: '', boutique_langue: '',
  })

  // Formulaire réseaux sociaux
  const [socialForm, setSocialForm] = useState({
    social_instagram: '', social_facebook: '',
    social_tiktok: '', social_whatsapp: '',
  })

  // Formulaire SEO
  const [seoForm, setSeoForm] = useState({
    seo_titre: '', seo_description: '', seo_mots_cles: '',
  })

  // Formulaire notifications
  const [notifForm, setNotifForm] = useState({
    notif_nouvelle_commande: true,
    notif_paiement_recu: true,
    notif_livraison: true,
    notif_promotions: false,
  })

  // Formulaire boutique (description, localisation, horaires)
  const [boutiqueForm, setBoutiqueForm] = useState({
    boutique_description: '', boutique_ville: '', boutique_pays: '', boutique_horaires: '',
  })

  // Formulaire livraisons
  const [shippingForm, setShippingForm] = useState({
    default_cost: '', free_threshold: '', is_enabled: true,
  })
  const [shippingSaving, setShippingSaving] = useState(false)

  // Toggle paiements
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null)

  // Formulaire changement de mot de passe
  const [pwdForm, setPwdForm] = useState({
    current_password: '', new_password: '', new_password_confirmation: '',
  })
  const [pwdSaving, setPwdSaving] = useState(false)

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [shippingRes, methodsRes, settingsRes] = await Promise.all([
          shippingAdminApi.getSettings(),
          paiementsAdminApi.paymentMethods(),
          shopSettingsApi.getAll(),
        ])
        const ship = shippingRes.data.data
        setShipping(ship)
        setShippingForm({
          default_cost:   String(ship.default_cost),
          free_threshold: String(ship.free_threshold),
          is_enabled:     ship.is_enabled,
        })
        setPaymentMethods(methodsRes.data.data)
        const s = settingsRes.data.data
        setShopSettings(s)
        setGeneralForm({
          boutique_nom:       s.general.boutique_nom,
          boutique_email:     s.general.boutique_email,
          boutique_telephone: s.general.boutique_telephone,
          boutique_adresse:   s.general.boutique_adresse,
          boutique_devise:    s.general.boutique_devise,
          boutique_langue:    s.general.boutique_langue,
        })
        setBoutiqueForm({
          boutique_description: s.general.boutique_description,
          boutique_ville:       s.general.boutique_ville,
          boutique_pays:        s.general.boutique_pays,
          boutique_horaires:    s.general.boutique_horaires,
        })
        setSocialForm({ ...s.social })
        setSeoForm({ ...s.seo })
        setNotifForm({
          notif_nouvelle_commande: s.notifications.notif_nouvelle_commande === '1',
          notif_paiement_recu:     s.notifications.notif_paiement_recu === '1',
          notif_livraison:         s.notifications.notif_livraison === '1',
          notif_promotions:        s.notifications.notif_promotions === '1',
        })
      } catch {
        showToast('Impossible de charger les paramètres.', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const saveSettings = async (settings: Record<string, string>) => {
    setSaving(true)
    try {
      const res = await shopSettingsApi.update(settings)
      const s = res.data.data
      setShopSettings(s)
      showToast('Paramètres enregistrés.')
    } catch {
      showToast('Erreur lors de la sauvegarde.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveGeneral = () => saveSettings(generalForm)
  const handleSaveSocial  = () => saveSettings(socialForm)
  const handleSaveSeo     = () => saveSettings(seoForm)

  const handleSaveNotif = () => saveSettings({
    notif_nouvelle_commande: notifForm.notif_nouvelle_commande ? '1' : '0',
    notif_paiement_recu:     notifForm.notif_paiement_recu     ? '1' : '0',
    notif_livraison:         notifForm.notif_livraison         ? '1' : '0',
    notif_promotions:        notifForm.notif_promotions        ? '1' : '0',
  })

  const handleSaveBoutique = () => saveSettings(boutiqueForm)

  const handleSaveShipping = async () => {
    setShippingSaving(true)
    try {
      const res = await shippingAdminApi.updateSettings({
        default_cost:   Number(shippingForm.default_cost)   || 0,
        free_threshold: Number(shippingForm.free_threshold) || 0,
        is_enabled:     shippingForm.is_enabled,
      })
      setShipping(res.data.data)
      showToast('Paramètres de livraison enregistrés.')
    } catch {
      showToast('Erreur lors de la sauvegarde.', 'error')
    } finally {
      setShippingSaving(false)
    }
  }

  const handleTogglePayment = async (method: string) => {
    setToggleLoadingId(method)
    try {
      const res = await paiementsAdminApi.togglePaymentMethod(method)
      const { method: m, active } = res.data.data
      setPaymentMethods((prev) => prev.map((pm) => pm.value === m ? { ...pm, active } : pm))
      showToast(`${active ? 'Activé' : 'Désactivé'} : ${method}`)
    } catch {
      showToast('Erreur lors de la modification.', 'error')
    } finally {
      setToggleLoadingId(null)
    }
  }

  const handleChangePassword = async () => {
    if (!pwdForm.current_password || !pwdForm.new_password) {
      showToast('Veuillez remplir tous les champs.', 'error')
      return
    }
    if (pwdForm.new_password !== pwdForm.new_password_confirmation) {
      showToast('Les mots de passe ne correspondent pas.', 'error')
      return
    }
    setPwdSaving(true)
    try {
      const res = await shopSettingsApi.changePassword(pwdForm)
      showToast(res.data.message ?? 'Mot de passe modifié.')
      setPwdForm({ current_password: '', new_password: '', new_password_confirmation: '' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast(msg ?? 'Erreur lors du changement.', 'error')
    } finally {
      setPwdSaving(false)
    }
  }

  const inputCls = 'px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400 transition-all'
  const saveBtnCls = 'flex items-center gap-2 px-4 py-2 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 disabled:opacity-50 transition-colors'

  return (
    <div className="px-6 py-8">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-ink">Paramètres</h1>
        <p className="text-sm text-muted mt-1">Configurez et personnalisez votre boutique.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-beige-400 animate-spin" strokeWidth={1.5} />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[0.75fr_1.6fr] gap-6">
          {/* Sidebar navigation */}
          <div className="bg-beige-50 border border-beige-300 rounded-2xl p-4 shadow-beige h-fit">
            <p className="text-xs text-muted uppercase tracking-widest mb-3">Sections</p>
            <div className="space-y-1.5">
              {sections.map((section) => {
                const Icon   = section.icon
                const active = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
                      active ? 'bg-beige-500 text-white' : 'bg-beige-100 text-muted hover:bg-beige-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    {section.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contenu */}
          <div className="space-y-6">

            {/* ── Général ── */}
            {activeSection === 'general' && (
              <section className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest">Paramètres généraux</p>
                    <h2 className="text-lg font-serif font-semibold text-ink">Identité boutique</h2>
                  </div>
                  <Settings className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {[
                    { key: 'boutique_nom',       label: 'Nom boutique'  },
                    { key: 'boutique_email',      label: 'Email contact' },
                    { key: 'boutique_telephone',  label: 'Téléphone'     },
                    { key: 'boutique_adresse',    label: 'Adresse'       },
                    { key: 'boutique_devise',     label: 'Devise'        },
                    { key: 'boutique_langue',     label: 'Langue'        },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">{label}</label>
                      <input
                        className={`w-full ${inputCls}`}
                        value={generalForm[key as keyof typeof generalForm]}
                        onChange={(e) => setGeneralForm(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={label}
                      />
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveGeneral} disabled={saving} className={saveBtnCls}>
                  <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </section>
            )}

            {/* ── Boutique & branding ── */}
            {activeSection === 'boutique' && (
              <section className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest">Boutique & branding</p>
                    <h2 className="text-lg font-serif font-semibold text-ink">Identité & localisation</h2>
                  </div>
                  <Store className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                </div>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Description boutique</label>
                    <textarea
                      rows={3}
                      className={`w-full ${inputCls} resize-none`}
                      value={boutiqueForm.boutique_description}
                      onChange={(e) => setBoutiqueForm(prev => ({ ...prev, boutique_description: e.target.value }))}
                      placeholder="Courte description visible sur la page d'accueil…"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {([
                      { key: 'boutique_ville',    label: 'Ville',    placeholder: 'Dakar'     },
                      { key: 'boutique_pays',     label: 'Pays',     placeholder: 'Sénégal'   },
                      { key: 'boutique_horaires', label: 'Horaires', placeholder: 'Lun–Sam 9h–19h' },
                    ] as const).map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">{label}</label>
                        <input
                          className={`w-full ${inputCls}`}
                          value={boutiqueForm[key]}
                          onChange={(e) => setBoutiqueForm(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={handleSaveBoutique} disabled={saving} className={saveBtnCls}>
                  <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <div className="mt-5 pt-4 border-t border-beige-300 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-dashed border-beige-300 rounded-2xl p-4 bg-beige-100 text-xs text-muted flex items-center gap-2">
                    <Upload className="w-4 h-4" strokeWidth={1.5} />
                    Upload logo — disponible prochainement
                  </div>
                  <div className="border border-dashed border-beige-300 rounded-2xl p-4 bg-beige-100 text-xs text-muted flex items-center gap-2">
                    <Upload className="w-4 h-4" strokeWidth={1.5} />
                    Upload bannière — disponible prochainement
                  </div>
                </div>
              </section>
            )}

            {/* ── Paiements ── */}
            {activeSection === 'paiements' && (
              <section className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest">Paiements</p>
                    <h2 className="text-lg font-serif font-semibold text-ink">Méthodes actives</h2>
                  </div>
                  <CreditCard className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                </div>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const isToggling = toggleLoadingId === method.value
                    return (
                      <div key={method.value} className="flex items-center justify-between bg-beige-100 border border-beige-300 rounded-2xl px-4 py-3">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="text-sm font-semibold text-ink">{method.label}</p>
                          <p className="text-xs text-muted">{method.description ?? 'Paiement manuel'}</p>
                          {method.fees != null && method.fees > 0 && (
                            <p className="text-[11px] text-muted">{method.fees}% de frais</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${method.active ? 'bg-sage/40 text-emerald-700' : 'bg-beige-200 text-muted'}`}>
                            {method.active ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => handleTogglePayment(method.value)}
                            disabled={isToggling}
                            className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 flex-shrink-0 ${method.active ? 'bg-beige-500' : 'bg-beige-300'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${method.active ? 'translate-x-5' : 'translate-x-0.5'} ${isToggling ? 'animate-pulse' : ''}`} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {paymentMethods.length === 0 && (
                    <p className="text-xs text-muted">Aucune méthode disponible.</p>
                  )}
                </div>
              </section>
            )}

            {/* ── Livraisons ── */}
            {activeSection === 'livraisons' && (
              <section className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest">Livraisons</p>
                    <h2 className="text-lg font-serif font-semibold text-ink">Paramètres de livraison</h2>
                  </div>
                  <Truck className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                </div>
                <div className="space-y-4 mb-4">
                  <label className="flex items-center justify-between bg-beige-100 border border-beige-300 rounded-2xl px-4 py-3 cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold text-ink">Livraison activée</p>
                      <p className="text-xs text-muted">Proposer la livraison aux clients</p>
                    </div>
                    <div
                      onClick={() => setShippingForm(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
                      className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${shippingForm.is_enabled ? 'bg-beige-500' : 'bg-beige-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${shippingForm.is_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Frais standard (FCFA)</label>
                      <input
                        type="number"
                        min="0"
                        className={`w-full ${inputCls}`}
                        value={shippingForm.default_cost}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, default_cost: e.target.value }))}
                        placeholder="2000"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Gratuite dès (FCFA)</label>
                      <input
                        type="number"
                        min="0"
                        className={`w-full ${inputCls}`}
                        value={shippingForm.free_threshold}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, free_threshold: e.target.value }))}
                        placeholder="50000"
                      />
                      <p className="text-[10px] text-muted mt-1">0 = livraison gratuite toujours offerte si désactivé</p>
                    </div>
                  </div>
                  {shipping && (
                    <div className="flex gap-3">
                      <div className="flex-1 bg-beige-100 border border-beige-300 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-muted uppercase tracking-widest">Actuel frais</p>
                        <p className="text-base font-bold text-ink">{fmtMoney(shipping.default_cost)} F</p>
                      </div>
                      <div className="flex-1 bg-beige-100 border border-beige-300 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-muted uppercase tracking-widest">Actuel seuil</p>
                        <p className="text-base font-bold text-ink">{fmtMoney(shipping.free_threshold)} F</p>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={handleSaveShipping} disabled={shippingSaving} className={saveBtnCls}>
                  <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {shippingSaving ? 'Enregistrement…' : 'Enregistrer la livraison'}
                </button>
              </section>
            )}

            {/* ── Notifications ── */}
            {activeSection === 'notifications' && (
              <section className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest">Notifications</p>
                    <h2 className="text-lg font-serif font-semibold text-ink">Canaux actifs</h2>
                  </div>
                  <Bell className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                </div>
                <div className="space-y-3 mb-4">
                  {([
                    { key: 'notif_nouvelle_commande', label: 'Nouvelle commande'     },
                    { key: 'notif_paiement_recu',     label: 'Paiement reçu'         },
                    { key: 'notif_livraison',         label: 'Livraison expédiée'    },
                    { key: 'notif_promotions',        label: 'Promotions'            },
                  ] as const).map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between bg-beige-100 border border-beige-300 rounded-2xl px-3 py-3 cursor-pointer">
                      <span className="text-sm font-medium text-ink">{label}</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={notifForm[key]}
                          onChange={(e) => setNotifForm(prev => ({ ...prev, [key]: e.target.checked }))}
                        />
                        <div className={`w-10 h-5 rounded-full transition-colors ${notifForm[key] ? 'bg-beige-500' : 'bg-beige-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${notifForm[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <button onClick={handleSaveNotif} disabled={saving} className={saveBtnCls}>
                  <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </section>
            )}

            {/* ── Sécurité ── */}
            {activeSection === 'securite' && (
              <section className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest">Sécurité</p>
                    <h2 className="text-lg font-serif font-semibold text-ink">Changer le mot de passe</h2>
                  </div>
                  <Shield className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                </div>
                <div className="space-y-3 max-w-sm mb-4">
                  {([
                    { key: 'current_password',          label: 'Mot de passe actuel',    placeholder: '••••••••' },
                    { key: 'new_password',               label: 'Nouveau mot de passe',   placeholder: '8 caractères min.' },
                    { key: 'new_password_confirmation',  label: 'Confirmer le nouveau',   placeholder: '••••••••' },
                  ] as const).map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">{label}</label>
                      <input
                        type="password"
                        className={`w-full ${inputCls}`}
                        value={pwdForm[key]}
                        onChange={(e) => setPwdForm(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        autoComplete="new-password"
                      />
                    </div>
                  ))}
                </div>
                <button onClick={handleChangePassword} disabled={pwdSaving} className={saveBtnCls}>
                  <KeyRound className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {pwdSaving ? 'Modification…' : 'Changer le mot de passe'}
                </button>
              </section>
            )}

            {/* ── Utilisateurs ── */}
            {activeSection === 'utilisateurs' && (
              <section className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest">Utilisateurs & rôles</p>
                    <h2 className="text-lg font-serif font-semibold text-ink">Administrateurs</h2>
                  </div>
                  <Users className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-muted">Gestion multi-utilisateurs — disponible prochainement.</p>
              </section>
            )}

            {/* ── Apparence ── */}
            {activeSection === 'apparence' && (
              <section className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest">Apparence</p>
                    <h2 className="text-lg font-serif font-semibold text-ink">Thème & styles</h2>
                  </div>
                  <Palette className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-muted">Personnalisation du thème — disponible prochainement.</p>
              </section>
            )}

            {/* ── SEO ── */}
            {activeSection === 'seo' && (
              <section className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest">SEO</p>
                    <h2 className="text-lg font-serif font-semibold text-ink">Visibilité moteurs</h2>
                  </div>
                  <Search className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                </div>
                <div className="space-y-3 mb-4">
                  {([
                    { key: 'seo_titre',       label: 'Titre du site',       placeholder: 'Ex : NDEYA SHOP - Mode Africaine'  },
                    { key: 'seo_description', label: 'Description',         placeholder: 'Description courte pour Google'   },
                    { key: 'seo_mots_cles',   label: 'Mots-clés',           placeholder: 'mode, tissu, Sénégal, couture…'   },
                  ] as const).map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">{label}</label>
                      <input
                        className={`w-full ${inputCls}`}
                        value={seoForm[key]}
                        onChange={(e) => setSeoForm(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveSeo} disabled={saving} className={saveBtnCls}>
                  <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </section>
            )}

            {/* ── Réseaux sociaux ── */}
            {activeSection === 'reseaux' && (
              <section className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest">Réseaux sociaux</p>
                    <h2 className="text-lg font-serif font-semibold text-ink">Liens officiels</h2>
                  </div>
                  <Upload className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {([
                    { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/…' },
                    { key: 'social_facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/…'  },
                    { key: 'social_tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/…'    },
                    { key: 'social_whatsapp',  label: 'WhatsApp',  placeholder: '+221 XX XXX XX XX'        },
                  ] as const).map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">{label}</label>
                      <input
                        className={`w-full ${inputCls}`}
                        value={socialForm[key]}
                        onChange={(e) => setSocialForm(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveSocial} disabled={saving} className={saveBtnCls}>
                  <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </section>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
