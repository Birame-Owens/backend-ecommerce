import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { NIcon } from '@/components/client/NIcon'
import { checkoutApi, type OrderDetail } from '@/api/client/checkout'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' F' }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function CheckoutSuccessPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const orderNumber = params.get('order')
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  function fetchOrder() {
    if (!orderNumber) { setLoading(false); return }
    setFetchError(false)
    setLoading(true)
    checkoutApi.getOrder(orderNumber)
      .then((res) => { if (res.data.success) setOrder(res.data.data) })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrder() }, [orderNumber])

  const articles = order?.articles_commandes ?? order?.articles ?? []
  const prenom = order?.client?.prenom ?? ''
  const nom = order?.client?.nom ?? ''
  const clientName = [prenom, nom].filter(Boolean).join(' ')

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur-xl border-b border-line">
        <div className="flex items-center h-14 px-4">
          <span className="font-serif font-semibold text-[17px] text-ink">Commande confirmée</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-10 md:py-16">

        {/* Success icon + heading */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-ok/15 flex items-center justify-center mx-auto mb-5" aria-hidden="true">
            <NIcon name="shield" size={38} strokeWidth={1.5} className="text-ok" />
          </div>
          <h1 className="font-serif font-bold text-[26px] md:text-[32px] text-ink mb-2">
            {clientName ? `Merci ${clientName} !` : 'Merci pour votre commande !'}
          </h1>
          <p className="text-[14px] text-muted max-w-sm mx-auto leading-relaxed">
            Votre commande a été confirmée. Notre équipe vous contactera pour la livraison.
          </p>
        </div>

        {/* Order content */}
        {loading ? (
          <div className="flex justify-center py-8" role="status" aria-label="Chargement">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-[18px] border border-line p-5 mb-8 text-center" role="alert">
            {orderNumber && <p className="text-[14px] font-bold text-ink font-mono mb-2">#{orderNumber}</p>}
            <p className="text-[12px] text-muted mb-3">Impossible de charger les détails.</p>
            <button onClick={fetchOrder} className="text-[12px] font-semibold text-accent underline hover:no-underline">
              Réessayer
            </button>
          </div>
        ) : order ? (
          <div className="bg-white rounded-[18px] border border-line shadow-sm overflow-hidden mb-6">

            {/* Order header */}
            <div className="px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-0.5">Commande</p>
                <p className="text-[16px] font-bold text-ink font-mono">#{order.numero_commande}</p>
              </div>
              {order.created_at && (
                <p className="text-[12px] text-muted">{fmtDate(order.created_at)}</p>
              )}
            </div>

            {/* Articles */}
            {articles.length > 0 && (
              <div className="px-5 py-4 border-b border-line space-y-3">
                {articles.map((article) => {
                  const imgUrl = article.produit?.images_produits?.[0]?.url
                  return (
                    <div key={article.id} className="flex gap-3 items-start">
                      <div className="w-12 h-14 flex-shrink-0 rounded-[8px] overflow-hidden bg-sand">
                        {imgUrl
                          ? <img src={imgUrl} alt={article.nom_produit} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-gradient-to-br from-sand to-camel/20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-ink leading-snug line-clamp-2">{article.nom_produit}</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          Qté {article.quantite}
                          {article.couleur_choisie ? ` · ${article.couleur_choisie}` : ''}
                          {article.taille_choisie ? ` · ${article.taille_choisie}` : ''}
                        </p>
                        <p className="text-[12px] font-semibold text-ink mt-0.5 tabular-nums">
                          {fmt(article.prix_unitaire)} × {article.quantite}
                        </p>
                      </div>
                      <span className="text-[13px] font-bold text-ink tabular-nums flex-shrink-0">
                        {fmt(article.prix_total_article)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Totals */}
            <div className="px-5 py-4 space-y-2">
              <div className="flex justify-between text-[13px] text-muted">
                <span>Sous-total</span>
                <span className="tabular-nums">{fmt(order.sous_total)}</span>
              </div>
              {order.remise > 0 && (
                <div className="flex justify-between text-[13px] text-ok font-medium">
                  <span>Réduction</span>
                  <span className="tabular-nums">-{fmt(order.remise)}</span>
                </div>
              )}
              <div className="flex justify-between text-[13px] text-muted">
                <span>
                  Livraison
                  {order.zone_livraison_nom
                    ? <span className="text-[11px] ml-1 text-muted/70">({order.zone_livraison_nom})</span>
                    : null}
                </span>
                <span className={`tabular-nums font-medium ${order.frais_livraison === 0 ? 'text-ok' : ''}`}>
                  {order.frais_livraison === 0 ? 'Gratuit' : fmt(order.frais_livraison)}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-t border-line pt-3 mt-1">
                <span className="font-bold text-[15px] text-ink">Total</span>
                <span className="font-bold text-[22px] text-accent tabular-nums">{fmt(order.montant_total)}</span>
              </div>
            </div>
          </div>
        ) : orderNumber ? (
          <div className="bg-white rounded-[18px] border border-line p-5 mb-6 text-center">
            <p className="text-[14px] font-bold text-ink font-mono">#{orderNumber}</p>
            <p className="text-[12px] text-muted mt-1">Commande enregistrée</p>
          </div>
        ) : null}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-[10px]
              bg-accent text-white text-[13px] font-semibold hover:bg-accent-dark transition-colors"
          >
            <NIcon name="home" size={16} strokeWidth={2} aria-hidden="true" />
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
      </main>
    </>
  )
}
