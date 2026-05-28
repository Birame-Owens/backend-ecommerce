import api from '@/lib/axios'
import type { AdminShippingSettings } from '@/types/admin'

export const shippingAdminApi = {
  getSettings: () =>
    api.get<{ success: boolean; data: AdminShippingSettings }>('/api/admin/shipping-settings'),

  updateSettings: (payload: { default_cost: number; free_threshold: number; is_enabled: boolean }) =>
    api.put<{ success: boolean; data: AdminShippingSettings }>('/api/admin/shipping-settings', payload),

  disable: () =>
    api.post<{ success: boolean; data: AdminShippingSettings }>('/api/admin/shipping-settings/disable'),

  enable: () =>
    api.post<{ success: boolean; data: AdminShippingSettings }>('/api/admin/shipping-settings/enable'),
}
