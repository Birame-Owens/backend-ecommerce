import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { NIcon } from '@/components/client/NIcon'
import { useCartStore, cartSubtotal, cartTotal, cartCount } from '@/store/cartStore'
import { checkoutApi } from '@/api/client/checkout'
import { useToastStore } from '@/store/toastStore'
import { useClientAuthStore } from '@/store/clientAuthStore'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }

type PaymentMethod = 'wave' | 'orange_money'

interface CheckoutForm {
  nom: string
  prenom: string
  email: string
  telephone: string
  adresse: string
  ville: string
  notes?: string
}

/* ─── Breadcrumb ───────────────────────────────────────────────── */
function Breadcrumb() {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted mb-6">
      <button onClick={() => navigate('/panier')} className="hover:text-ink transition-colors">Panier</button>
      <NIcon name="fwd" size={11} />
      <span className="text-ink font-semibold">Paiement</span>
      <NIcon name="fwd" size={11} />
      <span>Confirmation</span>
    </div>
  )
}

/* ─── Payment method radio card ────────────────────────────────── */
function PaymentCard({
  value, selected, onSelect, logo, label, description,
}: {
  value: PaymentMethod
  selected: boolean
  onSelect: (v: PaymentMethod) => void
  logo: string
  label: string
  description: string
}) {
  return (
    <label
      className={`flex items-center gap-4 p-4 rounded-[12px] border-2 cursor-pointer transition-all
        ${selected ? 'border-accent bg-accent/5' : 'border-line bg-white hover:border-accent/40'}`}
    >
      <input
        type="radio"
        name="payment"
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <img src={logo} alt={label} className="h-9 w-16 object-contain rounded-[6px] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-ink">{label}</p>
        <p className="text-[11.5px] text-muted mt-0.5">{description}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
        ${selected ? 'border-accent bg-accent' : 'border-line'}`}>
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
    </label>
  )
}

/* ─── Page ─────────────────────────────────────────────────────── */
export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, coupon, clearCart } = useCartStore()
  const toast = useToastStore((s) => s.show)
  const { user, isAuthenticated } = useClientAuthStore()

  const subtotal = cartSubtotal(items)
  const total = cartTotal(items, coupon)
  const count = cartCount(items)

  const [payMethod, setPayMethod] = useState<PaymentMethod>('wave')
  const [processing, setProcessing] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CheckoutForm>()

  useEffect(() => {
    if (isAuthenticated && user) {
      const parts = user.nom_complet?.split(' ') ?? []
      setValue('prenom', parts[0] ?? '')
      setValue('nom', parts.slice(1).join(' ') ?? '')
      setValue('email', user.email ?? '')
      setValue('telephone', user.telephone ?? '')
      setValue('ville', user.ville ?? '')
    }
  }, [isAuthenticated, user, setValue])

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-[15px] font-semibold text-ink mb-4">Votre panier est vide.</p>
        <button onClick={() => navigate('/categories')}
          className="inline-flex items-center gap-2 px-6 h-11 rounded-[10px] bg-accent text-white
            text-[12px] font-semibold tracking-widest uppercase hover:bg-accent-dark transition-colors">
          Explorer les collections
        </button>
      </div>
    )
  }

  async function onSubmit(data: CheckoutForm) {
    setProcessing(true)
    setServerError('')
    try {
      const orderPayload = {
        customer: {
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          telephone: data.telephone,
          adresse_livraison: data.adresse,
          ville: data.ville,
          pays: 'Sénégal',
        },
        items: items.map((i) => ({
          product_id: i.id,
          quantity: i.qty,
          options: { taille: i.taille, couleur: i.couleur },
        })),
        coupon_code: coupon?.code,
        notes: data.notes,
      }

      const orderRes = await checkoutApi.createOrder(orderPayload)
      if (!orderRes.data.success) {
        setServerError(orderRes.data.message ?? 'Erreur lors de la création de la commande')
        return
      }

      const orderNumber = orderRes.data.data.commande.numero_commande

      const payRes = await checkoutApi.initiatePayment(orderNumber, {
        provider: payMethod,
        phone: data.telephone,
        first_name: data.prenom,
        last_name: data.nom,
      })

      if (!payRes.data.success) {
        setServerError(payRes.data.message ?? 'Erreur lors du paiement')
        return
      }

      clearCart()

      if (payRes.data.payment_url && payRes.data.payment_url !== '#') {
        window.location.href = payRes.data.payment_url
      } else {
        toast('Commande créée !', 'check')
        navigate(`/checkout/success?order=${orderNumber}`)
      }
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? (e.response?.data?.message as string | undefined) : undefined
      setServerError(msg ?? 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur-xl border-b border-line">
        <div className="flex items-center h-14 px-4 gap-3">
          <button onClick={() => navigate('/panier')}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-sand transition-colors">
            <NIcon name="back" size={20} strokeWidth={1.8} />
          </button>
          <span className="flex-1 font-serif font-semibold text-[17px] text-ink">Paiement</span>
          <span className="text-[12px] text-muted">{count} art.</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Desktop heading + breadcrumb */}
        <div className="hidden md:block mb-8">
          <Breadcrumb />
          <h1 className="font-serif font-bold text-[34px] text-ink leading-none">Validation de commande</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">

          {/* ─── Left: form ─── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Server error */}
            {serverError && (
              <div role="alert" className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-[12px]">
                <NIcon name="close" size={16} strokeWidth={2} className="text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-red-700">{serverError}</p>
                </div>
                <button type="button" onClick={() => setServerError('')} aria-label="Fermer l'erreur"
                  className="text-red-300 hover:text-red-500">
                  <NIcon name="close" size={14} strokeWidth={2} />
                </button>
              </div>
            )}

            {/* 1. Informations personnelles */}
            <section className="bg-white rounded-[18px] border border-line shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-line">
                <NIcon name="user" size={18} strokeWidth={1.8} className="text-accent" aria-hidden="true" />
                <h2 className="font-serif font-semibold text-[17px] text-ink">Informations</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="co-nom" label="Nom" error={errors.nom?.message}>
                  <input id="co-nom" {...register('nom', { required: 'Requis' })}
                    placeholder="DIOP" autoComplete="family-name"
                    aria-invalid={!!errors.nom} aria-describedby={errors.nom ? 'co-nom-err' : undefined}
                    className={inputCls(!!errors.nom)} />
                </Field>
                <Field id="co-prenom" label="Prénom" error={errors.prenom?.message}>
                  <input id="co-prenom" {...register('prenom', { required: 'Requis' })}
                    placeholder="Amadou" autoComplete="given-name"
                    aria-invalid={!!errors.prenom} aria-describedby={errors.prenom ? 'co-prenom-err' : undefined}
                    className={inputCls(!!errors.prenom)} />
                </Field>
              </div>

              <Field id="co-email" label="Email" error={errors.email?.message}>
                <input id="co-email" {...register('email', {
                  required: 'Requis',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' }
                })}
                  type="email" placeholder="email@exemple.com" autoComplete="email"
                  aria-invalid={!!errors.email} aria-describedby={errors.email ? 'co-email-err' : undefined}
                  className={inputCls(!!errors.email)} />
              </Field>

              <Field id="co-tel" label="Téléphone" error={errors.telephone?.message}>
                <input id="co-tel" {...register('telephone', {
                  required: 'Requis',
                  pattern: { value: /^[0-9+\s]{9,15}$/, message: 'Format invalide (ex: 77 000 00 00)' }
                })}
                  type="tel" placeholder="77 000 00 00" autoComplete="tel"
                  aria-invalid={!!errors.telephone} aria-describedby={errors.telephone ? 'co-tel-err' : undefined}
                  className={inputCls(!!errors.telephone)} />
              </Field>
            </section>

            {/* 2. Livraison */}
            <section className="bg-white rounded-[18px] border border-line shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-line">
                <NIcon name="pin" size={18} strokeWidth={1.8} className="text-accent" aria-hidden="true" />
                <h2 className="font-serif font-semibold text-[17px] text-ink">Livraison</h2>
              </div>

              <Field id="co-adresse" label="Adresse complète" error={errors.adresse?.message}>
                <textarea id="co-adresse" {...register('adresse', { required: 'Requis' })}
                  rows={2} placeholder="Quartier, rue, numéro de porte..."
                  aria-invalid={!!errors.adresse} aria-describedby={errors.adresse ? 'co-adresse-err' : undefined}
                  className={`${inputCls(!!errors.adresse)} resize-none`} />
              </Field>

              <Field id="co-ville" label="Ville" error={errors.ville?.message}>
                <input id="co-ville" {...register('ville', { required: 'Requis' })}
                  placeholder="Dakar" autoComplete="address-level2"
                  aria-invalid={!!errors.ville} aria-describedby={errors.ville ? 'co-ville-err' : undefined}
                  className={inputCls(!!errors.ville)} />
              </Field>

              <Field id="co-notes" label="Notes (optionnel)">
                <textarea id="co-notes" {...register('notes')}
                  rows={2} placeholder="Instructions particulières pour la livraison..."
                  className={`${inputCls(false)} resize-none`} />
              </Field>
            </section>

            {/* 3. Méthode de paiement */}
            <section className="bg-white rounded-[18px] border border-line shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-line">
                <NIcon name="card" size={18} strokeWidth={1.8} className="text-accent" />
                <h2 className="font-serif font-semibold text-[17px] text-ink">Paiement</h2>
              </div>

              <div className="space-y-3">
                <PaymentCard
                  value="wave"
                  selected={payMethod === 'wave'}
                  onSelect={setPayMethod}
                  logo="/wave-senegal.png"
                  label="Wave"
                  description="Paiement mobile instantané via Wave"
                />
                <PaymentCard
                  value="orange_money"
                  selected={payMethod === 'orange_money'}
                  onSelect={setPayMethod}
                  logo="/2017-09-Ligne14.Argent.OrangeMoney.png"
                  label="Orange Money"
                  description="Paiement sécurisé via Orange Money"
                />
              </div>
            </section>

            {/* Submit */}
            <button
              type="submit"
              disabled={processing}
              className="w-full flex items-center justify-center gap-2.5 h-14 rounded-[12px]
                bg-accent text-white text-[14px] font-bold tracking-wide
                hover:bg-accent-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <NIcon name="lock" size={18} strokeWidth={2} />
                  Payer {fmt(total)}
                </>
              )}
            </button>

            <p className="text-[11px] text-muted text-center flex items-center justify-center gap-1.5">
              <NIcon name="lock" size={12} strokeWidth={2} />
              Transaction sécurisée via NabooPay
            </p>
          </form>

          {/* ─── Right: order summary ─── */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-[18px] border border-line shadow-sm p-5 sm:p-6">
              <h3 className="font-serif font-bold text-[18px] text-ink mb-4 pb-3 border-b border-line">
                Votre commande
              </h3>

              {/* Items */}
              <div className="space-y-3 max-h-[280px] overflow-y-auto mb-4 pr-1">
                {items.map((item) => (
                  <div key={item.key} className="flex gap-3">
                    <div className="w-14 h-[70px] flex-shrink-0 rounded-[8px] overflow-hidden bg-sand">
                      {item.image
                        ? <img src={item.image} alt={item.nom} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-sand to-camel/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-ink line-clamp-2 leading-snug">{item.nom}</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        ×{item.qty}
                        {item.couleur ? ` · ${item.couleur}` : ''}
                        {item.taille ? ` · ${item.taille}` : ''}
                      </p>
                    </div>
                    <span className="text-[12.5px] font-semibold text-ink tabular-nums flex-shrink-0">
                      {fmt(item.prix * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-line pt-3 space-y-1.5 mb-3">
                <div className="flex justify-between text-[13px] text-muted">
                  <span>Sous-total</span>
                  <span className="tabular-nums">{fmt(subtotal)}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-[13px] text-ok font-medium">
                    <span>Réduction ({coupon.code})</span>
                    <span className="tabular-nums">-{fmt(coupon.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[13px] text-muted">
                  <span>Livraison</span>
                  <span className="font-medium text-ok">À confirmer</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline border-t border-line pt-3">
                <span className="font-semibold text-[15px] text-ink">Total</span>
                <span className="font-bold text-[22px] text-accent tabular-nums">{fmt(total)}</span>
              </div>
            </div>

            {/* Modify cart link */}
            <button
              onClick={() => navigate('/panier')}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px]
                border border-line text-[12px] font-semibold text-muted
                hover:text-ink hover:border-ink transition-colors"
            >
              <NIcon name="back" size={14} strokeWidth={2} />
              Modifier le panier
            </button>

            {/* Reassurance */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: 'shield', label: 'Paiement sécurisé' },
                { icon: 'truck', label: 'Livraison Dakar' },
                { icon: 'lock', label: 'Données protégées' },
              ].map((it) => (
                <div key={it.icon}
                  className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-[12px] border border-line text-center">
                  <span className="text-accent"><NIcon name={it.icon} size={16} strokeWidth={1.6} /></span>
                  <span className="text-[10px] font-semibold text-ink leading-tight">{it.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Helpers ──────────────────────────────────────────────────── */
function inputCls(hasError: boolean) {
  return `w-full h-11 px-4 rounded-[10px] border text-[13.5px] bg-white
    focus:outline-none transition-colors
    ${hasError ? 'border-red-300 focus:border-red-400' : 'border-line focus:border-accent'}`
}

function Field({ id, label, error, children }: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
      {error && <p id={`${id}-err`} role="alert" className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}
