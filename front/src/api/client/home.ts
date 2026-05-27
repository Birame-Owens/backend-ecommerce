import clientApi from '@/lib/clientAxios'

export interface CategoryPreview {
  id: number
  parent_id: number | null
  nom: string
  slug: string
  description: string | null
  image: string | null
  couleur_theme: string | null
  produits_count: number
  est_populaire: boolean
  url: string
}

export interface ProductClient {
  id: number
  nom: string
  slug: string
  description_courte: string | null
  prix: number
  prix_promo: number | null
  prix_actuel: number
  en_promo: boolean
  image_principale: string | null
  categorie: { nom: string; slug: string } | null
  stock_status: { status: string; label: string; color: string }
  est_populaire: boolean
  est_nouveaute: boolean
  note_moyenne: number | null
  nombre_avis: number
}

export interface ShopStats {
  produits_disponibles: number
  clients_satisfaits: number
  commandes_livrees: number
  note_moyenne: number
  annees_experience: number
  livraison_gratuite_seuil: number
}

export interface HomeData {
  hero_banner: {
    has_promotion: boolean
    promotion: unknown | null
    default_message: {
      titre: string
      sous_titre: string
      description: string
      cta: string
    }
  }
  categories_preview: CategoryPreview[]
  featured_products: ProductClient[]
  new_arrivals: ProductClient[]
  active_promotions: unknown[]
  shop_stats: ShopStats
  flash_sale: unknown | null
}

export const homeClientApi = {
  home: () => clientApi.get<{ success: boolean; data: HomeData }>('/api/client/home'),
}
