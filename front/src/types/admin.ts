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
  token: string
  user: AdminUser
  message?: string
  data?: {
    token: string
    user: AdminUser
    expires_in?: number
  }
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardOverview {
  chiffre_affaires_mois: number
  total_clients: number
  nouveaux_clients_mois: number
  total_produits?: number
  total_commandes?: number
}

export interface DashboardOrders {
  total_month: number
  pending: number
  confirmed: number
  in_production: number
  completed: number
  cancelled?: number
}

export interface DashboardSales {
  growth_percentage: number
  is_positive_growth: boolean
  total?: number
}

export interface PopularProduct {
  nom: string
  category?: string
  categorie?: string
  ventes: number
  chiffre_affaires: number
}

export interface RecentActivity {
  type: 'commande' | 'client' | string
  title: string
  description: string
  created_at?: string
}

export interface DashboardData {
  overview: DashboardOverview
  orders: DashboardOrders
  sales: DashboardSales
  popular_products: PopularProduct[]
  recent_activities: RecentActivity[]
  quickStats?: unknown
}
