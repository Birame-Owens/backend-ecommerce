import api from '@/lib/axios'
import type {
  AdminClientDetail,
  AdminClientListItem,
  AdminClientPagination,
  AdminClientStats,
} from '@/types/admin'

export interface ClientListParams {
  page?: number
  per_page?: number
  search?: string
  type_client?: string
  ville?: string
  accepte_whatsapp?: boolean
  sort?: string
  direction?: 'asc' | 'desc'
}

export const clientsAdminApi = {
  list: (params?: ClientListParams) =>
    api.get<{ success: boolean; data: { clients: AdminClientListItem[]; pagination: AdminClientPagination } }>(
      '/api/admin/clients',
      { params },
    ),

  stats: () =>
    api.get<{ success: boolean; data: AdminClientStats }>(
      '/api/admin/clients/stats',
    ),

  show: (id: number) =>
    api.get<{ success: boolean; data: { client: AdminClientDetail } }>(
      `/api/admin/clients/${id}`,
    ),

  update: (id: number, payload: Partial<AdminClientDetail>) =>
    api.put<{ success: boolean; message: string; data: { client: AdminClientDetail } }>(
      `/api/admin/clients/${id}`,
      payload,
    ),

  remove: (id: number) =>
    api.delete<{ success: boolean; message: string }>(
      `/api/admin/clients/${id}`,
    ),
}
