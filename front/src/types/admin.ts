export interface AdminUser {
  id: number
  name: string
  email: string
  role: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  token: string
  user: AdminUser
  message?: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
