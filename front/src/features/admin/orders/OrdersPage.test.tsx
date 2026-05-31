import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrdersPage from './OrdersPage'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { AdminOrderListItem, AdminOrderStats } from '@/types/admin'

/* ── Mocks ─────────────────────────────────────────────────────────────────── */

const mockList  = vi.fn()
const mockStats = vi.fn()

vi.mock('@/api/admin/orders', () => ({
  ordersAdminApi: {
    list:             (...args: unknown[]) => mockList(...args),
    stats:            (...args: unknown[]) => mockStats(...args),
    show:             vi.fn(),
    create:           vi.fn(),
    updateStatus:     vi.fn(),
    markPaid:         vi.fn(),
    remove:           vi.fn(),
    clientsWithMesures: vi.fn().mockResolvedValue({ data: { data: { clients: [] } } }),
    products:         vi.fn().mockResolvedValue({ data: { data: { produits: [] } } }),
  },
}))

// Les modales utilisent des imports séparés — on les stubbs
vi.mock('@/features/admin/orders/components/CreateOrderModal', () => ({
  CreateOrderModal: () => null,
}))
vi.mock('@/features/admin/orders/components/OrderDetailsModal', () => ({
  OrderDetailsModal: () => null,
}))
vi.mock('@/features/admin/orders/components/PaymentModal', () => ({
  PaymentModal: () => null,
}))

/* ── Fixtures ───────────────────────────────────────────────────────────────── */

function makeOrder(overrides: Partial<AdminOrderListItem> = {}): AdminOrderListItem {
  return {
    id: 1,
    numero_commande: 'CMD-001',
    client: null,
    nom_destinataire: 'Fatou Diallo',
    telephone_livraison: '771234567',
    montant_total: 35000,
    statut: 'en_attente',
    statut_label: 'En attente',
    priorite: 'normale',
    date_commande: '2025-01-15 10:00',
    date_livraison_prevue: null,
    nb_articles: 2,
    est_payee: false,
    peut_modifier: true,
    peut_supprimer: true,
    est_en_retard: false,
    ...overrides,
  }
}

function makeStats(overrides: Partial<AdminOrderStats> = {}): AdminOrderStats {
  return {
    total_commandes:       10,
    commandes_en_attente:  3,
    commandes_livrees:     5,
    commandes_annulees:    2,
    ca_total:              500000,
    ca_ce_mois:            120000,
    ...overrides,
  }
}

function resolveOk(orders: AdminOrderListItem[] = [makeOrder()]) {
  mockList.mockResolvedValue({
    data: {
      data: {
        commandes: orders,
        pagination: { current_page: 1, per_page: 20, total: orders.length, last_page: 1 },
      },
    },
  })
  mockStats.mockResolvedValue({ data: { data: makeStats() } })
}

/* ── Tests ──────────────────────────────────────────────────────────────────── */

describe('OrdersPage — chargement', () => {
  beforeEach(() => { mockList.mockClear(); mockStats.mockClear() })

  it('affiche le squelette pendant le chargement', () => {
    mockList.mockReturnValue(new Promise(() => {}))
    mockStats.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<OrdersPage />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('affiche le numéro de commande après chargement', async () => {
    resolveOk()
    renderWithProviders(<OrdersPage />)
    // Dual layout (mobile + desktop) → multiple elements possible
    await waitFor(() => expect(screen.getAllByText('CMD-001').length).toBeGreaterThan(0))
  })

  it('affiche le nom du destinataire', async () => {
    resolveOk()
    renderWithProviders(<OrdersPage />)
    await waitFor(() => expect(screen.getAllByText('Fatou Diallo').length).toBeGreaterThan(0))
  })
})

describe('OrdersPage — liste vide', () => {
  beforeEach(() => { mockList.mockClear(); mockStats.mockClear() })

  it('affiche un message vide si aucune commande', async () => {
    resolveOk([])
    renderWithProviders(<OrdersPage />)
    await waitFor(() =>
      expect(screen.getByText(/aucune commande/i)).toBeInTheDocument()
    )
  })
})

describe('OrdersPage — statuts', () => {
  beforeEach(() => { mockList.mockClear(); mockStats.mockClear() })

  it('affiche le label de statut "En attente"', async () => {
    resolveOk([makeOrder({ statut: 'en_attente', statut_label: 'En attente' })])
    renderWithProviders(<OrdersPage />)
    // "En attente" appears for both the status badge and the payment badge
    await waitFor(() =>
      expect(screen.getAllByText(/en attente/i).length).toBeGreaterThan(0)
    )
  })

  it('affiche "En retard" pour une commande en retard', async () => {
    resolveOk([makeOrder({ est_en_retard: true })])
    renderWithProviders(<OrdersPage />)
    await waitFor(() =>
      expect(screen.getByText('En retard')).toBeInTheDocument()
    )
  })
})

describe('OrdersPage — filtres', () => {
  beforeEach(() => { mockList.mockClear(); mockStats.mockClear() })

  it('affiche le champ de recherche par numéro de commande', async () => {
    resolveOk()
    renderWithProviders(<OrdersPage />)
    // Actual placeholder: "Numero commande…"
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Numero commande/i)).toBeInTheDocument()
    )
  })

  it('affiche le champ de recherche client', async () => {
    resolveOk()
    renderWithProviders(<OrdersPage />)
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/client/i)).toBeInTheDocument()
    )
  })

  it('met à jour le filtre numéro lors de la saisie', async () => {
    resolveOk()
    renderWithProviders(<OrdersPage />)
    await waitFor(() => screen.getByPlaceholderText(/Numero commande/i))

    const input = screen.getByPlaceholderText(/Numero commande/i)
    await userEvent.type(input, 'CMD-001')
    expect(input).toHaveValue('CMD-001')
  })
})

describe('OrdersPage — pagination', () => {
  beforeEach(() => { mockList.mockClear(); mockStats.mockClear() })

  it('affiche la pagination quand plusieurs pages', async () => {
    mockList.mockResolvedValue({
      data: {
        data: {
          commandes: [makeOrder()],
          pagination: { current_page: 1, per_page: 20, total: 25, last_page: 2 },
        },
      },
    })
    mockStats.mockResolvedValue({ data: { data: makeStats() } })

    renderWithProviders(<OrdersPage />)
    // The pagination renders page number buttons (e.g., "1", "2")
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: '2' }).length).toBeGreaterThan(0)
    )
  })
})
