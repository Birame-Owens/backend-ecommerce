/**
 * Types centralisés pour toutes les réponses API client.
 * Source de vérité unique — importer depuis ici plutôt que depuis les fichiers api/.
 * Reflète les Form Requests et Resources Laravel côté backend.
 */

// ── Réponse générique ──────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    has_more: boolean
  }
}

// ── Catalogue ─────────────────────────────────────────────────────────────────

export interface StockStatus {
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unlimited'
  label: string
  color: string
}

export interface ProductSummary {
  id: number
  nom: string
  slug: string
  description_courte: string | null
  prix: number
  prix_promo: number | null
  prix_actuel: number
  en_promo: boolean
  image_principale: string | null
  categorie: { nom: string; slug: string } | null
  stock_status: StockStatus
  stock_disponible: number | null
  est_populaire: boolean
  est_nouveaute: boolean
  note_moyenne: number | null
  nombre_avis: number
  type_variante: 'vetement' | 'chaussure' | 'parfum' | 'aucun'
}

export interface ProductImage {
  id: number
  original: string
  thumbnail: string
  medium: string
  alt_text: string
  est_principale: boolean
  couleur_associee: string | null
}

export interface ProductDetail {
  id: number
  nom: string
  slug: string
  description: string | null
  description_courte: string | null
  prix: number
  prix_promo: number | null
  prix_affiche: number
  en_promo: boolean
  pourcentage_reduction: number
  image_principale: string | null
  category: { id: number; nom: string; slug: string } | null
  images: ProductImage[]
  tailles_disponibles: string[]
  couleurs_disponibles: string[]
  couleur_tailles: Record<string, string[]> | null
  couleur_tailles_stock: Record<string, Record<string, number>> | null
  stock_disponible: number | null
  en_stock: boolean
  stock_status: StockStatus | null
  fait_sur_mesure: boolean
  delai_production_jours: number | null
  note_moyenne: number | null
  nombre_avis: number
  tags: string[]
  est_nouveaute: boolean
  est_populaire: boolean
  type_variante: 'vetement' | 'chaussure' | 'parfum' | 'aucun'
}

export interface CategorySummary {
  id: number
  parent_id: number | null
  nom: string
  slug: string
  description: string | null
  image: string | null
  couleur_theme: string | null
  produits_count: number
  est_populaire: boolean
  url: string
  subcategories?: CategorySummary[]
}

// ── Promotions ────────────────────────────────────────────────────────────────

export interface PromotionBanner {
  id: number
  nom: string
  description: string | null
  code: string | null
  valeur: number
  type: 'pourcentage' | 'montant_fixe' | 'livraison_gratuite' | string
  valeur_formatted?: string
  image: string | null
  couleur: string | null
  date_fin: string
  jours_restants: number
  is_flash_sale?: boolean
}

// ── Panier ────────────────────────────────────────────────────────────────────

export interface CartItem {
  key: string
  id: number
  nom: string
  slug: string
  prix: number
  image: string | null
  couleur: string | null
  taille: string | null
  type_variante?: 'vetement' | 'chaussure' | 'parfum' | 'aucun'
  qty: number
  stock_max?: number | null
  sur_mesure?: boolean
}

export interface CartCoupon {
  code: string
  nom: string
  discount: number
}

// ── Authentification client ───────────────────────────────────────────────────

export interface ClientUser {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string | null
  ville: string | null
  adresse: string | null
  type: 'nouveau' | 'regulier' | 'vip'
}

export interface AuthTokenResponse {
  token: string
  user: ClientUser
}

// ── Commandes ─────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'en_production'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'failed'

export interface OrderSummary {
  id: number
  numero_commande: string
  statut: OrderStatus
  montant_total: number
  created_at: string
  date_livraison_prevue: string | null
}

// ── Témoignages ───────────────────────────────────────────────────────────────

export interface Testimonial {
  id: number
  nom_client: string
  note: number
  commentaire: string
  produit_nom: string
  date: string
  avis_verifie: boolean
  photos: string[]
}

// ── Accueil ───────────────────────────────────────────────────────────────────

export interface ShopStats {
  produits_disponibles: number
  clients_satisfaits: number
  commandes_livrees: number
  note_moyenne: number
  annees_experience: number
  livraison_gratuite_seuil: number
}

export interface FlashSale {
  id: number
  nom: string
  description: string | null
  valeur: number
  type: 'pourcentage' | 'montant_fixe' | 'livraison_gratuite' | string
  code: string | null
  date_fin: string
  heures_restantes: number
  minutes_restantes: number
  produits: ProductSummary[]
  couleur: string | null
}

export interface HomeData {
  hero_banner: {
    has_promotion: boolean
    promotion: PromotionBanner | null
    default_message: {
      titre: string
      sous_titre: string
      description: string
      cta: string
    }
  }
  categories_preview: CategorySummary[]
  featured_products: ProductSummary[]
  new_arrivals: ProductSummary[]
  active_promotions: PromotionBanner[]
  testimonials: Testimonial[]
  shop_stats: ShopStats
  flash_sale: FlashSale | null
}
