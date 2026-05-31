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
