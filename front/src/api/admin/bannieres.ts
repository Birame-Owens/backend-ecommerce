import api from '@/lib/axios'

export interface Banniere {
  id: number
  titre: string | null
  sous_titre: string | null
  image: string | null
  lien_url: string | null
  ordre_affichage: number
  est_active: boolean
  created_at: string
  updated_at: string
}

export const bannieresAdminApi = {
  list: () =>
    api.get<{ success: boolean; data: { bannieres: Banniere[] } }>('/api/admin/bannieres'),

  create: (data: FormData) =>
    api.post<{ success: boolean; message: string; data: { banniere: Banniere } }>('/api/admin/bannieres', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, data: FormData) =>
    api.post<{ success: boolean; message: string; data: { banniere: Banniere } }>(
      `/api/admin/bannieres/${id}?_method=PUT`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/api/admin/bannieres/${id}`),

  toggleStatus: (id: number) =>
    api.post<{ success: boolean; message: string; data: { banniere: Banniere } }>(
      `/api/admin/bannieres/${id}/toggle-status`,
    ),

  reorder: (ordre: number[]) =>
    api.post<{ success: boolean; message: string }>('/api/admin/bannieres/reorder', { ordre }),
}
