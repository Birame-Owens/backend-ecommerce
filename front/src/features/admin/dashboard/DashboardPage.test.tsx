import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardPage } from './DashboardPage'
import { renderWithProviders } from '@/test/renderWithProviders'

/* ── Mocks ─────────────────────────────────────────────────────────────────── */

vi.mock('@/store/adminAuthStore', () => ({
  useAdminAuthStore: () => ({ user: { name: 'Alice Admin' } }),
}))

const mockGetStats = vi.fn()
const mockGetQuickStats = vi.fn()

vi.mock('@/api/admin/dashboard', () => ({
  dashboardApi: {
    getStats:      (...args: unknown[]) => mockGetStats(...args),
    getQuickStats: (...args: unknown[]) => mockGetQuickStats(...args),
  },
}))

/* ── Fixtures ───────────────────────────────────────────────────────────────── */

function makeDashboardData() {
  return {
    overview: { chiffre_affaires_mois: 150000, commandes_mois: 12, nouveaux_clients: 5 },
    orders:   { pending: 3, confirmed: 4, in_production: 2, completed: 8 },
    sales:    { growth_percentage: 15, is_positive_growth: true },
  }
}

function resolveOk() {
  mockGetStats.mockResolvedValue({ data: { data: makeDashboardData() } })
  mockGetQuickStats.mockResolvedValue({ data: { data: {} } })
}

/* ── Tests ──────────────────────────────────────────────────────────────────── */

describe('DashboardPage — chargement', () => {
  beforeEach(() => {
    mockGetStats.mockClear()
    mockGetQuickStats.mockClear()
  })

  it('affiche le spinner pendant le chargement', () => {
    mockGetStats.mockReturnValue(new Promise(() => {}))
    mockGetQuickStats.mockReturnValue(new Promise(() => {}))

    renderWithProviders(<DashboardPage />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('affiche le prénom de l\'admin dans le titre', async () => {
    resolveOk()
    renderWithProviders(<DashboardPage />)
    await waitFor(() =>
      expect(screen.getByText(/Bonjour,\s*Alice/i)).toBeInTheDocument()
    )
  })

  it('affiche le message d\'erreur et le bouton Réessayer si l\'API échoue', async () => {
    mockGetStats.mockRejectedValue(new Error('Network error'))
    mockGetQuickStats.mockRejectedValue(new Error('Network error'))

    renderWithProviders(<DashboardPage />)

    await waitFor(() =>
      expect(screen.getByText(/erreur de chargement/i)).toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
  })

  it('recharge les données au clic sur Réessayer', async () => {
    mockGetStats.mockRejectedValueOnce(new Error('fail'))
    mockGetQuickStats.mockRejectedValueOnce(new Error('fail'))
    resolveOk()

    renderWithProviders(<DashboardPage />)

    await waitFor(() => screen.getByRole('button', { name: /réessayer/i }))
    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }))

    // Le second appel réussit — les données de dashboard doivent s'afficher
    await waitFor(() =>
      expect(screen.queryByText(/erreur de chargement/i)).not.toBeInTheDocument()
    )
  })
})
