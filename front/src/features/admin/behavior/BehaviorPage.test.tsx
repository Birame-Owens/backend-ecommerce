import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BehaviorPage from './BehaviorPage'
import { renderWithProviders } from '@/test/renderWithProviders'

const mockComportement = vi.fn()

vi.mock('@/api/admin/rapports', () => ({
  rapportsAdminApi: {
    comportement: (...args: unknown[]) => mockComportement(...args),
  },
}))

function rapportVide() {
  return {
    resume: { visiteurs_uniques: 3, vues_produits: 5, ajouts_panier: 1, debuts_paiement: 1, achats: 0 },
    entonnoir: [],
    produits_performance: [],
    recherches_frequentes: [],
    recherches_sans_resultat: [],
    top_categories: [],
    echecs_paiement: [],
  }
}

describe('BehaviorPage — périodes journalières', () => {
  beforeEach(() => {
    mockComportement.mockReset()
    mockComportement.mockResolvedValue({ data: { data: rapportVide() } })
  })

  it('charge les 30 derniers jours par défaut', async () => {
    renderWithProviders(<BehaviorPage />)
    await waitFor(() => expect(mockComportement).toHaveBeenCalledWith({ periode: '30_jours' }))
  })

  it("affiche les événements d'aujourd'hui et d'hier", async () => {
    renderWithProviders(<BehaviorPage />)
    await waitFor(() => expect(mockComportement).toHaveBeenCalled())

    await userEvent.click(screen.getByRole('button', { name: "Aujourd'hui" }))
    await waitFor(() => expect(mockComportement).toHaveBeenLastCalledWith({ periode: 'aujourd_hui' }))

    await userEvent.click(screen.getByRole('button', { name: 'Hier' }))
    await waitFor(() => expect(mockComportement).toHaveBeenLastCalledWith({ periode: 'hier' }))
  })

  it('un jour choisi dans le calendrier est envoyé comme période personnalisée d\'un jour', async () => {
    renderWithProviders(<BehaviorPage />)
    await waitFor(() => expect(mockComportement).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText('Choisir un jour'), { target: { value: '2026-11-05' } })

    await waitFor(() => expect(mockComportement).toHaveBeenLastCalledWith({
      periode: 'personnalise', date_debut: '2026-11-05', date_fin: '2026-11-05',
    }))
  })
})
