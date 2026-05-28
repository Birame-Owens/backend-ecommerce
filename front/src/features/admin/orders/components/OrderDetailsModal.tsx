import { useEffect, useState } from 'react'
import { CreditCard, Mail, MessageCircle, Package, Phone, Ruler, X } from 'lucide-react'
import type { AdminOrderDetail } from '@/types/admin'
import { fmtMoney, statusBadge, statusLabels, statusOrder } from '../orderHelpers'

interface Props {
  order: AdminOrderDetail | null
  loading: boolean
  onClose: () => void
  onUpdateStatus: (statut: string) => void
  updating: boolean
  onOpenPayment: (order: AdminOrderDetail) => void
}

export function OrderDetailsModal({
  order,
  loading,
  onClose,
  onUpdateStatus,
  updating,
  onOpenPayment,
}: Props) {
  const [nextStatus, setNextStatus] = useState(order?.statut ?? 'en_attente')

  useEffect(() => {
    setNextStatus(order?.statut ?? 'en_attente')
  }, [order?.statut])

  if (!order && !loading) return null

  const currentIndex = order?.statut === 'annulee'
    ? -1
    : statusOrder.indexOf(order?.statut ?? 'en_attente')

  const phone = order?.client_details?.telephone || order?.client?.telephone || ''
  const email = order?.client_details?.email

  return (
    <div className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-beige-50 w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl border border-beige-300 shadow-beige-lg">
        <div className="p-6 border-b border-beige-300 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">Commande</p>
            <h2 className="text-2xl font-serif font-bold text-ink mt-1">
              {order?.numero_commande ?? 'Chargement…'}
            </h2>
            <p className="text-sm text-muted mt-1">
              {order?.date_commande ?? '—'} · {order?.nb_articles ?? 0} article(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 bg-beige-200 rounded animate-pulse" />
            ))}
          </div>
        ) : order && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-ink">Client & livraison</h3>
                  <span className="text-[11px] text-muted">{order.client_details?.ville ?? '—'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted">Destinataire</p>
                    <p className="font-semibold text-ink">{order.nom_destinataire}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Telephone</p>
                    <p className="font-semibold text-ink">{order.telephone_livraison}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted">Adresse</p>
                    <p className="font-semibold text-ink">{order.adresse_livraison}</p>
                  </div>
                  {order.instructions_livraison && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted">Instructions</p>
                      <p className="text-xs bg-beige-50 border border-beige-300 rounded-xl p-3">{order.instructions_livraison}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <a
                    href={phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : undefined}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 flex items-center gap-2 ${phone ? 'hover:bg-beige-200' : 'opacity-50 pointer-events-none'}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
                    WhatsApp
                  </a>
                  <a
                    href={phone ? `tel:${phone}` : undefined}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 flex items-center gap-2 ${phone ? 'hover:bg-beige-200' : 'opacity-50 pointer-events-none'}`}
                  >
                    <Phone className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                    Appeler
                  </a>
                  <a
                    href={email ? `mailto:${email}` : undefined}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border border-beige-300 flex items-center gap-2 ${email ? 'hover:bg-beige-200' : 'opacity-50 pointer-events-none'}`}
                  >
                    <Mail className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                    Email
                  </a>
                </div>

                {order.client_details?.mesures_client?.mesures && (
                  <div className="mt-4 bg-beige-50 border border-beige-300 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-ink flex items-center gap-2"><Ruler className="w-4 h-4" /> Mesures client</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-muted">
                      {Object.entries(order.client_details.mesures_client.mesures).map(([key, value]) => (
                        value ? (
                          <div key={key} className="px-2 py-1 rounded-lg bg-beige-100">
                            {key.replace(/_/g, ' ')}: {value}cm
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Articles</h3>
                <div className="space-y-4">
                  {order.articles.map((article) => (
                    <div key={article.id} className="border border-beige-300 rounded-2xl p-4 bg-beige-50">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-beige-200 flex items-center justify-center flex-shrink-0">
                          {article.produit.image
                            ? <img src={article.produit.image} alt={article.produit.nom} className="w-full h-full object-cover" />
                            : <Package className="w-5 h-5 text-beige-400" strokeWidth={1.5} />
                          }
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-ink">{article.produit.nom}</p>
                          <p className="text-xs text-muted">
                            {article.quantite} × {fmtMoney(article.prix_unitaire)} FCFA
                            {article.taille_choisie ? ` · Taille ${article.taille_choisie}` : ''}
                            {article.couleur_choisie ? ` · ${article.couleur_choisie}` : ''}
                          </p>
                          {article.demandes_personnalisation && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2 mt-2">
                              {article.demandes_personnalisation}
                            </p>
                          )}
                          {article.mesures_formatted && article.mesures_formatted.length > 0 && (
                            <div className="mt-3 bg-beige-50 border border-beige-300 rounded-xl p-3">
                              <p className="text-xs font-semibold text-ink flex items-center gap-2"><Ruler className="w-3.5 h-3.5" /> Mesures utilisees</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-[11px] text-muted">
                                {article.mesures_formatted.map((m) => (
                                  <span key={m.affichage} className="px-2 py-1 rounded-lg bg-beige-100">{m.affichage}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-ink">{fmtMoney(article.prix_total)} FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {order.production_info && (
                <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                  <h3 className="text-sm font-semibold text-ink mb-3">Production</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted">
                    <div className="bg-beige-50 rounded-xl border border-beige-300 p-3">
                      <p className="text-ink font-semibold">{order.production_info.articles_avec_mesures}</p>
                      <p>Sur mesure</p>
                    </div>
                    <div className="bg-beige-50 rounded-xl border border-beige-300 p-3">
                      <p className="text-ink font-semibold">{order.production_info.articles_taille_standard}</p>
                      <p>Taille standard</p>
                    </div>
                    <div className="bg-beige-50 rounded-xl border border-beige-300 p-3">
                      <p className="text-ink font-semibold">{order.production_info.delai_production_estime} j</p>
                      <p>Delai estime</p>
                    </div>
                    <div className="bg-beige-50 rounded-xl border border-beige-300 p-3">
                      <p className="text-ink font-semibold">{order.production_info.difficulte_globale}</p>
                      <p>Difficulte</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Statut & actions</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold ${statusBadge(order.statut)}`}>
                  {statusLabels[order.statut] ?? order.statut}
                </span>

                {order.statut !== 'annulee' && (
                  <div className="mt-4 space-y-3">
                    {statusOrder.map((step, idx) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${idx <= currentIndex ? 'bg-beige-500' : 'bg-beige-300'}`} />
                        <div className="flex-1 h-1 rounded-full bg-beige-200 overflow-hidden">
                          <div className={`h-full ${idx <= currentIndex ? 'bg-beige-400' : 'bg-beige-200'}`} />
                        </div>
                        <span className={`text-[11px] font-semibold ${idx <= currentIndex ? 'text-ink' : 'text-muted'}`}>
                          {statusLabels[step]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-50 border border-beige-300 text-muted focus:outline-none focus:border-beige-400"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => onUpdateStatus(nextStatus)}
                    disabled={updating || nextStatus === order.statut}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-beige-500 text-white hover:bg-beige-400 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Mise a jour…' : 'Mettre a jour'}
                  </button>
                </div>
              </div>

              <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Resume financier</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Sous-total</span><span>{fmtMoney(order.sous_total)} FCFA</span></div>
                  <div className="flex justify-between"><span>Livraison</span><span>{fmtMoney(order.frais_livraison)} FCFA</span></div>
                  <div className="flex justify-between"><span>Remise</span><span>- {fmtMoney(order.remise)} FCFA</span></div>
                  <div className="flex justify-between font-semibold text-ink border-t border-beige-300 pt-2"><span>Total</span><span>{fmtMoney(order.montant_total)} FCFA</span></div>
                  <div className="flex justify-between text-xs text-muted"><span>Montant paye</span><span>{fmtMoney(order.montant_paye)} FCFA</span></div>
                  {order.montant_restant > 0 && (
                    <div className="flex justify-between text-xs text-rose-600"><span>Reste</span><span>{fmtMoney(order.montant_restant)} FCFA</span></div>
                  )}
                </div>
              </div>

              <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2"><CreditCard className="w-4 h-4" /> Paiements</h3>
                  {order.montant_restant > 0 && (
                    <button
                      onClick={() => onOpenPayment(order)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-beige-500 text-white hover:bg-beige-400"
                    >
                      + Paiement
                    </button>
                  )}
                </div>
                {order.paiements.length === 0 ? (
                  <p className="text-xs text-muted">Aucun paiement enregistre.</p>
                ) : (
                  <div className="space-y-2">
                    {order.paiements.map((p) => (
                      <div key={p.id} className="bg-beige-50 border border-beige-300 rounded-xl p-3 text-xs">
                        <div className="flex justify-between">
                          <span className="font-semibold text-ink">{fmtMoney(p.montant)} FCFA</span>
                          <span className={`px-2 py-0.5 rounded-full ${p.statut === 'valide' ? 'bg-sage/30 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.statut}</span>
                        </div>
                        <p className="text-muted">{p.methode} · {p.date}</p>
                        {p.reference && <p className="text-muted">Ref: {p.reference}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Informations</h3>
                <div className="space-y-2 text-xs text-muted">
                  <p><span className="text-ink">Priorite:</span> {order.priorite}</p>
                  <p><span className="text-ink">Mode livraison:</span> {order.mode_livraison ?? '—'}</p>
                  <p><span className="text-ink">Source:</span> {order.source ?? '—'}</p>
                  {order.date_livraison_prevue && (
                    <p><span className="text-ink">Livraison prevue:</span> {order.date_livraison_prevue}</p>
                  )}
                  {order.est_cadeau && order.message_cadeau && (
                    <p className="bg-beige-50 border border-beige-300 rounded-xl p-2">"{order.message_cadeau}"</p>
                  )}
                  {order.code_promo && (
                    <p><span className="text-ink">Code promo:</span> {order.code_promo}</p>
                  )}
                  {order.notes_admin && (
                    <p className="bg-beige-50 border border-beige-300 rounded-xl p-2">{order.notes_admin}</p>
                  )}
                  {order.notes_client && (
                    <p className="bg-beige-50 border border-beige-300 rounded-xl p-2">{order.notes_client}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
