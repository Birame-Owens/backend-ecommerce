import api from '@/lib/axios'
import type { LoginCredentials, AuthResponse, AdminUser } from '@/types/admin'

export const adminAuthApi = {
  getCsrfCookie: () => api.get('/sanctum/csrf-cookie'),

  login: async (credentials: LoginCredentials) => {
    await adminAuthApi.getCsrfCookie()
    return api.post<AuthResponse>('/api/admin/login', credentials)
  },

  logout: () =>
    api.post('/api/admin/logout'),

  me: () =>
    api.get<{ user: AdminUser }>('/api/admin/user'),
}
