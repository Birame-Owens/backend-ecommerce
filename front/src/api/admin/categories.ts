import api from '@/lib/axios'

export interface SubCategory {
  id: number
  nom: string
  slug: string
  description: string | null
  image: string | null
  parent_id: number
  est_active: boolean
  produits_count: number
  created_at: string
}

export interface Category {
  id: number
  nom: string
  slug: string
  description: string | null
  image: string | null
  parent_id: number | null
  ordre_affichage: number
  est_active: boolean
  est_populaire: boolean
  couleur_theme: string | null
  produits_count: number
  sous_categories_count: number
  sous_categories?: SubCategory[]
  created_at: string
  updated_at: string
}

export interface CategoryStats {
  total_categories: number
  total_sous_categories: number
  total_produits: number
  categories_actives: number
}

export const categoriesAdminApi = {
  stats: () =>
    api.get<{ success: boolean; data: CategoryStats }>('/api/admin/categories/stats'),

  list: (params?: { search?: string; type?: 'parents'; per_page?: number; sort?: string; direction?: string }) =>
    api.get<{ success: boolean; data: { categories: Category[] } }>('/api/admin/categories', { params }),

  show: (id: number) =>
    api.get<{ success: boolean; data: { category: Category } }>(`/api/admin/categories/${id}`),

  sousCategoriesOf: (id: number) =>
    api.get<{ success: boolean; data: { sous_categories: SubCategory[] } }>(`/api/admin/categories/${id}/sous-categories`),

  options: () =>
    api.get<{ success: boolean; data: Pick<Category, 'id' | 'nom' | 'parent_id'>[] }>('/api/admin/categories/options'),

  create: (data: FormData) =>
    api.post<{ success: boolean; message: string; data: { category: Category } }>('/api/admin/categories', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, data: FormData) =>
    api.post<{ success: boolean; message: string; data: { category: Category } }>(
      `/api/admin/categories/${id}?_method=PUT`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/api/admin/categories/${id}`),

  toggleStatus: (id: number) =>
    api.post<{ success: boolean; message: string; data: { category: Pick<Category, 'id' | 'nom' | 'est_active'> } }>(
      `/api/admin/categories/${id}/toggle-status`,
    ),
}
