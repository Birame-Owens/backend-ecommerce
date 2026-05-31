export interface AdminPromotionListItem {
  id: number
  nom: string
  code?: string | null
  description: string
  type_promotion: 'pourcentage' | 'montant_fixe' | 'livraison_gratuite' | string
  type_label?: string | null
  valeur: number
  valeur_formatted?: string | null
  image?: string | null
  est_active: boolean
  is_current_active?: boolean
  statut?: string | null
  statut_label?: string | null
  date_debut: string
  date_fin: string
  nombre_utilisations: number
  chiffre_affaires_genere: number
  nombre_commandes: number
  jours_restants?: number
  created_at?: string | null
  cible_client?: string | null
  montant_minimum?: number | null
  utilisation_maximum?: number | null
  utilisation_par_client?: number | null
  jours_semaine_valides?: number[] | null
  categories_eligibles?: number[] | null
  produits_eligibles?: number[] | null
}

export interface AdminPromotionDetail extends AdminPromotionListItem {
  reduction_maximum?: number | null
  cumul_avec_autres?: boolean
  premiere_commande_seulement?: boolean
  afficher_site?: boolean
  envoyer_whatsapp?: boolean
  envoyer_email?: boolean
  couleur_affichage?: string | null
  taux_utilisation?: number | null
  date_debut_iso?: string | null
  date_fin_iso?: string | null
}

export interface AdminPromotionStats {
  total_promotions: number
  promotions_actives: number
  promotions_expirees: number
  promotions_futures: number
  ca_genere_total: number
  utilisations_totales: number
  promotion_plus_utilisee?: AdminPromotionListItem | null
  promotion_plus_rentable?: AdminPromotionListItem | null
  promotions_par_type?: Record<string, number>
}

export interface AdminPromotionPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface AdminPromotionOptionItem {
  value: string | number
  label: string
}

export interface AdminPromotionOptions {
  types_promotion: AdminPromotionOptionItem[]
  cibles_client: AdminPromotionOptionItem[]
  jours_semaine: AdminPromotionOptionItem[]
  couleurs: AdminPromotionOptionItem[]
  categories: Array<{ id: number; nom: string }>
  produits: Array<{ id: number; nom: string; prix: number }>
}
