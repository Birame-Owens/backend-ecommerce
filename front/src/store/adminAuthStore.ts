import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser } from '@/types/admin'

interface AdminAuthState {
  token: string | null
  user: AdminUser | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AdminUser) => void
  clearAuth: () => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        localStorage.setItem('admin_token', token)
        set({ token, user, isAuthenticated: true })
      },
      clearAuth: () => {
        localStorage.removeItem('admin_token')
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    { name: 'ndeya-admin-auth', partialize: (s) => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }) },
  ),
)
