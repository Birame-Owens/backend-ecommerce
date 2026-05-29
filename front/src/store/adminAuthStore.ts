import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser } from '@/types/admin'

interface AdminAuthState {
  user: AdminUser | null
  isAuthenticated: boolean
  setAuth: (user: AdminUser) => void
  clearAuth: () => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'ndeya-admin-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) },
  ),
)
