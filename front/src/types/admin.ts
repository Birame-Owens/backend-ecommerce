export interface AdminUser {
  id: number
  name: string
  email: string
  role: string
  statut?: string
  telephone?: string
  derniere_connexion?: string
  nombre_connexions?: number
  permissions?: {
    can_manage_products: boolean
    can_manage_orders: boolean
    can_manage_users: boolean
    can_view_dashboard: boolean
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  data?: {
    user: AdminUser
    expires_in?: number
  }
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardOverview {
  chiffre_affaires_mois: number
  total_clients: number
  nouveaux_clients_mois: number
  total_produits?: number
  total_commandes?: number
}

export interface DashboardOrders {
  total_month: number
  pending: number
  confirmed: number
  in_production: number
  completed: number
  cancelled?: number
}

export interface DashboardSales {
  growth_percentage: number
  is_positive_growth: boolean
  total?: number
}

export interface PopularProduct {
  nom: string
  category?: string
  categorie?: string
  ventes: number
  chiffre_affaires: number
}

export interface RecentActivity {
  type: 'commande' | 'client' | string
  title: string
  description: string
  created_at?: string
}

export interface DashboardData {
  overview: DashboardOverview
  orders: DashboardOrders
  sales: DashboardSales
  popular_products: PopularProduct[]
  recent_activities: RecentActivity[]
  quickStats?: unknown
}

// ─── Orders (Admin) ─────────────────────────────────────────────────────────

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

// ─── Paiements (Admin) ─────────────────────────────────────────────────────

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

// ─── Livraison (Admin) ─────────────────────────────────────────────────────

export interface AdminShippingSettings {
  id: number
  default_cost: number
  free_threshold: number
  is_enabled: boolean
  created_at?: string | null
  updated_at?: string | null
}

// ─── Avis Clients (Admin) ──────────────────────────────────────────────────

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

// ─── Rapports (Admin) ─────────────────────────────────────────────────────

export interface AdminReportCatalogItem {
  id: string
  nom: string
  description: string
  icone: string
  couleur: string
}

export interface AdminReportCatalog {
  rapports: AdminReportCatalogItem[]
  periodes_disponibles: Record<string, string>
  formats_export: Record<string, string>
}

export interface AdminReportDashboard {
  ca_ce_mois: number
  evolution_ca: number
  commandes_ce_mois: number
  evolution_commandes: number
  nouveaux_clients: number
  evolution_clients: number
  panier_moyen: number
  evolution_panier: number
}

export interface AdminReportAlerte {
  niveau: string
  titre: string
  message: string
  date: string
  type: string
}

export interface AdminReportVentes {
  ventes: Array<{
    periode: string
    nombre_commandes: number
    chiffre_affaires: number
    panier_moyen: number
    clients_uniques: number
  }>
  totaux: {
    total_ca: number
    total_commandes: number
    panier_moyen_global: number
    total_clients_uniques: number
    periode_debut: string
    periode_fin: string
  }
  graphique_data: {
    labels: string[]
    chiffre_affaires: number[]
    nombre_commandes: number[]
    panier_moyen: number[]
  }
}

export interface AdminReportProduits {
  produits: Array<{
    id: number
    nom: string
    categorie: string
    prix: number
    total_vendu: number
    chiffre_affaires: number
    nombre_commandes: number
    prix_moyen: number
  }>
  categories: Array<{
    categorie: string
    total_vendu: number
    chiffre_affaires: number
    produits_vendus: number
  }>
  periode: {
    debut: string
    fin: string
  }
}

export interface AdminReportClients {
  top_clients: Array<{
    id: number
    nom: string
    prenom: string
    telephone: string
    ville?: string | null
    nombre_commandes: number
    total_depense: number
    panier_moyen: number
    derniere_commande: string
  }>
  nouveaux_clients: Array<{
    nom: string
    prenom: string
    telephone: string
    ville?: string | null
    created_at: string
  }>
  repartition_villes: Array<{
    ville?: string | null
    nombre_clients: number
    nombre_commandes: number
    chiffre_affaires: number
  }>
  statistiques: {
    total_nouveaux: number
    total_actifs: number
    ca_moyen_par_client: number
  }
}

export interface AdminReportFinancier {
  paiements_par_methode: Array<{
    methode_paiement: string
    nombre_transactions: number
    total_montant: number
    montant_moyen: number
  }>
  evolution_quotidienne: Array<{
    date: string
    nombre_paiements: number
    chiffre_affaires: number
  }>
  commandes_non_payees: Array<{
    numero_commande: string
    nom_destinataire: string
    montant_total: number
    created_at: string
    montant_restant: number
  }>
  totaux: {
    ca_total: number
    nombre_transactions: number
    ticket_moyen: number
    total_impaye: number
  }
}

export interface AdminReportCommandes {
  commandes_par_statut: Array<{
    statut: string
    nombre_commandes: number
    montant_total: number
    panier_moyen: number
  }>
  evolution_quotidienne: Array<{
    date: string
    nombre_commandes: number
    montant_total: number
    panier_moyen: number
  }>
  modes_livraison: Array<{
    mode_livraison: string
    nombre_commandes: number
    montant_total: number
  }>
  statistiques: {
    total_commandes: number
    montant_total: number
    panier_moyen_global: number
    commandes_urgentes: number
    commandes_en_retard: number
  }
}

export interface AdminReportAnalytics {
  sessions_estimees: number
  nouveaux_clients: number
  clients_actifs: number
  total_commandes: number
  pages_vues: number
  taux_conversion: number
  duree_moyenne_session: number
  sources_trafic: Array<{ source: string; commandes: number; pourcentage: number }>
  pages_populaires: Array<{ nom: string; nombre_vues: number }>
  evolution_quotidienne: Array<{ date: string; commandes: number; clients_actifs: number }>
  analyse_comportement: {
    total_paniers: number
    paniers_transformes: number
    taux_abandon: number
    articles_moyen_panier: number
  }
  periode?: { debut: string; fin: string; jours: number }
}

export interface AdminReportPerformanceProduits {
  produits_performance: Array<{
    nom: string
    nombre_vues: number
    ventes: number
    taux_conversion: number
  }>
  analyse_commandes: {
    total_commandes: number
    commandes_validees: number
    commandes_payees: number
    taux_validation: number
    taux_paiement: number
  }
  analyse_paniers: {
    total_paniers: number
    paniers_transformes: number
    taux_transformation: number
    taux_abandon: number
  }
  top_couleurs: Array<{ couleur: string; total_vendus: number; nb_commandes: number }>
  top_tailles: Array<{ taille: string; total_vendus: number; nb_commandes: number }>
}

// ─── Messages (Admin) ─────────────────────────────────────────────────────

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
  // Champs exposés dans la liste
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

// ─── Paramètres boutique (Admin) ──────────────────────────────────────────────

export interface AdminShopSettingsGeneral {
  boutique_nom: string
  boutique_email: string
  boutique_telephone: string
  boutique_adresse: string
  boutique_devise: string
  boutique_langue: string
  boutique_description: string
  boutique_ville: string
  boutique_pays: string
  boutique_horaires: string
}

export interface AdminShopSettingsSocial {
  social_instagram: string
  social_facebook: string
  social_tiktok: string
  social_whatsapp: string
}

export interface AdminShopSettingsSeo {
  seo_titre: string
  seo_description: string
  seo_mots_cles: string
}

export interface AdminShopSettingsNotifications {
  notif_nouvelle_commande: string
  notif_paiement_recu: string
  notif_livraison: string
  notif_promotions: string
}

export interface AdminShopSettings {
  general: AdminShopSettingsGeneral
  social: AdminShopSettingsSocial
  seo: AdminShopSettingsSeo
  notifications: AdminShopSettingsNotifications
}

// ─── Commandes (Admin) ────────────────────────────────────────────────────────

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
