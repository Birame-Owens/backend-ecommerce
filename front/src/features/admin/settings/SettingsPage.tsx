import { useEffect, useState } from 'react'
import {
  Settings, Store, CreditCard, Truck, Bell, Shield, Users, Palette,
  Search, Upload, KeyRound, Lock, EyeOff,
} from 'lucide-react'
import { shippingAdminApi } from '@/api/admin/shipping'
import { paiementsAdminApi } from '@/api/admin/paiements'
import type { AdminPaymentMethod, AdminShippingSettings } from '@/types/admin'
import { fmtMoney } from '@/features/admin/orders/orderHelpers'

const sections = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'boutique', label: 'Boutique', icon: Store },
  { id: 'paiements', label: 'Paiements', icon: CreditCard },
  { id: 'livraisons', label: 'Livraisons', icon: Truck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'securite', label: 'Securite', icon: Shield },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
  { id: 'apparence', label: 'Apparence', icon: Palette },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'reseaux', label: 'Reseaux sociaux', icon: Upload },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general')
  const [shipping, setShipping] = useState<AdminShippingSettings | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<AdminPaymentMethod[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [shippingRes, methodsRes] = await Promise.all([
          shippingAdminApi.getSettings(),
          paiementsAdminApi.paymentMethods(),
        ])
        setShipping(shippingRes.data.data)
        setPaymentMethods(methodsRes.data.data)
      } catch {
        setShipping(null)
        setPaymentMethods([])
      }
    }
    loadData()
  }, [])

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-ink">Parametres</h1>
        <p className="text-sm text-muted mt-1">Configurez et personnalisez votre boutique.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.75fr_1.6fr] gap-6">
        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-4 shadow-beige">
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Sections</p>
          <div className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon
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

        <div className="space-y-6">
          <section id="general" className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest">Parametres generaux</p>
                <h2 className="text-lg font-serif font-semibold text-ink">Identite boutique</h2>
              </div>
              <Settings className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Nom boutique" />
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Email" />
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Telephone" />
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Adresse" />
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Devise" />
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Langue" />
            </div>
            <p className="text-xs text-muted mt-3">Aucune API generale disponible pour l instant.</p>
          </section>

          <section id="boutique" className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest">Boutique & branding</p>
                <h2 className="text-lg font-serif font-semibold text-ink">Media & identite</h2>
              </div>
              <Store className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-dashed border-beige-300 rounded-2xl p-4 bg-beige-100 text-xs text-muted flex items-center gap-2">
                <Upload className="w-4 h-4" strokeWidth={1.5} />
                Upload logo (non disponible)
              </div>
              <div className="border border-dashed border-beige-300 rounded-2xl p-4 bg-beige-100 text-xs text-muted flex items-center gap-2">
                <Upload className="w-4 h-4" strokeWidth={1.5} />
                Upload banniere (non disponible)
              </div>
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Slogan" />
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Couleur principale" />
            </div>
          </section>

          <section id="paiements" className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest">Paiements</p>
                <h2 className="text-lg font-serif font-semibold text-ink">Methodes actives</h2>
              </div>
              <CreditCard className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            </div>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.value} className="flex items-center justify-between bg-beige-100 border border-beige-300 rounded-2xl px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">{method.label}</p>
                    <p className="text-xs text-muted">{method.description ?? 'Paiement manuel'}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${method.active ? 'bg-sage/40 text-emerald-700' : 'bg-beige-200 text-muted'}`}>
                    {method.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
              {paymentMethods.length === 0 && (
                <div className="text-xs text-muted">Aucune methode disponible.</div>
              )}
            </div>
            <p className="text-xs text-muted mt-3">Les cles API ne sont pas exposees par l API actuelle.</p>
          </section>

          <section id="livraisons" className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest">Livraisons</p>
                <h2 className="text-lg font-serif font-semibold text-ink">Parametres actuels</h2>
              </div>
              <Truck className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-beige-100 border border-beige-300 rounded-2xl p-3">
                <p className="text-xs text-muted uppercase tracking-widest">Frais standard</p>
                <p className="text-sm font-semibold text-ink mt-2">{shipping ? `${fmtMoney(shipping.default_cost)} FCFA` : '—'}</p>
              </div>
              <div className="bg-beige-100 border border-beige-300 rounded-2xl p-3">
                <p className="text-xs text-muted uppercase tracking-widest">Gratuite des</p>
                <p className="text-sm font-semibold text-ink mt-2">{shipping ? `${fmtMoney(shipping.free_threshold)} FCFA` : '—'}</p>
              </div>
              <div className="bg-beige-100 border border-beige-300 rounded-2xl p-3">
                <p className="text-xs text-muted uppercase tracking-widest">Statut</p>
                <p className="text-sm font-semibold text-ink mt-2">{shipping?.is_enabled ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="bg-beige-100 border border-beige-300 rounded-2xl p-3">
                <p className="text-xs text-muted uppercase tracking-widest">Zones</p>
                <p className="text-sm font-semibold text-ink mt-2">Non configurees</p>
              </div>
            </div>
          </section>

          <section id="notifications" className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest">Notifications</p>
                <h2 className="text-lg font-serif font-semibold text-ink">Canaux</h2>
              </div>
              <Bell className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['Nouvelle commande', 'Paiement recu', 'Livraison expediee', 'Promotions'].map((label) => (
                <div key={label} className="flex items-center justify-between bg-beige-100 border border-beige-300 rounded-2xl px-3 py-2 text-xs text-muted">
                  <span>{label}</span>
                  <span className="text-[11px] font-semibold bg-beige-200 px-2.5 py-1 rounded-full">Indisponible</span>
                </div>
              ))}
            </div>
          </section>

          <section id="securite" className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest">Securite</p>
                <h2 className="text-lg font-serif font-semibold text-ink">Protection compte</h2>
              </div>
              <Shield className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button disabled className="flex items-center gap-2 px-3 py-2 rounded-xl bg-beige-100 border border-beige-300 text-xs text-muted">
                <KeyRound className="w-4 h-4" strokeWidth={1.5} />
                Changer mot de passe (non disponible)
              </button>
              <button disabled className="flex items-center gap-2 px-3 py-2 rounded-xl bg-beige-100 border border-beige-300 text-xs text-muted">
                <Lock className="w-4 h-4" strokeWidth={1.5} />
                Double authentification
              </button>
              <button disabled className="flex items-center gap-2 px-3 py-2 rounded-xl bg-beige-100 border border-beige-300 text-xs text-muted">
                <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                Sessions actives
              </button>
            </div>
          </section>

          <section id="utilisateurs" className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest">Utilisateurs & roles</p>
                <h2 className="text-lg font-serif font-semibold text-ink">Administrateurs</h2>
              </div>
              <Users className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            </div>
            <div className="text-xs text-muted">Gestion des roles non disponible via API actuelle.</div>
          </section>

          <section id="apparence" className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest">Apparence</p>
                <h2 className="text-lg font-serif font-semibold text-ink">Theme & styles</h2>
              </div>
              <Palette className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Couleur principale" />
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Style boutons" />
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Mode clair/sombre" />
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Homepage" />
            </div>
          </section>

          <section id="seo" className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest">SEO</p>
                <h2 className="text-lg font-serif font-semibold text-ink">Visibilite</h2>
              </div>
              <Search className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            </div>
            <div className="text-xs text-muted">Parametres SEO non disponibles via API actuelle.</div>
          </section>

          <section id="reseaux" className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest">Reseaux sociaux</p>
                <h2 className="text-lg font-serif font-semibold text-ink">Liens officiels</h2>
              </div>
              <Upload className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Instagram" />
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="Facebook" />
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="TikTok" />
              <input disabled className="px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-muted" placeholder="WhatsApp" />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
