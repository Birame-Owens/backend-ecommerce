export interface AdminPaymentClient {
  id: number
  nom_complet: string
  telephone: string
  email?: string | null
}

export interface AdminPaymentOrder {
  id: number
  numero_commande: string
  montant_total: number
}

export interface AdminPaymentListItem {
  id: number
  reference_paiement: string
  transaction_id?: string | null
  montant: number
  methode_paiement: string
  methode_label: string
  statut: string
  statut_label: string
  est_acompte: boolean
  montant_restant: number
  montant_rembourse: number
  numero_telephone?: string | null
  date_initiation?: string | null
  date_validation?: string | null
  date_echeance?: string | null
  message_retour?: string | null
  is_manual: boolean
  commande?: AdminPaymentOrder | null
  client?: AdminPaymentClient | null
}

export interface AdminPaymentDetail extends AdminPaymentListItem {
  code_autorisation?: string | null
  notes_admin?: string | null
  commentaire_client?: string | null
  date_remboursement?: string | null
  motif_remboursement?: string | null
  donnees_api?: Record<string, unknown> | null
}

export interface AdminPaymentPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface AdminPaymentStats {
  total_paiements: number
  paiements_valides: number
  paiements_en_attente: number
  paiements_echecs: number
  montant_total_valide: number
  montant_total_rembourse: number
  paiements_par_methode?: Record<string, { total: number; montant_total: number }>
  paiements_aujourdhui?: number
  montant_aujourdhui?: number
  paiements_ce_mois?: number
  montant_ce_mois?: number
  paiements_manuels?: number
  paiements_electroniques?: number
}

export interface AdminPaymentMethod {
  value: string
  label: string
  icon?: string | null
  description?: string | null
  fees?: number | null
  active: boolean
  manual: boolean
}

export interface AdminShippingSettings {
  id: number
  default_cost: number
  free_threshold: number
  is_enabled: boolean
  created_at?: string | null
  updated_at?: string | null
}
