import clientApi from '@/lib/clientAxios'

export interface CouponData {
  code: string
  nom: string
  type: string
  valeur: number
  discount: number
  nouveau_total: number
}

export interface DeliveryZone {
  id: number
  nom: string
  prix: number
  ordre_affichage: number
}

export interface OrderCustomer {
  nom: string
  prenom: string
  email: string
  telephone: string
  adresse_livraison: string
  ville: string
  pays?: string
}

export interface OrderItem {
  product_id: number
  quantity: number
  options: { taille?: string | null; couleur?: string | null }
}

export interface CreateOrderPayload {
  customer: OrderCustomer
  items: OrderItem[]
  coupon_code?: string
  notes?: string
  delivery_zone_id?: number | null
}

export interface PaymentPayload {
  provider: 'wave' | 'orange_money'
  phone: string
  first_name?: string
  last_name?: string
}

export interface OrderArticle {
  id: number
  nom_produit: string
  prix_unitaire: number
  quantite: number
  prix_total_article: number
  taille_choisie?: string | null
  couleur_choisie?: string | null
  produit?: { images_produits?: Array<{ url: string }> }
}

export interface OrderDetail {
  numero_commande: string
  statut: string
  montant_total: number
  sous_total: number
  frais_livraison: number
  remise: number
  zone_livraison_nom?: string | null
  created_at: string
  client?: { prenom: string; nom: string; email: string }
  articles_commandes?: OrderArticle[]
  articles?: OrderArticle[]
}

export const checkoutApi = {
  getDeliveryZones: () =>
    clientApi.get<{ success: boolean; data: DeliveryZone[] }>(
      '/api/client/delivery-zones'
    ),

  validateCoupon: (code: string, montant_commande: number) =>
    clientApi.post<{ success: boolean; data: CouponData; message?: string }>(
      '/api/client/promotions/validate-code',
      { code, montant_commande }
    ),

  createOrder: (payload: CreateOrderPayload) =>
    clientApi.post<{ success: boolean; data: { commande: { numero_commande: string } }; message?: string }>(
      '/api/client/checkout/create-order',
      payload
    ),

  initiatePayment: (orderNumber: string, payload: PaymentPayload) =>
    clientApi.post<{ success: boolean; payment_url?: string; message?: string }>(
      `/api/client/checkout/payment/${orderNumber}`,
      payload
    ),

  getOrder: (orderNumber: string) =>
    clientApi.get<{ success: boolean; data: OrderDetail }>(
      `/api/client/commandes/${orderNumber}`
    ),

  getOrders: () =>
    clientApi.get<{
      success: boolean
      data: Array<{
        id: number
        numero_commande: string
        statut: string
        montant_total: number
        created_at: string
        items_count?: number
        articles?: Array<{ produit_id: number; nom_produit: string; quantite: number }>
      }>
    }>(
      // Liste des commandes du client connecté (route authentifiée).
      // /api/client/commandes (sans numéro) n'existe pas -> 404.
      '/api/client/account/orders'
    ),
}
