import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { NIcon } from '@/components/client/NIcon'
import { checkoutApi } from '@/api/client/checkout'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }

interface OrderData {
  numero_commande: string
  statut: string
  montant_total: number
}

const STATUS_LABEL: Record<string, string> = {
  en_attente: 'En attente de paiement',
  confirmee: 'Confirmée',
  en_preparation: 'En préparation',
  prete: 'Prête',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
}

export function CheckoutSuccessPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const orderNumber = params.get('order')
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  function fetchOrder() {
    if (!orderNumber) { setLoading(false); return }
    setFetchError(false)
    setLoading(true)
    checkoutApi.getOrder(orderNumber)
      .then((res) => { if (res.data.success) setOrder(res.data.data as OrderData) })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrder() }, [orderNumber])

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur-xl border-b border-line">
        <div className="flex items-center h-14 px-4">
          <span className="font-serif font-semibold text-[17px] text-ink">Commande confirmée</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10 md:py-16 text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-ok/15 flex items-center justify-center mx-auto mb-6" aria-hidden="true">
          <NIcon name="shield" size={38} strokeWidth={1.5} className="text-ok" />
        </div>

        <h1 className="font-serif font-bold text-[28px] md:text-[34px] text-ink mb-2">
          Merci pour votre commande !
        </h1>
        <p className="text-[14px] text-muted mb-2 max-w-sm mx-auto leading-relaxed">
          Votre commande a bien été enregistrée. Notre équipe vous contactera rapidement pour confirmer la livraison.
        </p>
        <p className="text-[12.5px] text-muted mb-8 max-w-sm mx-auto">
          Un récapitulatif vous sera envoyé par WhatsApp ou email.
        </p>

        {/* Order card */}
        {loading ? (
          <div className="flex justify-center mb-8" role="status" aria-label="Chargement de la commande">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-[18px] border border-line shadow-sm p-5 mb-8" role="alert">
            {orderNumber && (
              <p className="text-[14px] font-bold text-ink font-mono mb-2">#{orderNumber}</p>
            )}
            <p className="text-[12px] text-muted mb-3">Impossible de charger les détails de la commande.</p>
            <button
              onClick={fetchOrder}
              className="text-[12px] font-semibold text-accent underline hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        ) : order ? (
          <div className="bg-white rounded-[18px] border border-line shadow-sm p-5 mb-8 text-left space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-semibold uppercase tracking-widest text-muted">Commande</span>
              <span className="text-[13px] font-bold text-ink font-mono">#{order.numero_commande}</span>
            </div>
            <div className="flex justify-between items-center border-t border-line pt-3">
              <span className="text-[12px] text-muted">Statut</span>
              <span className="text-[12px] font-semibold text-ok">
                {STATUS_LABEL[order.statut] ?? order.statut}
              </span>
            </div>
            {order.montant_total > 0 && (
              <div className="flex justify-between items-center border-t border-line pt-3">
                <span className="text-[12px] text-muted">Total payé</span>
                <span className="text-[15px] font-bold text-ink tabular-nums">{fmt(order.montant_total)}</span>
              </div>
            )}
          </div>
        ) : orderNumber ? (
          <div className="bg-white rounded-[18px] border border-line shadow-sm p-5 mb-8">
            <p className="text-[14px] font-bold text-ink font-mono">#{orderNumber}</p>
            <p className="text-[12px] text-muted mt-1">Commande enregistrée avec succès</p>
          </div>
        ) : null}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-[10px]
              bg-accent text-white text-[13px] font-semibold hover:bg-accent-dark transition-colors"
          >
            Retour à l'accueil
          </button>
          <button
            onClick={() => navigate('/compte')}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-[10px]
              border border-line text-[13px] font-semibold text-ink hover:bg-sand transition-colors"
          >
            <NIcon name="user" size={15} strokeWidth={2} aria-hidden="true" />
            Voir mes commandes
          </button>
        </div>
        <button
          onClick={() => navigate('/categories')}
          className="mt-3 text-[12px] text-muted hover:text-ink underline transition-colors"
        >
          Continuer mes achats
        </button>
      </main>
    </>
  )
}
