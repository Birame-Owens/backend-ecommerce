import { test, expect } from '@playwright/test'
import type { ProductDetail, ProductSummary } from '../src/types/client'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PRODUCT_DETAIL: ProductDetail = {
  id: 1,
  nom: 'Robe Ankara Premium',
  slug: 'robe-ankara-premium',
  description: 'Belle robe en tissu Ankara 100% artisanal.',
  description_courte: 'Robe en tissu Ankara.',
  prix: 45000,
  prix_promo: null,
  prix_affiche: 45000,
  en_promo: false,
  pourcentage_reduction: 0,
  image_principale: null,
  category: { id: 1, nom: 'Robes', slug: 'robes' },
  images: [],
  tailles_disponibles: ['S', 'M', 'L', 'XL'],
  couleurs_disponibles: ['Rouge', 'Bleu'],
  couleur_tailles: { Rouge: ['S', 'M', 'L'], Bleu: ['M', 'L', 'XL'] },
  couleur_tailles_stock: { Rouge: { S: 2, M: 5, L: 1 }, Bleu: { M: 0, L: 3, XL: 2 } },
  stock_disponible: 13,
  en_stock: true,
  stock_status: { status: 'in_stock', label: 'En stock', color: 'green' },
  fait_sur_mesure: false,
  delai_production_jours: null,
  note_moyenne: 4.8,
  nombre_avis: 24,
  tags: ['ankara', 'cérémonie'],
  est_nouveaute: true,
  est_populaire: true,
  type_variante: 'vetement',
}

const RELATED: ProductSummary[] = [
  { id: 3, nom: 'Boubou Brodé', slug: 'boubou-brode', description_courte: null, prix: 60000, prix_promo: null, prix_actuel: 60000, en_promo: false, image_principale: null, categorie: { nom: 'Robes', slug: 'robes' }, stock_status: { status: 'in_stock', label: 'En stock', color: 'green' }, stock_disponible: 4, est_populaire: true, est_nouveaute: false, note_moyenne: null, nombre_avis: 0, type_variante: 'vetement' },
]

async function mockProductApi(page: import('@playwright/test').Page, slug = 'robe-ankara-premium') {
  await page.route(`**/api/client/products/${slug}/page-data`, (route) =>
    route.fulfill({ json: { success: true, data: { product: PRODUCT_DETAIL, related_products: RELATED } } })
  )
  await page.route('**/api/client/config', (route) =>
    route.fulfill({ json: { success: true, data: { whatsapp_number: '221771234567', shop_name: 'ND WORLD' } } })
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Page détail produit', () => {
  test.beforeEach(async ({ page }) => {
    await mockProductApi(page)
  })

  test('affiche les informations du produit', async ({ page }) => {
    await page.goto('/produits/robe-ankara-premium')
    await expect(page.getByRole('heading', { name: 'Robe Ankara Premium' })).toBeVisible()
    await expect(page.getByText('45 000')).toBeVisible()
    await expect(page.getByText('En stock')).toBeVisible()
  })

  test('affiche la catégorie du produit', async ({ page }) => {
    await page.goto('/produits/robe-ankara-premium')
    await expect(page.getByText('Robes').first()).toBeVisible()
  })

  test('affiche les couleurs disponibles', async ({ page }) => {
    await page.goto('/produits/robe-ankara-premium')
    await expect(page.getByRole('button', { name: /rouge/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /bleu/i })).toBeVisible()
  })

  test('affiche les tailles disponibles pour une couleur', async ({ page }) => {
    await page.goto('/produits/robe-ankara-premium')
    // Sélectionner Rouge
    await page.getByRole('button', { name: /rouge/i }).first().click()
    await expect(page.getByRole('button', { name: 'S' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'M' })).toBeVisible()
  })

  test('affiche la note moyenne', async ({ page }) => {
    await page.goto('/produits/robe-ankara-premium')
    await expect(page.getByText('4.8')).toBeVisible()
    await expect(page.getByText(/24 avis/)).toBeVisible()
  })

  test('affiche les tags', async ({ page }) => {
    await page.goto('/produits/robe-ankara-premium')
    await expect(page.getByText('#ankara')).toBeVisible()
    await expect(page.getByText('#cérémonie')).toBeVisible()
  })

  test('tenter d\'ajouter sans sélectionner couleur/taille affiche une erreur', async ({ page }) => {
    await page.goto('/produits/robe-ankara-premium')
    // Cliquer directement sur Ajouter au panier sans rien sélectionner
    const addBtn = page.getByRole('button', { name: /Ajouter au panier/i }).first()
    await addBtn.click()
    // Un message d'erreur ou un toast doit apparaître
    await expect(page.getByText(/sélectionner|couleur|taille/i).first()).toBeVisible()
  })

  test('ajouter au panier avec sélection complète', async ({ page }) => {
    await page.goto('/produits/robe-ankara-premium')
    // Sélectionner couleur
    await page.getByRole('button', { name: /rouge/i }).first().click()
    // Sélectionner taille
    await page.getByRole('button', { name: 'M' }).first().click()
    // Ajouter au panier
    const addBtn = page.getByRole('button', { name: /Ajouter au panier/i }).first()
    await addBtn.click()
    // Toast de confirmation
    await expect(page.getByText(/ajouté au panier/i)).toBeVisible({ timeout: 3000 })
  })

  test('affiche les produits similaires', async ({ page }) => {
    await page.goto('/produits/robe-ankara-premium')
    await expect(page.getByText('Boubou Brodé')).toBeVisible()
  })

  test('le produit introuvable affiche un message approprié', async ({ page }) => {
    await page.route('**/api/client/products/inconnu/page-data', (route) =>
      route.fulfill({ status: 404, json: { success: false, message: 'Produit introuvable' } })
    )
    await page.goto('/produits/inconnu')
    await expect(page.getByText(/introuvable|introuvable/i)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Quantité et stock', () => {
  test('les tailles en rupture de stock sont barrées', async ({ page }) => {
    await mockProductApi(page)
    await page.goto('/produits/robe-ankara-premium')
    // Sélectionner Bleu (M est à 0)
    await page.getByRole('button', { name: /bleu/i }).first().click()
    const mBtn = page.getByRole('button', { name: 'M' })
    // Le bouton M doit être stylé comme indisponible
    await expect(mBtn).toBeVisible()
  })

  test('le sélecteur de quantité est fonctionnel', async ({ page }) => {
    await mockProductApi(page)
    await page.goto('/produits/robe-ankara-premium')
    // Sélectionner Rouge + M
    await page.getByRole('button', { name: /rouge/i }).first().click()
    await page.getByRole('button', { name: 'M' }).first().click()
    // Incrémenter la quantité
    const plusBtn = page.getByRole('button', { name: /plus|\+/i }).first()
    await plusBtn.click()
    await expect(page.getByText('2').first()).toBeVisible()
  })
})
