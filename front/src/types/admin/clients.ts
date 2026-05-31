export interface AdminMessageGroup {
  id: string
  name: string
  count: number
}

export interface AdminMessageGroupStats {
  all: number
  with_orders: number
  without_orders: number
  vip: number
  inactive: number
}

export interface AdminMessageClient {
  id: number
  nom: string
  prenom: string
  email?: string | null
  telephone: string
  created_at: string
}

export interface AdminClientListItem {
  id: number
  nom: string
  prenom: string
  nom_complet: string
  telephone: string
  email?: string | null
  genre?: string | null
  ville?: string | null
  quartier?: string | null
  type_client: 'nouveau' | 'regulier' | 'fidele' | 'vip' | string
  type_client_label?: string | null
  score_fidelite: number
  nombre_commandes: number
  total_depense: number
  panier_moyen: number
  priorite?: string | null
  accepte_whatsapp: boolean
  accepte_email?: boolean
  accepte_promotions?: boolean
  derniere_commande?: string | null
  derniere_visite?: string | null
  date_creation: string
  whatsapp_url?: string | null
  age?: number | null
  est_vip?: boolean
  est_inactif?: boolean
}

export interface AdminClientDetail extends AdminClientListItem {
  date_naissance?: string | null
  adresse_principale?: string | null
  indications_livraison?: string | null
  taille_habituelle?: string | null
  couleurs_preferees?: string | null
  styles_preferes?: string | null
  budget_moyen?: number | null
  accepte_sms?: boolean
  canaux_preferes?: string | null
  notes_privees?: string | null
  commandes_recentes?: Array<{
    id: number
    numero_commande: string
    montant_total: number
    statut: string
    date_commande: string
  }>
  messages_whatsapp?: Array<{
    id: number
    message: string
    type: string
    statut: string
    date_envoi: string
  }>
  avis?: Array<{
    id: number
    note_globale: number
    commentaire?: string | null
    produit?: string | null
    date: string
  }>
}

export interface AdminClientStats {
  total_clients: number
  nouveaux_clients_mois: number
  clients_actifs: number
  clients_vip: number
  clients_whatsapp: number
  panier_moyen_global: number
  score_fidelite_moyen: number
  clients_par_ville?: Record<string, number>
  clients_par_type?: Record<string, number>
}

export interface AdminClientPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}
