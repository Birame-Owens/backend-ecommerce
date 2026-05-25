import api from '@/lib/axios'
import type { LoginCredentials, AuthResponse, AdminUser } from '@/types/admin'

export const adminAuthApi = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/api/admin/login', credentials),

  logout: () =>
    api.post('/api/admin/logout'),

  me: () =>
    api.get<{ user: AdminUser }>('/api/admin/user'),
}
