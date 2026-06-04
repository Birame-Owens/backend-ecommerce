import clientApi from '@/lib/clientAxios'

export interface ProductReview {
  id: number
  nom_client: string
  note: number
  titre?: string | null
  commentaire: string
  date: string
  avis_verifie: boolean
  recommande_produit: boolean
  photos: string[]
}

export interface ProductReviewsData {
  reviews: ProductReview[]
  note_moyenne: number
  total: number
  current_page: number
  last_page: number
}

export interface SubmitReviewPayload {
  commande_id: number
  produit_id: number
  note_globale: number
  commentaire: string
  titre?: string
  photos?: File[]
}

export const reviewsClientApi = {
  // Avis publics (approuvés) d'un produit
  forProduct: (slug: string, perPage = 10) =>
    clientApi.get<{ success: boolean; data: ProductReviewsData }>(
      `/api/client/products/${encodeURIComponent(slug)}/reviews`,
      { params: { per_page: perPage } }
    ),

  // Soumission d'un avis (avec photos optionnelles) — multipart
  submit: (payload: SubmitReviewPayload) => {
    const fd = new FormData()
    fd.append('commande_id', String(payload.commande_id))
    fd.append('produit_id', String(payload.produit_id))
    fd.append('note_globale', String(payload.note_globale))
    fd.append('commentaire', payload.commentaire)
    if (payload.titre) fd.append('titre', payload.titre)
    ;(payload.photos ?? []).forEach((f) => fd.append('photos[]', f))

    return clientApi.post<{ success: boolean; message: string }>(
      '/api/client/reviews',
      fd,
      // Content-Type à undefined : le navigateur pose le multipart + boundary
      // (sinon le défaut application/json de l'instance casse l'upload).
      { headers: { 'Content-Type': undefined } }
    )
  },
}
