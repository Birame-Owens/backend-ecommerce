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
