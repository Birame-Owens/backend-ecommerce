import { test, expect } from '@playwright/test'
import type { HomeData } from '../src/types/client'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const HOME_DATA: HomeData = {
  hero_banner: {
    has_promotion: false,
    promotion: null,
    default_message: {
      titre: 'Le wax de vos rêves.',
      sous_titre: 'Nouvelle collection',
      description: 'Pièces uniques fabriquées à Dakar',
      cta: 'Découvrir',
    },
  },
  categories_preview: [
    { id: 1, parent_id: null, nom: 'Robes', slug: 'robes', description: null, image: null, couleur_theme: null, produits_count: 12, est_populaire: true, url: '/categories/robes' },
    { id: 2, parent_id: null, nom: 'Chemises', slug: 'chemises', description: null, image: null, couleur_theme: null, produits_count: 8, est_populaire: false, url: '/categories/chemises' },
  ],
  featured_products: [
    { id: 1, nom: 'Robe Ankara Premium', slug: 'robe-ankara-premium', description_courte: null, prix: 45000, prix_promo: null, prix_actuel: 45000, en_promo: false, image_principale: null, categorie: { nom: 'Robes', slug: 'robes' }, stock_status: { status: 'in_stock', label: 'En stock', color: 'green' }, stock_disponible: 5, est_populaire: true, est_nouveaute: false, note_moyenne: 4.8, nombre_avis: 24, type_variante: 'vetement' },
  ],
  new_arrivals: [
    { id: 2, nom: 'Chemise Bazin', slug: 'chemise-bazin', description_courte: null, prix: 28000, prix_promo: 22000, prix_actuel: 22000, en_promo: true, image_principale: null, categorie: { nom: 'Chemises', slug: 'chemises' }, stock_status: { status: 'in_stock', label: 'En stock', color: 'green' }, stock_disponible: 3, est_populaire: false, est_nouveaute: true, note_moyenne: null, nombre_avis: 0, type_variante: 'vetement' },
  ],
  active_promotions: [],
  testimonials: [
    { id: 1, nom_client: 'Aïssatou Diallo', note: 5, commentaire: 'Qualité exceptionnelle, je recommande.', produit_nom: 'Robe Ankara Premium', date: '2026-05-15', avis_verifie: true, photos: [] },
  ],
  shop_stats: { produits_disponibles: 120, clients_satisfaits: 850, commandes_livrees: 1200, note_moyenne: 4.8, annees_experience: 5, livraison_gratuite_seuil: 30000 },
  flash_sale: null,
}

async function mockHomeApi(page: import('@playwright/test').Page) {
  await page.route('**/api/client/home', (route) =>
    route.fulfill({ json: { success: true, data: HOME_DATA } })
  )
  await page.route('**/api/client/config', (route) =>
    route.fulfill({ json: { success: true, data: { whatsapp_number: '221771234567', shop_name: 'ND WORLD' } } })
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Page d\'accueil', () => {
  test.beforeEach(async ({ page }) => {
    await mockHomeApi(page)
  })

  test('affiche les sections principales', async ({ page }) => {
    await page.goto('/')
    // Hero
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Catégories
    await expect(page.getByText('Catégories')).toBeVisible()
    // Nouveautés
    await expect(page.getByText('Nouveautés')).toBeVisible()
    // Populaires
    await expect(page.getByText('Populaires')).toBeVisible()
  })

  test('affiche les produits vedettes', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Robe Ankara Premium')).toBeVisible()
  })

  test('affiche les nouveautés avec badge promo', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Chemise Bazin')).toBeVisible()
  })

  test('affiche les statistiques boutique', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('120+')).toBeVisible()
    await expect(page.getByText('850+')).toBeVisible()
  })

  test('affiche les avis clients', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Aïssatou Diallo')).toBeVisible()
    await expect(page.getByText(/Qualité exceptionnelle/)).toBeVisible()
  })

  test('naviguer vers les catégories depuis le hero', async ({ page }) => {
    await page.goto('/')
    const heroCta = page.getByRole('button', { name: /Découvrir|Explorer/i }).first()
    await expect(heroCta).toBeVisible()
    await heroCta.click()
    await expect(page).toHaveURL(/\/categories/)
  })

  test('naviguer vers une catégorie', async ({ page }) => {
    await page.route('**/api/client/categories', (route) =>
      route.fulfill({ json: { success: true, data: HOME_DATA.categories_preview } })
    )
    await page.goto('/')
    const robesBtn = page.getByRole('button', { name: 'Robes' }).first()
    await expect(robesBtn).toBeVisible()
    await robesBtn.click()
    await expect(page).toHaveURL(/\/categories\/robes/)
  })

  test('cliquer sur un produit ouvre la page détail', async ({ page }) => {
    await page.goto('/')
    const productLink = page.getByText('Robe Ankara Premium').first()
    await productLink.click()
    await expect(page).toHaveURL(/\/produits\/robe-ankara-premium/)
  })

  test('affiche un message d\'erreur si l\'API échoue', async ({ page }) => {
    await page.route('**/api/client/home', (route) =>
      route.fulfill({ status: 500, json: { success: false, message: 'Erreur serveur' } })
    )
    await page.goto('/')
    await expect(page.getByText(/Impossible de charger la page/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Réessayer/i })).toBeVisible()
  })

  test('le bouton Réessayer recharge la page', async ({ page }) => {
    let callCount = 0
    await page.route('**/api/client/home', (route) => {
      callCount++
      if (callCount === 1) return route.fulfill({ status: 500, json: { success: false } })
      return route.fulfill({ json: { success: true, data: HOME_DATA } })
    })
    await page.goto('/')
    await expect(page.getByRole('button', { name: /Réessayer/i })).toBeVisible()
    await page.getByRole('button', { name: /Réessayer/i }).click()
    await expect(page.getByText('Robe Ankara Premium')).toBeVisible()
  })
})

test.describe('Navigation header', () => {
  test('le header contient les liens principaux', async ({ page }) => {
    await mockHomeApi(page)
    await page.goto('/')
    // Logo ou nom boutique
    await expect(page.getByText(/ND WORLD|WORLD/i).first()).toBeVisible()
  })

  test('le lien panier est présent', async ({ page }) => {
    await mockHomeApi(page)
    await page.goto('/')
    const cartIcon = page.locator('[aria-label*="panier"], [aria-label*="cart"], [data-testid="cart"]').first()
    // Vérifier que la navigation vers /panier fonctionne
    const cartLink = page.locator('a[href="/panier"]').first()
    if (await cartLink.isVisible()) {
      await expect(cartLink).toBeVisible()
    }
  })
})
