import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductDetailPage } from './ProductDetailPage'
import { useCartStore } from '@/store/cartStore'
import { renderWithProviders } from '@/test/renderWithProviders'
import { matchPrice } from '@/test/testUtils'
import type { ProductDetail, ProductPageData } from '@/api/client/catalog'
import type { ProductClient } from '@/api/client/home'

/* ── Mocks ─────────────────────────────────────────────────────────── */
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: 'robe-rouge' }),
  }
})

vi.mock('@/store/wishlistStore', () => ({
  useWishlistStore: () => ({ has: () => false, toggle: vi.fn() }),
}))

vi.mock('@/store/shopStore', () => ({
  useShopStore: (sel: (s: { waNumber: string }) => unknown) => sel({ waNumber: '221784661412' }),
  buildWaUrl: (_: string, msg: string) => `https://wa.me/?text=${encodeURIComponent(msg)}`,
}))

/* ── Mock API ────────────────────────────────────────────────────────── */
const mockProductPage = vi.fn()
vi.mock('@/api/client/catalog', () => ({
  catalogClientApi: {
    productPage: (...args: unknown[]) => mockProductPage(...args),
  },
}))

/* ── Fixtures ────────────────────────────────────────────────────────── */
function makeProductDetail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: 10, nom: 'Robe Rouge', slug: 'robe-rouge',
    description: 'Belle robe rouge.', description_courte: 'Belle robe.',
    prix: 35000, prix_affiche: 35000, prix_promo: null,
    en_promo: false, pourcentage_reduction: 0,
    en_stock: true, stock_disponible: 5,
    stock_status: { status: 'in_stock', label: 'En stock', color: 'green' },
    image_principale: null, images: [],
    category: { id: 1, nom: 'Robes', slug: 'robes' },
    type_variante: 'aucun',
    couleurs_disponibles: [], tailles_disponibles: [],
    couleur_tailles: null, couleur_tailles_stock: null,
    fait_sur_mesure: false, delai_production_jours: null,
    est_populaire: false, est_nouveaute: false,
    note_moyenne: null, nombre_avis: 0, tags: [],
    ...overrides,
  }
}

function makeRelated(overrides: Partial<ProductClient> = {}): ProductClient {
  return {
    id: 99, nom: 'Robe Bleue', slug: 'robe-bleue',
    description_courte: null, prix: 28000, prix_promo: null,
    prix_actuel: 28000, en_promo: false, image_principale: null,
    categorie: { nom: 'Robes', slug: 'robes' },
    stock_status: { status: 'in_stock', label: 'En stock', color: 'green' },
    est_populaire: false, est_nouveaute: false,
    note_moyenne: null, nombre_avis: 0, type_variante: 'aucun',
    ...overrides,
  }
}

function resolveWith(product: ProductDetail, related: ProductClient[] = []) {
  const payload: { data: { data: ProductPageData } } = {
    data: { data: { product, related_products: related } },
  }
  mockProductPage.mockResolvedValue(payload)
}

/* ── Tests ─────────────────────────────────────────────────────────── */
describe('ProductDetailPage — chargement', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], coupon: null })
    mockNavigate.mockClear()
    mockProductPage.mockClear()
  })

  it('affiche le spinner pendant le chargement', () => {
    mockProductPage.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<ProductDetailPage />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('affiche le nom du produit après chargement', async () => {
    resolveWith(makeProductDetail())
    renderWithProviders(<ProductDetailPage />)
    // Les deux layouts (mobile + desktop) affichent le nom
    await waitFor(() => expect(screen.getAllByText('Robe Rouge').length).toBeGreaterThan(0))
  })

  it('affiche "Produit introuvable" si l\'API retourne null', async () => {
    mockProductPage.mockResolvedValue({ data: { data: { product: null, related_products: [] } } })
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => expect(screen.getByText(/introuvable/i)).toBeInTheDocument())
  })
})

describe('ProductDetailPage — produit sans variante', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], coupon: null })
    mockProductPage.mockClear()
  })

  it('affiche le prix', async () => {
    resolveWith(makeProductDetail({ prix_affiche: 35000 }))
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => expect(screen.getAllByText(matchPrice(35000)).length).toBeGreaterThan(0))
  })

  it('affiche le badge "En stock"', async () => {
    resolveWith(makeProductDetail())
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => expect(screen.getAllByText(/en stock/i).length).toBeGreaterThan(0))
  })

  it('affiche le badge "Rupture de stock" quand en_stock est false', async () => {
    resolveWith(makeProductDetail({
      en_stock: false, stock_disponible: 0,
      stock_status: { status: 'out_of_stock', label: 'Rupture', color: 'red' },
    }))
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => expect(screen.getAllByText(/rupture de stock/i).length).toBeGreaterThan(0))
  })

  it('affiche le bouton "Ajouter au panier"', async () => {
    resolveWith(makeProductDetail())
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /ajouter au panier/i }).length).toBeGreaterThan(0)
    )
  })

  it('ajoute au panier et incrémente le store', async () => {
    resolveWith(makeProductDetail({ id: 10, type_variante: 'aucun' }))
    renderWithProviders(<ProductDetailPage />)
    const btns = await screen.findAllByRole('button', { name: /ajouter au panier/i })
    await userEvent.click(btns[0])
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].nom).toBe('Robe Rouge')
  })
})

describe('ProductDetailPage — sélecteurs de variantes', () => {
  // jsdom rend les deux layouts (mobile + desktop) → utiliser queryAll
  beforeEach(() => {
    useCartStore.setState({ items: [], coupon: null })
    mockProductPage.mockClear()
  })

  it('affiche le sélecteur de couleurs pour un vêtement', async () => {
    resolveWith(makeProductDetail({
      type_variante: 'vetement',
      couleurs_disponibles: ['Noir', 'Blanc'],
      tailles_disponibles: ['S', 'M', 'L'],
      couleur_tailles: { Noir: ['S', 'M', 'L'], Blanc: ['S', 'M'] },
    }))
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      const groups = screen.queryAllByRole('group', { name: /choisir couleur/i })
      expect(groups.length).toBeGreaterThan(0)
    })
  })

  it('affiche le sélecteur de tailles', async () => {
    resolveWith(makeProductDetail({
      type_variante: 'vetement',
      couleurs_disponibles: ['Noir'],
      tailles_disponibles: ['S', 'M', 'L'],
      couleur_tailles: { Noir: ['S', 'M', 'L'] },
    }))
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      const groups = screen.queryAllByRole('group', { name: /choisir taille/i })
      expect(groups.length).toBeGreaterThan(0)
    })
  })

  it('affiche "Pointure" pour les chaussures', async () => {
    resolveWith(makeProductDetail({
      type_variante: 'chaussure',
      couleurs_disponibles: ['Noir'],
      tailles_disponibles: ['40', '41', '42'],
      couleur_tailles: { Noir: ['40', '41', '42'] },
    }))
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      const groups = screen.queryAllByRole('group', { name: /choisir pointure/i })
      expect(groups.length).toBeGreaterThan(0)
    })
  })

  it('affiche "Senteur" et "Contenance" pour les parfums', async () => {
    resolveWith(makeProductDetail({
      type_variante: 'parfum',
      couleurs_disponibles: ['Oud'],
      tailles_disponibles: ['50ml', '100ml'],
      couleur_tailles: { Oud: ['50ml', '100ml'] },
    }))
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.queryAllByRole('group', { name: /choisir senteur/i }).length).toBeGreaterThan(0)
      expect(screen.queryAllByRole('group', { name: /choisir contenance/i }).length).toBeGreaterThan(0)
    })
  })
})

describe('ProductDetailPage — produits similaires', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], coupon: null })
    mockProductPage.mockClear()
  })

  it('affiche "Vous aimerez aussi" si related_products non vide', async () => {
    resolveWith(makeProductDetail(), [makeRelated()])
    renderWithProviders(<ProductDetailPage />)
    // Heading présent dans mobile ET desktop (deux layouts)
    await waitFor(() =>
      expect(screen.queryAllByText(/vous aimerez aussi/i).length).toBeGreaterThan(0)
    )
    // Le produit similaire s'affiche (peut apparaître deux fois : mobile + desktop)
    expect(screen.getAllByText('Robe Bleue').length).toBeGreaterThan(0)
  })

  it('n\'affiche pas la section similaires si related_products est vide', async () => {
    resolveWith(makeProductDetail(), [])
    renderWithProviders(<ProductDetailPage />)
    await waitFor(() => expect(screen.getAllByText('Robe Rouge').length).toBeGreaterThan(0))
    expect(screen.queryByText(/vous aimerez aussi/i)).not.toBeInTheDocument()
  })
})
