import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { NProductCard } from './NProductCard'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { renderWithProviders } from '@/test/renderWithProviders'
import { matchPrice } from '@/test/testUtils'
import type { ProductClient } from '@/api/client/home'

/* ── Mocks ─────────────────────────────────────────────────────────── */
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/store/shopStore', () => ({
  useShopStore: (sel: (s: { waNumber: string }) => unknown) => sel({ waNumber: '221784661412' }),
  buildWaUrl: (_: string, msg: string) => `https://wa.me/?text=${encodeURIComponent(msg)}`,
}))

/* ── Fixtures ──────────────────────────────────────────────────────── */
function makeProduct(overrides: Partial<ProductClient> = {}): ProductClient {
  return {
    id: 1,
    nom: 'Robe Élégante',
    slug: 'robe-elegante',
    description_courte: null,
    prix: 25000,
    prix_promo: null,
    prix_actuel: 25000,
    en_promo: false,
    image_principale: null,
    categorie: { nom: 'Robes', slug: 'robes' },
    stock_status: { status: 'in_stock', label: 'En stock', color: 'green' },
    stock_disponible: 10,
    est_populaire: false,
    est_nouveaute: false,
    note_moyenne: null,
    nombre_avis: 0,
    type_variante: 'aucun',
    ...overrides,
  }
}

function resetStores() {
  useCartStore.setState({ items: [], coupon: null })
  useWishlistStore.setState({ items: [] })
}

/* ── Tests ─────────────────────────────────────────────────────────── */
describe('NProductCard — rendu de base', () => {
  beforeEach(() => { resetStores(); mockNavigate.mockClear() })

  it('affiche le nom du produit', () => {
    renderWithProviders(<NProductCard product={makeProduct()} />)
    expect(screen.getByText('Robe Élégante')).toBeInTheDocument()
  })

  it('affiche le prix formaté', () => {
    renderWithProviders(<NProductCard product={makeProduct()} />)
    expect(screen.getByText(matchPrice(25000))).toBeInTheDocument()
  })

  it('affiche le prix promo et le prix barré', () => {
    const product = makeProduct({ prix: 30000, prix_promo: 22000, en_promo: true })
    renderWithProviders(<NProductCard product={product} />)
    expect(screen.getByText(matchPrice(22000))).toBeInTheDocument()
    expect(screen.getByText(matchPrice(30000))).toBeInTheDocument()
  })

  it('affiche le badge de réduction en pourcentage', () => {
    const product = makeProduct({ prix: 30000, prix_promo: 22000 })
    renderWithProviders(<NProductCard product={product} />)
    expect(screen.getByLabelText(/réduction de \d+%/i)).toBeInTheDocument()
  })

  it('navigue vers la page produit au clic sur l\'article', () => {
    renderWithProviders(<NProductCard product={makeProduct()} />)
    fireEvent.click(screen.getByRole('article'))
    expect(mockNavigate).toHaveBeenCalledWith('/produits/robe-elegante')
  })
})

describe('NProductCard — bouton panier', () => {
  beforeEach(() => { resetStores(); mockNavigate.mockClear() })

  it('affiche "Ajouter" quand produit sans variante et en stock', () => {
    renderWithProviders(<NProductCard product={makeProduct({ type_variante: 'aucun' })} />)
    const btn = screen.getByRole('button', { name: /ajouter robe élégante au panier/i })
    expect(btn).toHaveTextContent('Ajouter')
  })

  it('affiche "Choisir" pour un produit vêtement', () => {
    renderWithProviders(<NProductCard product={makeProduct({ type_variante: 'vetement' })} />)
    const btn = screen.getByRole('button', { name: /ajouter robe élégante au panier/i })
    expect(btn).toHaveTextContent('Choisir')
  })

  it('affiche "Choisir" pour un produit chaussure', () => {
    renderWithProviders(<NProductCard product={makeProduct({ type_variante: 'chaussure' })} />)
    const btn = screen.getByRole('button', { name: /ajouter robe élégante au panier/i })
    expect(btn).toHaveTextContent('Choisir')
  })

  it('affiche "Choisir" pour un produit parfum', () => {
    renderWithProviders(<NProductCard product={makeProduct({ type_variante: 'parfum' })} />)
    const btn = screen.getByRole('button', { name: /ajouter robe élégante au panier/i })
    expect(btn).toHaveTextContent('Choisir')
  })

  it('navigue vers la fiche produit en cliquant Choisir', () => {
    renderWithProviders(<NProductCard product={makeProduct({ type_variante: 'vetement' })} />)
    const btn = screen.getByRole('button', { name: /ajouter robe élégante au panier/i })
    fireEvent.click(btn)
    expect(mockNavigate).toHaveBeenCalledWith('/produits/robe-elegante')
  })

  it('ajoute au panier un produit sans variante', () => {
    renderWithProviders(<NProductCard product={makeProduct({ type_variante: 'aucun' })} />)
    const btn = screen.getByRole('button', { name: /ajouter robe élégante au panier/i })
    fireEvent.click(btn)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].nom).toBe('Robe Élégante')
  })

  it('affiche "En panier" et désactive quand le stock est épuisé par le panier', () => {
    useCartStore.getState().addItem({
      id: 1, nom: 'Robe Élégante', slug: 'robe-elegante',
      prix: 25000, image: null, couleur: null, taille: null,
      type_variante: 'aucun', qty: 1, stock_max: 1,
    })
    renderWithProviders(<NProductCard product={makeProduct({ stock_disponible: 1 })} />)
    const btn = screen.getByRole('button', { name: /indisponible/i })
    expect(btn).toHaveTextContent('En panier')
    expect(btn).toBeDisabled()
  })
})

describe('NProductCard — rupture de stock', () => {
  beforeEach(() => { resetStores(); mockNavigate.mockClear() })

  it('affiche "Indisponible" quand produit en rupture', () => {
    const product = makeProduct({
      stock_status: { status: 'out_of_stock', label: 'Rupture', color: 'red' },
      stock_disponible: 0,
    })
    renderWithProviders(<NProductCard product={product} />)
    expect(screen.getByRole('button', { name: /robe élégante indisponible/i })).toHaveTextContent('Indisponible')
  })

  it('désactive le bouton quand en rupture', () => {
    const product = makeProduct({
      stock_status: { status: 'out_of_stock', label: 'Rupture', color: 'red' },
      stock_disponible: 0,
    })
    renderWithProviders(<NProductCard product={product} />)
    expect(screen.getByRole('button', { name: /robe élégante indisponible/i })).toBeDisabled()
  })

  it('affiche le badge "Rupture de stock"', () => {
    renderWithProviders(<NProductCard product={makeProduct({
      stock_status: { status: 'out_of_stock', label: 'Rupture', color: 'red' },
    })} />)
    expect(screen.getAllByText('Rupture de stock').length).toBeGreaterThan(0)
  })
})

describe('NProductCard — wishlist', () => {
  beforeEach(() => { resetStores(); mockNavigate.mockClear() })

  it('ajoute aux favoris au clic', () => {
    renderWithProviders(<NProductCard product={makeProduct()} />)
    fireEvent.click(screen.getByRole('button', { name: /ajouter robe élégante aux favoris/i }))
    expect(useWishlistStore.getState().items).toHaveLength(1)
  })

  it('retire des favoris si déjà présent', () => {
    useWishlistStore.getState().toggle({
      id: 1, nom: 'Robe Élégante', slug: 'robe-elegante',
      prix: 25000, prix_promo: null, image_principale: null,
    })
    renderWithProviders(<NProductCard product={makeProduct()} />)
    fireEvent.click(screen.getByRole('button', { name: /retirer robe élégante des favoris/i }))
    expect(useWishlistStore.getState().items).toHaveLength(0)
  })
})

describe('NProductCard — badge nouveauté', () => {
  beforeEach(resetStores)

  it('affiche "New" quand est_nouveaute sans promo', () => {
    renderWithProviders(<NProductCard product={makeProduct({ est_nouveaute: true })} />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('n\'affiche pas "New" quand en promo (promo prioritaire)', () => {
    renderWithProviders(<NProductCard product={makeProduct({ est_nouveaute: true, prix_promo: 20000 })} />)
    expect(screen.queryByText('New')).not.toBeInTheDocument()
  })
})
