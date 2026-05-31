export interface AdminUser {
  id: number
  name: string
  email: string
  role: string
  statut?: string
  telephone?: string
  derniere_connexion?: string
  nombre_connexions?: number
  permissions?: {
    can_manage_products: boolean
    can_manage_orders: boolean
    can_manage_users: boolean
    can_view_dashboard: boolean
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  data?: {
    user: AdminUser
    expires_in?: number
  }
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
