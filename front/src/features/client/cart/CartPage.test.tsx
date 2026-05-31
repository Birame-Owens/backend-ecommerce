import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartPage } from './CartPage'
import { useCartStore } from '@/store/cartStore'
import { renderWithProviders } from '@/test/renderWithProviders'
import { matchPrice, matchNegPrice } from '@/test/testUtils'

/* ── Mocks ─────────────────────────────────────────────────────────── */
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/store/clientAuthStore', () => ({
  useClientAuthStore: (sel: (s: { isAuthenticated: boolean; user: null }) => unknown) =>
    sel({ isAuthenticated: false, user: null }),
}))

vi.mock('@/store/shopStore', () => ({
  useShopStore: (sel: (s: { waNumber: string }) => unknown) => sel({ waNumber: '221784661412' }),
  buildWaUrl: (_: string, msg: string) => `https://wa.me/?text=${encodeURIComponent(msg)}`,
}))

vi.mock('@/api/client/checkout', () => ({
  checkoutApi: { validateCoupon: vi.fn() },
}))

/* ── Helpers ───────────────────────────────────────────────────────── */
function resetCart() {
  useCartStore.setState({ items: [], coupon: null })
}

function addItem(overrides: {
  id?: number; nom?: string; slug?: string; taille?: string | null;
  couleur?: string | null; type_variante?: 'vetement' | 'parfum' | 'chaussure' | 'aucun';
  prix?: number; qty?: number; stock_max?: number | null;
} = {}) {
  useCartStore.getState().addItem({
    id: 1, nom: 'T-shirt Blanc', slug: 'tshirt-blanc',
    prix: 18000, image: null, couleur: 'Blanc', taille: 'M',
    type_variante: 'vetement', qty: 1, stock_max: 10,
    ...overrides,
  })
}

/* ── Tests ─────────────────────────────────────────────────────────── */
describe('CartPage — panier vide', () => {
  beforeEach(() => { resetCart(); mockNavigate.mockClear() })

  it('affiche le message "panier est vide"', () => {
    renderWithProviders(<CartPage />)
    expect(screen.getByText(/panier est vide/i)).toBeInTheDocument()
  })

  it('affiche le bouton pour explorer les collections', () => {
    renderWithProviders(<CartPage />)
    expect(screen.getByRole('button', { name: /explorer/i })).toBeInTheDocument()
  })

  it('navigue vers /categories depuis le panier vide', () => {
    renderWithProviders(<CartPage />)
    fireEvent.click(screen.getByRole('button', { name: /explorer/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/categories')
  })
})

describe('CartPage — avec articles', () => {
  beforeEach(() => { resetCart(); mockNavigate.mockClear() })

  it('affiche le nom de l\'article', () => {
    addItem()
    renderWithProviders(<CartPage />)
    expect(screen.getByText('T-shirt Blanc')).toBeInTheDocument()
  })

  it('affiche les labels Couleur et Taille pour un vêtement', () => {
    addItem({ couleur: 'Noir', taille: 'L', type_variante: 'vetement' })
    renderWithProviders(<CartPage />)
    expect(screen.getByText('Couleur :')).toBeInTheDocument()
    expect(screen.getByText('Taille :')).toBeInTheDocument()
    expect(screen.getByText('Noir')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
  })

  it('affiche "Pointure" pour les chaussures', () => {
    addItem({ type_variante: 'chaussure', couleur: 'Noir', taille: '42' })
    renderWithProviders(<CartPage />)
    expect(screen.getByText('Pointure :')).toBeInTheDocument()
  })

  it('affiche "Senteur" et "Contenance" pour les parfums', () => {
    addItem({ type_variante: 'parfum', couleur: 'Rose', taille: '100ml' })
    renderWithProviders(<CartPage />)
    expect(screen.getByText('Senteur :')).toBeInTheDocument()
    expect(screen.getByText('Contenance :')).toBeInTheDocument()
  })

  it('affiche le prix total de la ligne (prix × qty)', () => {
    addItem({ prix: 18000, qty: 2 })
    renderWithProviders(<CartPage />)
    // 18000 × 2 = 36000 — apparaît dans la ligne ET le sous-total
    expect(screen.getAllByText(matchPrice(36000)).length).toBeGreaterThan(0)
  })

  it('affiche le sous-total dans le résumé', () => {
    addItem({ prix: 18000, qty: 1 })
    renderWithProviders(<CartPage />)
    expect(screen.getAllByText(matchPrice(18000)).length).toBeGreaterThan(0)
  })
})

describe('CartPage — suppression d\'article', () => {
  beforeEach(() => { resetCart(); mockNavigate.mockClear() })

  it('ouvre la modale de confirmation au clic sur Retirer', async () => {
    addItem()
    renderWithProviders(<CartPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Retirer' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('supprime l\'article après confirmation dans la modale', async () => {
    addItem()
    renderWithProviders(<CartPage />)
    // Clic sur le bouton "Retirer" de la ligne (aria-label)
    await userEvent.click(screen.getByRole('button', { name: 'Retirer' }))
    // La modale s'ouvre — cibler le bouton "Retirer" de confirmation à l'intérieur
    const modal = await screen.findByRole('dialog')
    await userEvent.click(within(modal).getByRole('button', { name: /retirer/i }))
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('annule la suppression', async () => {
    addItem()
    renderWithProviders(<CartPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Retirer' }))
    const modal = await screen.findByRole('dialog')
    await userEvent.click(within(modal).getByRole('button', { name: /annuler/i }))
    expect(useCartStore.getState().items).toHaveLength(1)
  })
})

describe('CartPage — plusieurs articles', () => {
  beforeEach(() => { resetCart(); mockNavigate.mockClear() })

  it('affiche le compte total d\'articles dans le titre', () => {
    addItem({ id: 1, nom: 'Article A', qty: 2, couleur: 'Rouge' })
    addItem({ id: 2, nom: 'Article B', slug: 'b', qty: 1, couleur: 'Bleu' })
    renderWithProviders(<CartPage />)
    expect(screen.getByText(/3 article/i)).toBeInTheDocument()
  })

  it('calcule le sous-total de plusieurs articles', () => {
    addItem({ id: 1, nom: 'A', prix: 10000, qty: 1, couleur: 'Rouge' })
    addItem({ id: 2, nom: 'B', slug: 'b', prix: 5000, qty: 2, couleur: 'Bleu' })
    // 10000 + 2×5000 = 20000
    renderWithProviders(<CartPage />)
    expect(screen.getAllByText(matchPrice(20000)).length).toBeGreaterThan(0)
  })
})

describe('CartPage — coupon', () => {
  beforeEach(() => { resetCart(); mockNavigate.mockClear() })

  it('affiche le champ de saisie code promo', () => {
    addItem()
    renderWithProviders(<CartPage />)
    expect(screen.getByPlaceholderText(/code promo/i)).toBeInTheDocument()
  })

  it('affiche le coupon appliqué et sa réduction', () => {
    addItem({ prix: 20000, qty: 1 })
    useCartStore.setState({
      items: useCartStore.getState().items,
      coupon: { code: 'PROMO5000', nom: 'Promo test', discount: 5000 },
    })
    renderWithProviders(<CartPage />)
    expect(screen.getByText('PROMO5000')).toBeInTheDocument()
    // La réduction est dans une span "-5 000 F" (avec tiret)
    expect(screen.getByText(matchNegPrice(5000))).toBeInTheDocument()
  })

  it('affiche le total après déduction du coupon', () => {
    addItem({ prix: 20000, qty: 1 })
    useCartStore.setState({
      items: useCartStore.getState().items,
      coupon: { code: 'X', nom: 'X', discount: 5000 },
    })
    renderWithProviders(<CartPage />)
    // total = 20000 - 5000 = 15000
    expect(screen.getAllByText(matchPrice(15000)).length).toBeGreaterThan(0)
  })
})

describe('CartPage — CTA paiement', () => {
  beforeEach(() => { resetCart(); mockNavigate.mockClear() })

  it('navigue vers /checkout au clic sur "Payer en ligne"', () => {
    addItem()
    renderWithProviders(<CartPage />)
    fireEvent.click(screen.getByRole('button', { name: /payer en ligne/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/checkout')
  })
})

describe('CartPage — contrôle de quantité', () => {
  beforeEach(() => { resetCart(); mockNavigate.mockClear() })

  it('augmente la quantité au clic sur +', async () => {
    addItem({ qty: 1, stock_max: 5 })
    renderWithProviders(<CartPage />)
    await userEvent.click(screen.getByRole('button', { name: /augmenter la quantité de t-shirt blanc/i }))
    expect(useCartStore.getState().items[0].qty).toBe(2)
  })

  it('diminue la quantité au clic sur − quand qty > 1', async () => {
    addItem({ qty: 3, stock_max: 5 })
    renderWithProviders(<CartPage />)
    await userEvent.click(screen.getByRole('button', { name: /diminuer la quantité de t-shirt blanc/i }))
    expect(useCartStore.getState().items[0].qty).toBe(2)
  })

  it('désactive + quand la quantité atteint stock_max', () => {
    addItem({ qty: 5, stock_max: 5 })
    renderWithProviders(<CartPage />)
    expect(screen.getByRole('button', { name: /augmenter la quantité de t-shirt blanc/i })).toBeDisabled()
  })
})
