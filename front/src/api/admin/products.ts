import api from '@/lib/axios'

export interface StockStatus {
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unlimited'
  label: string
  color: string
}

export interface ImageProduit {
  id: number
  url_originale: string
  url_miniature: string | null
  url_moyenne: string | null
  alt_text: string
  ordre_affichage: number
  est_principale: boolean
  couleur_associee: string | null
}

export interface ProduitListItem {
  id: number
  nom: string
  slug: string
  description_courte: string | null
  prix: number
  prix_promo: number | null
  prix_actuel: number
  en_promo: boolean
  image_principale: string | null
  categorie: { id: number; nom: string } | null
  stock_disponible: number
  seuil_alerte: number
  stock_status: StockStatus
  couleur_tailles_stock: Record<string, Record<string, number>> | null
  est_visible: boolean
  est_populaire: boolean
  est_nouveaute: boolean
  nombre_ventes: number
  updated_at: string
  created_at: string
}

export interface ProduitDetail extends ProduitListItem {
  description: string
  debut_promo: string | null
  fin_promo: string | null
  categorie: { id: number; nom: string; slug: string } | null
  images: ImageProduit[]
  couleurs_disponibles: string[]
  tailles_disponibles: string[]
  couleur_tailles: Record<string, string[]> | null
  couleur_tailles_seuil: Record<string, Record<string, number>> | null
  materiaux_necessaires: string[]
  gestion_stock: boolean
  fait_sur_mesure: boolean
  delai_production_jours: number | null
  cout_production: number | null
  ordre_affichage: number
  meta_titre: string | null
  meta_description: string | null
  tags: string | null
  type_variante: 'vetement' | 'chaussure' | 'parfum' | 'aucun'
}

export interface ProduitPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export const produitsAdminApi = {
  list: (params?: {
    page?: number; per_page?: number; search?: string
    category_id?: number | string; status?: string
    sort?: string; direction?: string
  }) =>
    api.get<{ success: boolean; data: { produits: ProduitListItem[]; pagination: ProduitPagination } }>(
      '/api/admin/produits', { params }
    ),

  show: (id: number) =>
    api.get<{ success: boolean; data: { produit: ProduitDetail } }>(`/api/admin/produits/${id}`),

  create: (data: FormData) =>
    api.post<{ success: boolean; message: string; data: { produit: ProduitDetail } }>(
      '/api/admin/produits', data, { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  update: (id: number, data: FormData) =>
    api.post<{ success: boolean; message: string; data: { produit: ProduitDetail } }>(
      `/api/admin/produits/${id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/api/admin/produits/${id}`),

  toggleStatus: (id: number) =>
    api.post<{ success: boolean; message: string }>(`/api/admin/produits/${id}/toggle-status`),

  duplicate: (id: number) =>
    api.post<{ success: boolean; message: string; data: { produit: ProduitListItem } }>(
      `/api/admin/produits/${id}/duplicate`
    ),

  deleteImage: (produitId: number, imageId: number) =>
    api.delete<{ success: boolean; message: string }>(`/api/admin/produits/${produitId}/images/${imageId}`),
}
