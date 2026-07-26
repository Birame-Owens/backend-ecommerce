import api from '@/lib/axios'

export interface AdminDeliveryZone {
  id: number
  nom: string
  prix: number
  est_active: boolean
  ordre_affichage: number
  eligible_gratuite: boolean
  created_at: string
  updated_at: string
}

export interface DeliveryZonePayload {
  nom: string
  prix: number
  est_active?: boolean
  ordre_affichage?: number
  eligible_gratuite?: boolean
}

export const deliveryZonesAdminApi = {
  list: () =>
    api.get<{ success: boolean; data: AdminDeliveryZone[] }>('/api/admin/delivery-zones'),

  create: (payload: DeliveryZonePayload) =>
    api.post<{ success: boolean; data: AdminDeliveryZone }>('/api/admin/delivery-zones', payload),

  update: (id: number, payload: Partial<DeliveryZonePayload>) =>
    api.put<{ success: boolean; data: AdminDeliveryZone }>(`/api/admin/delivery-zones/${id}`, payload),

  delete: (id: number) =>
    api.delete<{ success: boolean }>(`/api/admin/delivery-zones/${id}`),

  toggleStatus: (id: number) =>
    api.post<{ success: boolean; data: AdminDeliveryZone }>(`/api/admin/delivery-zones/${id}/toggle-status`),
}
