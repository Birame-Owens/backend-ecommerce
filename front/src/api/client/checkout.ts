import clientApi from '@/lib/clientAxios'

export interface CouponData {
  code: string
  nom: string
  type: string
  valeur: number
  discount: number
  nouveau_total: number
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
}

export interface PaymentPayload {
  provider: 'wave' | 'orange_money'
  phone: string
  first_name?: string
  last_name?: string
}

export const checkoutApi = {
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
    clientApi.get<{ success: boolean; data: { numero_commande: string; statut: string; montant_total: number } }>(
      `/api/client/commandes/${orderNumber}`
    ),

  getOrders: () =>
    clientApi.get<{ success: boolean; data: Array<{ numero_commande: string; statut: string; montant_total: number; created_at: string; items_count: number }> }>(
      '/api/client/commandes'
    ),
}
