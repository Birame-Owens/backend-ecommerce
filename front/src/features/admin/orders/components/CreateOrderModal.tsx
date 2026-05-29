import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, MapPin, Package, Search, Trash2, User, X, CreditCard, Clock } from 'lucide-react'
import { ordersAdminApi } from '@/api/admin/orders'
import type {
  AdminOrderClientOption,
  AdminOrderCreatePayload,
  AdminOrderDetail,
  AdminOrderProductOption,
} from '@/types/admin'
import { fmtMoney } from '../orderHelpers'

interface Props {
  onClose: () => void
  onCreated: (order: AdminOrderDetail) => void
  onError: (message: string) => void
}

function getVariants(produit: AdminOrderProductOption | undefined, selectedColor: string) {
  if (!produit) return { colorOptions: null, sizeOptions: null, isMapMode: false }

  const isMapMode = !!(produit.couleur_tailles && Object.keys(produit.couleur_tailles).length > 0)

  let colorOptions: string[] | null = null
  if (isMapMode) {
    colorOptions = Object.keys(produit.couleur_tailles!)
  } else if (produit.couleurs_disponibles?.length) {
    colorOptions = produit.couleurs_disponibles
  }

  let sizeOptions: string[] | null = null
  if (isMapMode) {
    if (selectedColor) {
      const sizes = produit.couleur_tailles![selectedColor] ?? []
      sizeOptions = sizes.length > 0 ? sizes : null
    }
  } else if (produit.tailles_disponibles?.length) {
    sizeOptions = produit.tailles_disponibles
  }

  return { colorOptions, sizeOptions, isMapMode }
}

function getVariantStock(
  produit: AdminOrderProductOption | undefined,
  color: string,
  taille: string,
): number | null {
  if (!produit?.couleur_tailles_stock || !color || !taille) return null
  return produit.couleur_tailles_stock[color]?.[taille] ?? null
}

export function CreateOrderModal({ onClose, onCreated, onError }: Props) {
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing')
  const [clientSearch, setClientSearch] = useState('')
  const [clientLoading, setClientLoading] = useState(false)
  const [clients, setClients] = useState<AdminOrderClientOption[]>([])
  const [selectedClient, setSelectedClient] = useState<AdminOrderClientOption | null>(null)

  const [productSearch, setProductSearch] = useState('')
  const [productLoading, setProductLoading] = useState(false)
  const [products, setProducts] = useState<AdminOrderProductOption[]>([])

  const [form, setForm] = useState({
    nom_destinataire: '',
    telephone_livraison: '',
    adresse_livraison: '',
    instructions_livraison: '',
    mode_livraison: 'domicile',
    date_livraison_prevue: '',
    priorite: 'normale',
    frais_livraison: 0,
    remise: 0,
    notes_client: '',
    notes_admin: '',
    est_cadeau: false,
    message_cadeau: '',
    code_promo: '',
    new_client_nom: '',
    new_client_telephone: '',
    new_client_email: '',
    new_client_adresse: '',
    new_client_ville: '',
  })

  const [articles, setArticles] = useState<Array<{
    id: number
    produit_id: number | ''
    prix_unitaire: number
    quantite: number
    taille: string
    couleur: string
    instructions: string
    utilise_mesures_client: boolean
  }>>([
    { id: Date.now(), produit_id: '', prix_unitaire: 0, quantite: 1, taille: '', couleur: '', instructions: '', utilise_mesures_client: false },
  ])

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    const loadClients = async () => {
      setClientLoading(true)
      try {
        const res = await ordersAdminApi.clientsWithMesures({ q: clientSearch || undefined, limit: 20 })
        if (active) setClients(res.data.data.clients)
      } catch {
        if (active) onError('Impossible de charger les clients.')
      } finally {
        if (active) setClientLoading(false)
      }
    }
    const timer = setTimeout(loadClients, clientSearch ? 300 : 0)
    return () => { active = false; clearTimeout(timer) }
  }, [clientSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let active = true
    const loadProducts = async () => {
      setProductLoading(true)
      try {
        const res = await ordersAdminApi.products({ q: productSearch || undefined, limit: 30 })
        if (active) setProducts(res.data.data.produits)
      } catch {
        if (active) onError('Impossible de charger les produits.')
      } finally {
        if (active) setProductLoading(false)
      }
    }
    const timer = setTimeout(loadProducts, productSearch ? 300 : 0)
    return () => { active = false; clearTimeout(timer) }
  }, [productSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedClient) return
    setForm(prev => ({
      ...prev,
      nom_destinataire: prev.nom_destinataire || selectedClient.nom_complet,
      telephone_livraison: prev.telephone_livraison || selectedClient.telephone,
      adresse_livraison: prev.adresse_livraison || selectedClient.adresse_principale || '',
    }))
  }, [selectedClient])

  const handleArticleChange = (id: number, patch: Partial<typeof articles[number]>) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
  }

  const handleProductSelect = (id: number, produitId: number) => {
    const produit = products.find(p => p.id === produitId)
    const prix = produit?.prix_promo ?? produit?.prix ?? 0
    handleArticleChange(id, { produit_id: produitId, prix_unitaire: prix, taille: '', couleur: '' })
  }

  const handleColorChange = (id: number, couleur: string) => {
    const article = articles.find(a => a.id === id)
    if (!article) return
    const produit = productById.get(Number(article.produit_id))
    const { isMapMode } = getVariants(produit, '')
    // En mode map, changer la couleur invalide la taille sélectionnée
    handleArticleChange(id, isMapMode ? { couleur, taille: '' } : { couleur })
  }

  const addArticle = () => {
    setArticles(prev => [...prev, {
      id: Date.now(),
      produit_id: '',
      prix_unitaire: 0,
      quantite: 1,
      taille: '',
      couleur: '',
      instructions: '',
      utilise_mesures_client: false,
    }])
  }

  const removeArticle = (id: number) => {
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  const subtotal = articles.reduce((sum, a) => sum + (Number(a.prix_unitaire) || 0) * (Number(a.quantite) || 0), 0)
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const handleSubmit = async () => {
    if (!form.nom_destinataire || !form.telephone_livraison || !form.adresse_livraison) {
      onError('Veuillez renseigner le destinataire et la livraison.')
      return
    }
    if (articles.some(a => !a.produit_id)) {
      onError('Veuillez choisir un produit pour chaque article.')
      return
    }
    for (const article of articles) {
      const produit = productById.get(Number(article.produit_id))
      if (!produit) continue
      const { colorOptions, sizeOptions } = getVariants(produit, article.couleur)

      if (colorOptions?.length && !article.couleur) {
        onError(`Veuillez choisir une couleur pour "${produit.nom}".`)
        return
      }
      if (sizeOptions?.length && !article.taille) {
        onError(`Veuillez choisir une taille/pointure pour "${produit.nom}".`)
        return
      }
    }
    setSubmitting(true)
    try {
      const payload: AdminOrderCreatePayload = {
        nom_destinataire: form.nom_destinataire,
        telephone_livraison: form.telephone_livraison,
        adresse_livraison: form.adresse_livraison,
        instructions_livraison: form.instructions_livraison || null,
        mode_livraison: form.mode_livraison as AdminOrderCreatePayload['mode_livraison'],
        date_livraison_prevue: form.date_livraison_prevue || null,
        priorite: form.priorite as AdminOrderCreatePayload['priorite'],
        frais_livraison: Number(form.frais_livraison || 0),
        remise: Number(form.remise || 0),
        notes_client: form.notes_client || null,
        notes_admin: form.notes_admin || null,
        est_cadeau: Boolean(form.est_cadeau),
        message_cadeau: form.message_cadeau || null,
        code_promo: form.code_promo || null,
        articles: articles.map(a => ({
          produit_id: Number(a.produit_id),
          quantite: Number(a.quantite || 1),
          prix_unitaire: Number(a.prix_unitaire || 0),
          taille: a.taille || null,
          couleur: a.couleur || null,
          instructions: a.instructions || null,
          utilise_mesures_client: a.utilise_mesures_client || false,
        })),
      }

      if (clientMode === 'existing' && selectedClient) {
        payload.client_id = selectedClient.id
      } else if (clientMode === 'new') {
        payload.new_client = {
          nom_complet: form.new_client_nom,
          telephone: form.new_client_telephone,
          email: form.new_client_email,
          adresse: form.new_client_adresse,
          ville: form.new_client_ville,
        }
      }

      const res = await ordersAdminApi.create(payload)
      onCreated(res.data.data.commande)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      onError(msg ?? 'Création impossible.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-beige-50 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-beige-300 shadow-beige-lg">
        <div className="p-6 border-b border-beige-300 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">Nouvelle commande</p>
            <h2 className="text-2xl font-serif font-bold text-ink mt-1">Créer une commande</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200">
            <X className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Client */}
            <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2"><User className="w-4 h-4" /> Client</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setClientMode('existing')}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${clientMode === 'existing' ? 'bg-beige-500 text-white' : 'bg-beige-200 text-muted'}`}
                  >
                    Existant
                  </button>
                  <button
                    onClick={() => setClientMode('new')}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${clientMode === 'new' ? 'bg-beige-500 text-white' : 'bg-beige-200 text-muted'}`}
                  >
                    Nouveau
                  </button>
                </div>
              </div>

              {clientMode === 'existing' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
                    <input
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Rechercher un client…"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-50 border border-beige-300 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-2">
                    {clientLoading ? (
                      <div className="h-10 bg-beige-200 rounded-xl animate-pulse" />
                    ) : clients.length === 0 ? (
                      <p className="text-xs text-muted">Aucun client</p>
                    ) : clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`w-full text-left px-3 py-2 rounded-xl border ${selectedClient?.id === client.id ? 'border-beige-500 bg-beige-200' : 'border-beige-300 hover:bg-beige-200'}`}
                      >
                        <p className="text-sm font-semibold text-ink">{client.nom_complet}</p>
                        <p className="text-xs text-muted">{client.telephone} {client.email ? `· ${client.email}` : ''}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={form.new_client_nom}
                    onChange={(e) => setForm(prev => ({ ...prev, new_client_nom: e.target.value }))}
                    placeholder="Nom complet"
                    className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                  />
                  <input
                    value={form.new_client_telephone}
                    onChange={(e) => setForm(prev => ({ ...prev, new_client_telephone: e.target.value }))}
                    placeholder="Téléphone"
                    className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                  />
                  <input
                    value={form.new_client_email}
                    onChange={(e) => setForm(prev => ({ ...prev, new_client_email: e.target.value }))}
                    placeholder="Email"
                    className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                  />
                  <input
                    value={form.new_client_ville}
                    onChange={(e) => setForm(prev => ({ ...prev, new_client_ville: e.target.value }))}
                    placeholder="Ville"
                    className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                  />
                  <input
                    value={form.new_client_adresse}
                    onChange={(e) => setForm(prev => ({ ...prev, new_client_adresse: e.target.value }))}
                    placeholder="Adresse"
                    className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink md:col-span-2"
                  />
                </div>
              )}
            </div>

            {/* Livraison */}
            <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
              <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Livraison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={form.nom_destinataire}
                  onChange={(e) => setForm(prev => ({ ...prev, nom_destinataire: e.target.value }))}
                  placeholder="Nom destinataire *"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <input
                  value={form.telephone_livraison}
                  onChange={(e) => setForm(prev => ({ ...prev, telephone_livraison: e.target.value }))}
                  placeholder="Téléphone livraison *"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <input
                  value={form.adresse_livraison}
                  onChange={(e) => setForm(prev => ({ ...prev, adresse_livraison: e.target.value }))}
                  placeholder="Adresse livraison *"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink md:col-span-2"
                />
                <input
                  value={form.instructions_livraison}
                  onChange={(e) => setForm(prev => ({ ...prev, instructions_livraison: e.target.value }))}
                  placeholder="Instructions de livraison"
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink md:col-span-2"
                />
                <select
                  value={form.mode_livraison}
                  onChange={(e) => setForm(prev => ({ ...prev, mode_livraison: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-50 border border-beige-300 text-muted"
                >
                  <option value="domicile">Domicile</option>
                  <option value="boutique">Boutique</option>
                  <option value="magasin">Magasin</option>
                  <option value="point_relais">Point relais</option>
                </select>
                <input
                  type="date"
                  value={form.date_livraison_prevue}
                  onChange={(e) => setForm(prev => ({ ...prev, date_livraison_prevue: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
              </div>
            </div>

            {/* Articles */}
            <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2"><Package className="w-4 h-4" /> Articles</h3>
                <button onClick={addArticle} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-beige-500 text-white hover:bg-beige-400">
                  + Ajouter
                </button>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" strokeWidth={1.5} />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Rechercher un produit…"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-beige-50 border border-beige-300 rounded-xl text-ink"
                />
              </div>

              <div className="space-y-3">
                {articles.map((article) => {
                  const produit = productById.get(Number(article.produit_id))
                  const { colorOptions, sizeOptions, isMapMode } = getVariants(produit, article.couleur)
                  const variantStock = getVariantStock(produit, article.couleur, article.taille)

                  return (
                    <div key={article.id} className="bg-beige-50 border border-beige-300 rounded-2xl p-4">
                      {/* Ligne 1 : Produit + Qté + Prix */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
                        <div className="md:col-span-3">
                          <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Produit *</label>
                          <select
                            value={article.produit_id}
                            onChange={(e) => handleProductSelect(article.id, Number(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
                          >
                            <option value="">Choisir un produit</option>
                            {productLoading ? (
                              <option value="" disabled>Chargement…</option>
                            ) : products.map((p) => (
                              <option key={p.id} value={p.id}>{p.nom}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Qté</label>
                          <input
                            type="number"
                            min={1}
                            value={article.quantite}
                            onChange={(e) => handleArticleChange(article.id, { quantite: Number(e.target.value) })}
                            className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Prix unitaire (FCFA)</label>
                          <input
                            type="number"
                            min={0}
                            value={article.prix_unitaire}
                            onChange={(e) => handleArticleChange(article.id, { prix_unitaire: Number(e.target.value) })}
                            className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
                          />
                        </div>
                      </div>

                      {/* Ligne 2 : Couleur + Taille (seulement si le produit en a) */}
                      {(colorOptions || sizeOptions || isMapMode) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          {colorOptions && (
                            <div>
                              <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">
                                Couleur {colorOptions.length > 0 ? '*' : ''}
                              </label>
                              <select
                                value={article.couleur}
                                onChange={(e) => handleColorChange(article.id, e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
                              >
                                <option value="">— Choisir une couleur</option>
                                {colorOptions.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {(sizeOptions || isMapMode) && (
                            <div>
                              <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">
                                Taille / Pointure {sizeOptions?.length ? '*' : ''}
                              </label>
                              {sizeOptions ? (
                                <select
                                  value={article.taille}
                                  onChange={(e) => handleArticleChange(article.id, { taille: e.target.value })}
                                  className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted"
                                >
                                  <option value="">— Choisir</option>
                                  {sizeOptions.map((s) => {
                                    const stock = produit?.couleur_tailles_stock?.[article.couleur]?.[s]
                                    const label = stock != null ? `${s} (stock: ${stock})` : s
                                    return <option key={s} value={s}>{label}</option>
                                  })}
                                </select>
                              ) : (
                                <select disabled className="w-full px-3 py-2.5 rounded-xl text-xs bg-beige-50 border border-beige-300 text-muted/50">
                                  <option>{isMapMode && !article.couleur ? '— Sélectionner couleur d\'abord' : '— Aucune taille'}</option>
                                </select>
                              )}
                              {variantStock !== null && (
                                <p className={`text-[11px] mt-1 font-semibold ${variantStock === 0 ? 'text-rose-500' : variantStock <= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  Stock disponible : {variantStock}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ligne 3 : Instructions + Supprimer */}
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Instructions / Personnalisation</label>
                          <input
                            value={article.instructions}
                            onChange={(e) => handleArticleChange(article.id, { instructions: e.target.value })}
                            placeholder="Ex : broderie prénom, couleur doublure…"
                            className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink"
                          />
                        </div>
                        <button
                          onClick={() => removeArticle(article.id)}
                          className="p-2 rounded-xl border border-blush/50 hover:bg-blush/20 flex-shrink-0"
                          title="Supprimer"
                          disabled={articles.length === 1}
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" strokeWidth={1.5} />
                        </button>
                      </div>

                      {selectedClient?.a_mesures && (
                        <label className="flex items-center gap-2 text-xs text-muted mt-3">
                          <input
                            type="checkbox"
                            checked={article.utilise_mesures_client}
                            onChange={(e) => handleArticleChange(article.id, { utilise_mesures_client: e.target.checked })}
                            className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                          />
                          Utiliser les mesures du client
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
              <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Résumé</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Sous-total</span><span>{fmtMoney(subtotal)} FCFA</span></div>
                <div className="flex justify-between"><span>Livraison</span><span>{fmtMoney(form.frais_livraison)} FCFA</span></div>
                <div className="flex justify-between"><span>Remise</span><span>- {fmtMoney(form.remise)} FCFA</span></div>
                <div className="flex justify-between font-semibold text-ink border-t border-beige-300 pt-2">
                  <span>Total</span><span>{fmtMoney(subtotal + Number(form.frais_livraison || 0) - Number(form.remise || 0))} FCFA</span>
                </div>
              </div>
            </div>

            <div className="bg-beige-100 rounded-2xl border border-beige-300 p-5">
              <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Paramètres</h3>
              <div className="space-y-3">
                <select
                  value={form.priorite}
                  onChange={(e) => setForm(prev => ({ ...prev, priorite: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-50 border border-beige-300 text-muted"
                >
                  <option value="normale">Priorité normale</option>
                  <option value="urgente">Urgente</option>
                  <option value="tres_urgente">Très urgente</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={form.frais_livraison}
                  onChange={(e) => setForm(prev => ({ ...prev, frais_livraison: Number(e.target.value) }))}
                  placeholder="Frais livraison"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <input
                  type="number"
                  min={0}
                  value={form.remise}
                  onChange={(e) => setForm(prev => ({ ...prev, remise: Number(e.target.value) }))}
                  placeholder="Remise"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <input
                  value={form.code_promo}
                  onChange={(e) => setForm(prev => ({ ...prev, code_promo: e.target.value }))}
                  placeholder="Code promo"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                />
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={form.est_cadeau}
                    onChange={(e) => setForm(prev => ({ ...prev, est_cadeau: e.target.checked }))}
                    className="rounded border-beige-300 text-beige-500 focus:ring-beige-400"
                  />
                  Cadeau
                </label>
                {form.est_cadeau && (
                  <input
                    value={form.message_cadeau}
                    onChange={(e) => setForm(prev => ({ ...prev, message_cadeau: e.target.value }))}
                    placeholder="Message cadeau"
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-50 border border-beige-300 text-ink"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex items-center justify-between">
          <p className="text-xs text-muted flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Les champs marqués * sont obligatoires.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-beige-300 text-muted hover:bg-beige-200"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-beige-500 text-white hover:bg-beige-400 disabled:opacity-50"
            >
              {submitting ? 'Création…' : 'Créer la commande'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
