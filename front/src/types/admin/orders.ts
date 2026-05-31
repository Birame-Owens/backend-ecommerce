export interface AdminOrderClient {
  id: number
  nom_complet: string
  telephone: string
  email?: string
  adresse_principale?: string
  ville?: string
}

export interface AdminOrderListItem {
  id: number
  numero_commande: string
  client: AdminOrderClient | null
  nom_destinataire: string
  telephone_livraison: string
  adresse_livraison?: string | null
  montant_total: number
  statut: string
  statut_label: string
  priorite: 'normale' | 'urgente' | 'tres_urgente' | string
  date_commande: string
  date_livraison_prevue: string | null
  nb_articles: number
  est_payee: boolean
  peut_modifier: boolean
  peut_supprimer: boolean
  est_en_retard: boolean
}

export interface AdminOrderArticle {
  id: number
  produit: {
    id: number
    nom: string
    image?: string | null
    categorie?: string | null
    fait_sur_mesure?: boolean
  }
  quantite: number
  prix_unitaire: number
  prix_total: number
  taille_choisie?: string | null
  couleur_choisie?: string | null
  demandes_personnalisation?: string | null
  statut_production?: string | null
  statut_production_label?: string | null
  type_confection?: string | null
  mesures_formatted?: Array<{ label: string; valeur: number; unite: string; affichage: string }>
}

export interface AdminOrderPayment {
  id: number
  montant: number
  methode: string
  statut: string
  date: string
  reference?: string | null
}

export interface AdminOrderDetail extends AdminOrderListItem {
  adresse_livraison: string
  instructions_livraison?: string | null
  mode_livraison?: string | null
  notes_client?: string | null
  notes_admin?: string | null
  est_cadeau?: boolean
  message_cadeau?: string | null
  code_promo?: string | null
  sous_total: number
  frais_livraison: number
  remise: number
  source?: string | null
  client_details?: AdminOrderClient & {
    a_mesures?: boolean
    mesures_client?: {
      date_prise?: string | null
      mesures_valides?: boolean
      mesures?: Record<string, number>
      notes_mesures?: string | null
    } | null
  } | null
  articles: AdminOrderArticle[]
  paiements: AdminOrderPayment[]
  montant_paye: number
  montant_restant: number
  production_info?: {
    articles_avec_mesures: number
    articles_taille_standard: number
    delai_production_estime: number
    difficulte_globale: string
  }
}

export interface AdminOrderStats {
  total_commandes: number
  commandes_en_attente: number
  commandes_livrees?: number
  commandes_annulees?: number
  commandes_par_statut?: Record<string, number>
  ca_total: number
  ca_ce_mois?: number
  commandes_en_retard?: number
}

export interface AdminOrderPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface AdminOrderClientOption {
  id: number
  nom_complet: string
  telephone: string
  email?: string
  adresse_principale?: string
  quartier?: string
  ville?: string
  indications_livraison?: string
  a_mesures?: boolean
  mesures?: Record<string, number> | null
}

export interface AdminOrderProductOption {
  id: number
  nom: string
  prix: number
  prix_promo?: number | null
  stock_disponible?: number
  gestion_stock?: boolean
  fait_sur_mesure?: boolean
  tailles_disponibles?: string[]
  couleurs_disponibles?: string[]
  couleur_tailles?: Record<string, string[]> | null
  couleur_tailles_stock?: Record<string, Record<string, number>> | null
  categorie?: string | null
  image?: string | null
}

export interface AdminOrderCreateArticle {
  produit_id: number
  quantite: number
  prix_unitaire: number
  taille?: string | null
  couleur?: string | null
  instructions?: string | null
  utilise_mesures_client?: boolean
  mesures?: Record<string, number>
}

export interface AdminOrderCreatePayload {
  client_id?: number
  new_client?: {
    nom_complet?: string
    nom?: string
    prenom?: string
    telephone?: string
    email?: string
    adresse?: string
    ville?: string
  }
  nom_destinataire: string
  telephone_livraison: string
  adresse_livraison: string
  instructions_livraison?: string | null
  mode_livraison: 'domicile' | 'boutique' | 'magasin' | 'point_relais'
  date_livraison_prevue?: string | null
  notes_client?: string | null
  notes_admin?: string | null
  priorite: 'normale' | 'urgente' | 'tres_urgente'
  est_cadeau?: boolean
  message_cadeau?: string | null
  code_promo?: string | null
  frais_livraison: number
  remise?: number | null
  articles: AdminOrderCreateArticle[]
}
