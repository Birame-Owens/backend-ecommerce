import api from '@/lib/axios'
import type {
  AdminPromotionDetail,
  AdminPromotionListItem,
  AdminPromotionPagination,
  AdminPromotionStats,
  AdminPromotionOptions,
} from '@/types/admin'

export interface PromotionListParams {
  page?: number
  per_page?: number
  search?: string
  statut?: string
  type?: string
  date_debut?: string
  date_fin?: string
  sort?: string
  direction?: 'asc' | 'desc'
}

export const promotionsAdminApi = {
  list: (params?: PromotionListParams) =>
    api.get<{ success: boolean; data: { promotions: AdminPromotionListItem[]; pagination: AdminPromotionPagination } }>(
      '/api/admin/promotions',
      { params },
    ),

  stats: () =>
    api.get<{ success: boolean; data: AdminPromotionStats }>(
      '/api/admin/promotions/stats',
    ),

  options: () =>
    api.get<{ success: boolean; data: AdminPromotionOptions }>(
      '/api/admin/promotions/options',
    ),

  show: (id: number) =>
    api.get<{ success: boolean; data: { promotion: AdminPromotionDetail } }>(
      `/api/admin/promotions/${id}`,
    ),

  create: (payload: FormData) =>
    api.post<{ success: boolean; message: string; data: { promotion: AdminPromotionDetail } }>(
      '/api/admin/promotions',
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ),

  update: (id: number, payload: FormData) =>
    api.post<{ success: boolean; message: string; data: { promotion: AdminPromotionDetail } }>(
      `/api/admin/promotions/${id}?_method=PUT`,
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ),

  toggleStatus: (id: number) =>
    api.post<{ success: boolean; message: string; data: { promotion: AdminPromotionListItem } }>(
      `/api/admin/promotions/${id}/toggle-status`,
    ),

  duplicate: (id: number) =>
    api.post<{ success: boolean; message: string; data: { promotion: AdminPromotionDetail } }>(
      `/api/admin/promotions/${id}/duplicate`,
    ),

  remove: (id: number) =>
    api.delete<{ success: boolean; message: string }>(
      `/api/admin/promotions/${id}`,
    ),
}
