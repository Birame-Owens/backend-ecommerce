import clientApi from '@/lib/clientAxios'
import type { CategoryPreview, ProductClient } from '@/api/client/home'

export interface ProductsResult {
  products: ProductClient[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    has_more: boolean
  }
}

export interface ProductImage {
  id: number
  original: string
  thumbnail: string
  medium: string
  alt_text: string
  est_principale: boolean
  couleur_associee?: string | null
}

export interface ProductSeo {
  title: string
  description: string
  keywords: string[]
  canonical: string
  image: string | null
  type: 'product' | 'website'
  structured_data: unknown
}

export interface ProductDetail {
  id: number
  nom: string
  slug: string
  description: string | null
  description_courte: string | null
  prix: number
  prix_promo: number | null
  prix_affiche: number
  en_promo: boolean
  pourcentage_reduction: number
  image_principale: string | null
  category: { id: number; nom: string; slug: string } | null
  images: ProductImage[]
  tailles_disponibles: string[]
  couleurs_disponibles: string[]
  couleur_tailles: Record<string, string[]> | null
  couleur_tailles_stock: Record<string, Record<string, number>> | null
  stock_disponible: number | null
  en_stock: boolean
  stock_status: { status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unlimited'; label: string; color: string } | null
  fait_sur_mesure: boolean
  delai_production_jours: number | null
  note_moyenne: number | null
  nombre_avis: number
  tags: string[]
  seo?: ProductSeo
  est_nouveaute: boolean
  est_populaire: boolean
  type_variante: 'vetement' | 'chaussure' | 'parfum' | 'aucun'
}

export interface ProductPageData {
  product: ProductDetail
  related_products: ProductClient[]
}

export const catalogClientApi = {
  categories: () => clientApi.get<{ success: boolean; data: CategoryPreview[] }>('/api/client/categories'),
  category: (slug: string) => clientApi.get<{ success: boolean; data: CategoryPreview }>(`/api/client/categories/${slug}`),
  categoryProducts: (slug: string, params?: Record<string, string | number | boolean | undefined>) =>
    clientApi.get<{ success: boolean; data: ProductsResult }>(`/api/client/categories/${slug}/products`, { params }),
  products: (params?: Record<string, string | number | boolean | undefined>) =>
    clientApi.get<{ success: boolean; data: ProductsResult }>('/api/client/products', { params }),
  productPage: (slug: string) =>
    clientApi.get<{ success: boolean; data: ProductPageData; message?: string }>(`/api/client/products/${slug}/page-data`),
}
