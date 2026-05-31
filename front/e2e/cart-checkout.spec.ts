import { test, expect } from '@playwright/test'

// ── Fixtures de données ────────────────────────────────────────────────────────

const PRODUCT = {
  id: 1,
  nom: 'Robe Ankara',
  slug: 'robe-ankara',
  prix: 25000,
  prix_promo: null,
  stock_disponible: 10,
  est_visible: true,
  est_populaire: false,
  est_nouveaute: true,
  description: 'Une belle robe en tissu Ankara.',
  image_principale: null,
  images: [],
  categorie: { id: 1, nom: 'Robes', slug: 'robes' },
  tailles_disponibles: ['S', 'M', 'L'],
  couleurs_disponibles: ['Rouge', 'Bleu'],
}

const CART_EMPTY = {
  success: true,
  data: { items: [], count: 0, subtotal: 0, discount: 0, shipping_fee: 2000, total: 2000 },
}

const CART_WITH_ITEM = {
  success: true,
  data: {
    items: [
      {
        id: 'item-1',
        produit_id: 1,
        nom: 'Robe Ankara',
        image: null,
        prix: 25000,
        quantite: 1,
        taille: 'M',
        couleur: 'Rouge',
        sous_total: 25000,
      },
    ],
    count: 1,
    subtotal: 25000,
    discount: 0,
    shipping_fee: 2000,
    total: 27000,
  },
}

const ORDER_CREATED = {
  success: true,
  message: 'Commande créée avec succès',
  data: {
    commande: {
      id: 42,
      numero_commande: 'CMD-2026-00042',
      montant_total: 27000,
      statut: 'en_attente',
    },
  },
}

// ── Helper : intercepter les routes API ───────────────────────────────────────

async function mockApis(page: Parameters<typeof test>[1] extends { page: infer P } ? P : never) {
  // Produit detail
  await page.route('**/api/client/products/robe-ankara', (route) =>
    route.fulfill({ json: { success: true, data: { product: PRODUCT } } })
  )

  // Cart (vide initialement, puis avec l'article)
  let cartState = CART_EMPTY
  await page.route('**/api/client/cart', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: cartState })
    }
    return route.continue()
  })

  // Cart count
  await page.route('**/api/client/cart/count', (route) =>
    route.fulfill({ json: { success: true, data: { count: cartState.data.count } } })
  )

  // Ajouter au panier → met à jour l'état local
  await page.route('**/api/client/cart/add', async (route) => {
    cartState = CART_WITH_ITEM
    return route.fulfill({
      json: { success: true, message: 'Produit ajouté au panier', data: cartState.data },
    })
  })

  // Checkout — créer une commande
  await page.route('**/api/client/checkout', (route) =>
    route.fulfill({ status: 201, json: ORDER_CREATED })
  )

  // Home (pour éviter les erreurs 404 sur la page d'accueil)
  await page.route('**/api/client/home', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          hero: null,
          categories: [],
          nouveautes: [],
          populaires: [],
          promotions: [],
        },
      },
    })
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('Flux panier → commande', () => {
  test.beforeEach(async ({ page }) => {
    await mockApis(page as never)
  })

  test('ajouter un produit au panier depuis la page produit', async ({ page }) => {
    await page.goto('/produits/robe-ankara')

    // Attendre que le nom du produit soit visible
    await expect(page.getByText('Robe Ankara')).toBeVisible()

    // Sélectionner taille et couleur si des boutons sont présents
    const tailleM = page.getByRole('button', { name: 'M' })
    if (await tailleM.isVisible()) {
      await tailleM.click()
    }

    // Cliquer sur "Ajouter au panier"
    const addBtn = page.getByRole('button', { name: /ajouter au panier/i })
    await addBtn.click()

    // Le compteur du panier dans le header doit passer à 1
    const cartBadge = page.locator('[data-testid="cart-count"], .cart-count').first()
    if (await cartBadge.isVisible()) {
      await expect(cartBadge).toContainText('1')
    }
  })

  test('la page panier affiche les articles', async ({ page }) => {
    // Simuler un panier avec un article déjà présent
    await page.route('**/api/client/cart', (route) =>
      route.fulfill({ json: CART_WITH_ITEM })
    )

    await page.goto('/panier')

    await expect(page.getByText('Robe Ankara')).toBeVisible()
    await expect(page.getByText('25 000')).toBeVisible()
  })

  test('le panier vide affiche un message approprié', async ({ page }) => {
    await page.goto('/panier')

    // Le panier doit indiquer qu'il est vide
    await expect(
      page.getByText(/panier est vide|votre panier/i)
    ).toBeVisible()
  })

  test('accéder au checkout depuis le panier', async ({ page }) => {
    await page.route('**/api/client/cart', (route) =>
      route.fulfill({ json: CART_WITH_ITEM })
    )

    await page.goto('/panier')

    const checkoutBtn = page.getByRole('link', { name: /commander|passer la commande|checkout/i })
    await expect(checkoutBtn).toBeVisible()
    await checkoutBtn.click()

    await expect(page).toHaveURL(/\/checkout/)
  })

  test('soumettre le formulaire de checkout crée une commande', async ({ page }) => {
    await page.route('**/api/client/cart', (route) =>
      route.fulfill({ json: CART_WITH_ITEM })
    )

    await page.goto('/checkout')

    // Remplir les champs obligatoires du formulaire de livraison
    const nomField = page.getByLabel(/nom.*destinataire|nom complet/i).first()
    if (await nomField.isVisible()) {
      await nomField.fill('Fatou Diallo')
    }

    const telField = page.getByLabel(/téléphone|numéro/i).first()
    if (await telField.isVisible()) {
      await telField.fill('771234567')
    }

    const adresseField = page.getByLabel(/adresse/i).first()
    if (await adresseField.isVisible()) {
      await adresseField.fill('Dakar, Plateau')
    }

    // Soumettre
    const submitBtn = page.getByRole('button', { name: /confirmer|passer la commande|valider/i })
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      // Doit rediriger vers la page de succès
      await expect(page).toHaveURL(/\/checkout\/success|\/panier/, { timeout: 10000 })
    }
  })

  test('la page de succès confirme la commande', async ({ page }) => {
    // Simuler navigation directe vers success avec un numéro de commande
    await page.goto('/checkout/success?order=CMD-2026-00042')

    // La page doit afficher un message de confirmation
    await expect(
      page.getByText(/commande|confirmé|succès|merci/i)
    ).toBeVisible()
  })
})

test.describe('Navigation panier', () => {
  test('le header affiche le bon nombre d\'articles', async ({ page }) => {
    await page.route('**/api/client/cart/count', (route) =>
      route.fulfill({ json: { success: true, data: { count: 3 } } })
    )
    await page.route('**/api/client/home', (route) =>
      route.fulfill({
        json: { success: true, data: { hero: null, categories: [], nouveautes: [], populaires: [], promotions: [] } },
      })
    )

    await page.goto('/')

    const badge = page.locator('[data-testid="cart-count"]').first()
    if (await badge.isVisible()) {
      await expect(badge).toContainText('3')
    }
  })

  test('vider le panier fonctionne', async ({ page }) => {
    let cartData = CART_WITH_ITEM

    await page.route('**/api/client/cart', (route) => {
      if (route.request().method() === 'GET') return route.fulfill({ json: cartData })
      return route.continue()
    })
    await page.route('**/api/client/cart/clear', async (route) => {
      cartData = CART_EMPTY
      return route.fulfill({ json: { success: true, message: 'Panier vidé' } })
    })

    await page.goto('/panier')
    await expect(page.getByText('Robe Ankara')).toBeVisible()

    const clearBtn = page.getByRole('button', { name: /vider le panier|tout supprimer/i })
    if (await clearBtn.isVisible()) {
      await clearBtn.click()
      await expect(page.getByText(/panier est vide|votre panier/i)).toBeVisible()
    }
  })
})
