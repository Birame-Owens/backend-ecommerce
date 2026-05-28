import api from '@/lib/axios'
import type {
  AdminOrderClientOption,
  AdminOrderCreatePayload,
  AdminOrderDetail,
  AdminOrderListItem,
  AdminOrderPagination,
  AdminOrderProductOption,
  AdminOrderStats,
} from '@/types/admin'

export interface OrderListParams {
  page?: number
  per_page?: number
  numero_commande?: string
  client_search?: string
  statut?: string
  date_debut?: string
  date_fin?: string
  priorite?: string
}

export const ordersAdminApi = {
  list: (params?: OrderListParams) =>
    api.get<{ success: boolean; data: { commandes: AdminOrderListItem[]; pagination: AdminOrderPagination } }>('/api/admin/commandes', { params }),

  stats: () =>
    api.get<{ success: boolean; data: AdminOrderStats }>('/api/admin/commandes/statistics'),

  show: (id: number) =>
    api.get<{ success: boolean; data: { commande: AdminOrderDetail } }>(`/api/admin/commandes/${id}`),

  create: (payload: AdminOrderCreatePayload) =>
    api.post<{ success: boolean; message: string; data: { commande: AdminOrderDetail } }>(
      '/api/admin/commandes',
      payload,
    ),

  updateStatus: (id: number, payload: { statut: string; notes_admin?: string | null }) =>
    api.post<{ success: boolean; message: string; data: { commande: AdminOrderListItem } }>(
      `/api/admin/commandes/${id}/update-status`,
      payload,
    ),

  markPaid: (id: number, payload: { montant: number; methode_paiement: string; reference_paiement?: string | null }) =>
    api.post<{ success: boolean; message: string; data: { paiement: unknown; commande: { montant_total: number; montant_paye: number; montant_restant: number; est_entierement_payee: boolean } } }>(
      `/api/admin/commandes/${id}/mark-paid`,
      payload,
    ),

  remove: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/api/admin/commandes/${id}`),

  clientsWithMesures: (params?: { q?: string; limit?: number }) =>
    api.get<{ success: boolean; data: { clients: AdminOrderClientOption[] } }>(
      '/api/admin/commandes/clients-with-mesures',
      { params },
    ),

  products: (params?: { q?: string; limit?: number }) =>
    api.get<{ success: boolean; data: { produits: AdminOrderProductOption[] } }>(
      '/api/admin/commandes/produits',
      { params },
    ),

  export: (params?: OrderListParams) =>
    api.get('/api/admin/commandes/export', { params, responseType: 'blob' }),
}
