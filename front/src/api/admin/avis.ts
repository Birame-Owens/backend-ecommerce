import api from '@/lib/axios'
import type {
  AdminReviewDetail,
  AdminReviewListItem,
  AdminReviewOptions,
  AdminReviewPagination,
  AdminReviewStats,
} from '@/types/admin'

export interface ReviewListParams {
  page?: number
  per_page?: number
  statut?: string
  note_min?: number
  note_max?: number
  produit_id?: number
  client_id?: number
  date_debut?: string
  date_fin?: string
  search?: string
}

export const avisAdminApi = {
  list: (params?: ReviewListParams) =>
    api.get<{ success: boolean; data: { avis: AdminReviewListItem[]; pagination: AdminReviewPagination } }>(
      '/api/admin/avis-clients',
      { params },
    ),

  stats: () =>
    api.get<{ success: boolean; data: AdminReviewStats }>('/api/admin/avis-clients/stats'),

  options: () =>
    api.get<{ success: boolean; data: AdminReviewOptions }>('/api/admin/avis-clients/options'),

  show: (id: number) =>
    api.get<{ success: boolean; data: { avis: AdminReviewDetail } }>(`/api/admin/avis-clients/${id}`),

  moderer: (id: number, payload: { action: 'approuver' | 'rejeter' | 'masquer'; raison?: string }) =>
    api.post<{ success: boolean; message: string; data?: { avis: AdminReviewDetail } }>(
      `/api/admin/avis-clients/${id}/moderer`,
      payload,
    ),

  repondre: (id: number, payload: { reponse: string }) =>
    api.post<{ success: boolean; message: string; data?: { avis: AdminReviewDetail } }>(
      `/api/admin/avis-clients/${id}/repondre`,
      payload,
    ),

  toggleMiseEnAvant: (id: number) =>
    api.post<{ success: boolean; message: string; data?: { avis: AdminReviewDetail } }>(
      `/api/admin/avis-clients/${id}/toggle-mise-en-avant`,
    ),

  toggleVerifie: (id: number) =>
    api.post<{ success: boolean; message: string; data?: { avis: AdminReviewDetail } }>(
      `/api/admin/avis-clients/${id}/toggle-verifie`,
    ),

  remove: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/api/admin/avis-clients/${id}`),
}
