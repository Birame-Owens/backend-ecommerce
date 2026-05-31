export interface AdminReviewListItem {
  id: number
  titre?: string | null
  commentaire: string
  note_globale: number
  nom_affiche?: string | null
  recommande_produit?: boolean | null
  recommande_boutique?: boolean | null
  statut: string
  statut_label: string
  statut_color: string
  est_visible: boolean
  est_mis_en_avant: boolean
  avis_verifie: boolean
  nombre_likes: number
  nombre_dislikes: number
  a_photos: boolean
  nombre_photos: number
  a_reponse: boolean
  created_at: string
  client: {
    id: number
    nom_complet: string
    type_client: string
  }
  produit: {
    id: number
    nom: string
    note_moyenne: number
    nombre_avis: number
  }
}

export interface AdminReviewDetail extends AdminReviewListItem {
  note_qualite?: number | null
  note_taille?: number | null
  note_couleur?: number | null
  note_livraison?: number | null
  note_service?: number | null
  raison_rejet?: string | null
  date_moderation?: string | null
  modere_par?: number | null
  ordre_affichage?: number | null
  adresse_ip?: string | null
  user_agent?: string | null
  photos?: string[]
  reponse_boutique?: string | null
  date_reponse?: string | null
  repondu_par?: number | null
  commande?: {
    id: number
    numero_commande: string
    date_commande: string
  } | null
  client_detaille?: {
    id: number
    nom: string
    prenom: string
    email?: string | null
    telephone: string
    ville?: string | null
    type_client?: string | null
    score_fidelite?: number | null
    nombre_commandes?: number | null
    total_depense?: number | null
  }
}

export interface AdminReviewPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface AdminReviewStats {
  total_avis: number
  avis_en_attente: number
  avis_approuves: number
  avis_rejetes: number
  note_moyenne_globale: number
  avis_avec_photos: number
  avis_recommandent_produit: number
  avis_recommandent_boutique: number
  avis_par_note?: Record<string, { total: number }>
  avis_recents?: AdminReviewListItem[]
  produits_les_mieux_notes?: Array<{ id: number; nom: string; note_moyenne: number; nombre_avis: number }>
  clients_plus_actifs?: Array<{ id: number; nom: string; prenom: string; avis_clients_count: number }>
}

export interface AdminReviewOptions {
  statuts: Array<{ value: string; label: string }>
  notes: Array<{ value: number; label: string }>
  produits: Array<{ id: number; nom: string }>
  clients: Array<{ id: number; nom: string; prenom: string }>
}
