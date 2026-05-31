import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import clientApi from '@/lib/clientAxios'

export interface ClientUser {
  id: number
  nom_complet: string
  email: string
  telephone?: string
  ville?: string
  type_client?: string
  score_fidelite?: number
}

interface ClientAuthState {
  user: ClientUser | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
}

export interface RegisterPayload {
  nom: string
  prenom: string
  email: string
  telephone: string
  password: string
  password_confirmation: string
  accepte_conditions: boolean
  ville?: string
}

function setToken(token: string | null) {
  if (token) localStorage.setItem('client_token', token)
  else localStorage.removeItem('client_token')
}

export const useClientAuthStore = create<ClientAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await clientApi.post('/api/client/auth/login', { email, password })
        if (!res.data.success) throw new Error(res.data.message ?? 'Identifiants incorrects')
        const { token, user } = res.data.data
        setToken(token)
        set({ token, user, isAuthenticated: true })
      },

      register: async (data) => {
        const res = await clientApi.post('/api/client/auth/register', data)
        if (!res.data.success) throw new Error(res.data.message ?? 'Erreur lors de l\'inscription')
        const { token, user } = res.data.data
        setToken(token)
        set({ token, user, isAuthenticated: true })
      },

      logout: async () => {
        try {
          if (get().token) await clientApi.post('/api/client/auth/logout')
        } catch {}
        setToken(null)
        set({ user: null, token: null, isAuthenticated: false })
      },

      fetchUser: async () => {
        try {
          const token = localStorage.getItem('client_token')
          if (!token) return
          const res = await clientApi.get('/api/client/auth/profile')
          if (res.data.success) {
            const u = res.data.data?.client ?? res.data.data
            set({ user: u, isAuthenticated: true })
          } else {
            setToken(null)
            set({ user: null, token: null, isAuthenticated: false })
          }
        } catch {
          setToken(null)
          set({ user: null, token: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'ndw-client-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
)
