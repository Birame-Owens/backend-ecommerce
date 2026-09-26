import api from '@/lib/axios'

export interface OffreCadeauProduit {
  id: number
  nom: string
  prix: number
  image: string | null
  est_visible: boolean
}

export type RaisonIndisponibilite =
  | 'inactive' | 'programmee' | 'expiree' | 'produit_indisponible' | 'rupture_cadeau'

export interface AdminOffreCadeau {
  id: number
  produit_declencheur_id: number
  produit_offert_id: number
  quantite_declencheur: number
  quantite_offerte: number
  couleur_offerte: string | null
  taille_offerte: string | null
  est_active: boolean
  date_debut: string | null
  date_fin: string | null
  disponible: boolean
  raison_indisponibilite: RaisonIndisponibilite | null
  stock_cadeau: number | null
  declencheur: OffreCadeauProduit | null
  cadeau: OffreCadeauProduit | null
}

export interface OffreCadeauPayload {
  produit_declencheur_id: number
  produit_offert_id: number
  quantite_declencheur: number
  quantite_offerte: number
  couleur_offerte: string | null
  taille_offerte: string | null
  est_active: boolean
  date_debut: string | null
  date_fin: string | null
}

type OffreResponse = { success: boolean; message: string; data: { offre: AdminOffreCadeau } }

export const offresCadeauxAdminApi = {
  list: () =>
    api.get<{ success: boolean; data: { offres: AdminOffreCadeau[] } }>('/api/admin/offres-cadeaux'),

  create: (payload: OffreCadeauPayload) =>
    api.post<OffreResponse>('/api/admin/offres-cadeaux', payload),

  update: (id: number, payload: OffreCadeauPayload) =>
    api.put<OffreResponse>(`/api/admin/offres-cadeaux/${id}`, payload),

  toggleStatus: (id: number) =>
    api.post<OffreResponse>(`/api/admin/offres-cadeaux/${id}/toggle-status`),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/api/admin/offres-cadeaux/${id}`),
}
