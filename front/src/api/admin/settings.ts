import api from '@/lib/axios'
import type { AdminShopSettings } from '@/types/admin'

export const shopSettingsApi = {
  getAll: () =>
    api.get<{ success: boolean; data: AdminShopSettings }>('/api/admin/settings'),

  update: (settings: Partial<Record<string, string>>) =>
    api.put<{ success: boolean; message: string; data: AdminShopSettings }>(
      '/api/admin/settings',
      { settings },
    ),

  uploadLogo: (file: File) => {
    const fd = new FormData()
    fd.append('logo', file)
    return api.post<{ success: boolean; message: string; data: { logo: string } }>(
      '/api/admin/settings/logo',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },

  changePassword: (payload: {
    current_password: string
    new_password: string
    new_password_confirmation: string
  }) =>
    api.post<{ success: boolean; message: string }>('/api/admin/settings/change-password', payload),
}
