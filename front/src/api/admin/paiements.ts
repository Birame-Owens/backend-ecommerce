import api from '@/lib/axios'
import type {
  AdminPaymentDetail,
  AdminPaymentListItem,
  AdminPaymentMethod,
  AdminPaymentPagination,
  AdminPaymentStats,
} from '@/types/admin'

export interface PaymentListParams {
  page?: number
  per_page?: number
  search?: string
  statut?: string
  methode?: string
  date_debut?: string
  date_fin?: string
  sort?: string
  direction?: 'asc' | 'desc'
}

export const paiementsAdminApi = {
  list: (params?: PaymentListParams) =>
    api.get<{ success: boolean; data: { paiements: AdminPaymentListItem[]; pagination: AdminPaymentPagination } }>(
      '/api/admin/paiements',
      { params },
    ),

  stats: () =>
    api.get<{ success: boolean; data: AdminPaymentStats }>('/api/admin/paiements/stats'),

  paymentMethods: () =>
    api.get<{ success: boolean; data: AdminPaymentMethod[] }>('/api/admin/paiements/payment-methods'),

  show: (id: number) =>
    api.get<{ success: boolean; data: { paiement: AdminPaymentDetail } }>(`/api/admin/paiements/${id}`),

  confirm: (id: number, payload?: { code_autorisation?: string; message?: string; notes_admin?: string }) =>
    api.post<{ success: boolean; message: string; data?: { paiement: AdminPaymentDetail } }>(
      `/api/admin/paiements/${id}/confirm`,
      payload ?? {},
    ),

  reject: (id: number, payload: { raison: string }) =>
    api.post<{ success: boolean; message: string }>(`/api/admin/paiements/${id}/reject`, payload),

  refund: (id: number, payload: { montant: number; motif: string }) =>
    api.post<{ success: boolean; message: string; data?: { paiement: AdminPaymentDetail } }>(
      `/api/admin/paiements/${id}/refund`,
      payload,
    ),

  checkStatus: (id: number) =>
    api.get<{ success: boolean; data: { statut: string; paiement: AdminPaymentDetail } }>(
      `/api/admin/paiements/${id}/check-status`,
    ),
}
