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
