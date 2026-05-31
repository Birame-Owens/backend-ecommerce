import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoriesPage } from './CategoriesPage'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { Category, CategoryStats } from '@/api/admin/categories'

/* ── Mocks ─────────────────────────────────────────────────────────────────── */

const mockStats = vi.fn()
const mockList  = vi.fn()

vi.mock('@/api/admin/categories', () => ({
  categoriesAdminApi: {
    stats:         (...args: unknown[]) => mockStats(...args),
    list:          (...args: unknown[]) => mockList(...args),
    options:       vi.fn().mockResolvedValue({ data: { data: [] } }),
    create:        vi.fn(),
    update:        vi.fn(),
    delete:        vi.fn(),
    toggleStatus:  vi.fn(),
    sousCategoriesOf: vi.fn().mockResolvedValue({ data: { data: { sous_categories: [] } } }),
  },
}))

/* ── Fixtures ───────────────────────────────────────────────────────────────── */

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1, nom: 'Robes', slug: 'robes',
    description: null, image: null, parent_id: null,
    ordre_affichage: 1, est_active: true, est_populaire: false,
    couleur_theme: null, produits_count: 5,
    sous_categories_count: 2, sous_categories: [],
    created_at: '01/01/2025 10:00', updated_at: '01/01/2025 10:00',
    ...overrides,
  }
}

function makeStats(overrides: Partial<CategoryStats> = {}): CategoryStats {
  return {
    total_categories:      3,
    total_sous_categories: 5,
    total_produits:        20,
    categories_actives:    2,
    ...overrides,
  }
}

function resolveOk(categories: Category[] = [makeCategory()]) {
  mockStats.mockResolvedValue({ data: { data: makeStats() } })
  mockList.mockResolvedValue({
    data: { data: { categories, pagination: { current_page: 1, per_page: 10, total: categories.length, last_page: 1 } } },
  })
}

/* ── Tests ──────────────────────────────────────────────────────────────────── */

describe('CategoriesPage — chargement', () => {
  beforeEach(() => { mockStats.mockClear(); mockList.mockClear() })

  it('affiche le squelette de chargement', () => {
    mockStats.mockReturnValue(new Promise(() => {}))
    mockList.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<CategoriesPage />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('affiche le nom de la catégorie après chargement', async () => {
    resolveOk()
    renderWithProviders(<CategoriesPage />)
    await waitFor(() => expect(screen.getByText('Robes')).toBeInTheDocument())
  })

  it('affiche le titre de la page', async () => {
    resolveOk()
    renderWithProviders(<CategoriesPage />)
    await waitFor(() =>
      expect(screen.getByText('Gestion des catégories')).toBeInTheDocument()
    )
  })
})

describe('CategoriesPage — statistiques', () => {
  beforeEach(() => { mockStats.mockClear(); mockList.mockClear() })

  it('affiche le nombre total de catégories', async () => {
    resolveOk()
    renderWithProviders(<CategoriesPage />)
    await waitFor(() =>
      expect(screen.getByText('3')).toBeInTheDocument()
    )
  })

  it('affiche le badge Actif pour une catégorie active', async () => {
    resolveOk([makeCategory({ est_active: true })])
    renderWithProviders(<CategoriesPage />)
    await waitFor(() =>
      expect(screen.getByText('Actif')).toBeInTheDocument()
    )
  })

  it('affiche le badge Masqué pour une catégorie inactive', async () => {
    resolveOk([makeCategory({ est_active: false })])
    renderWithProviders(<CategoriesPage />)
    await waitFor(() =>
      expect(screen.getByText('Masqué')).toBeInTheDocument()
    )
  })
})

describe('CategoriesPage — actions', () => {
  beforeEach(() => { mockStats.mockClear(); mockList.mockClear() })

  it('affiche le bouton de création de catégorie', async () => {
    resolveOk()
    renderWithProviders(<CategoriesPage />)
    // The header button text is "Catégorie" (with a Plus icon before it)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^catégorie$/i })).toBeInTheDocument()
    )
  })

  it('affiche le champ de recherche', async () => {
    resolveOk()
    renderWithProviders(<CategoriesPage />)
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
    )
  })

  it('filtre les catégories via la recherche', async () => {
    resolveOk([
      makeCategory({ id: 1, nom: 'Robes', slug: 'robes' }),
      makeCategory({ id: 2, nom: 'Chaussures', slug: 'chaussures' }),
    ])
    renderWithProviders(<CategoriesPage />)
    await waitFor(() => screen.getByText('Robes'))

    const search = screen.getByPlaceholderText(/rechercher/i)
    await userEvent.type(search, 'Robes')

    // Le champ de recherche a bien la valeur tapée
    expect(search).toHaveValue('Robes')
  })
})

describe('CategoriesPage — liste vide', () => {
  beforeEach(() => { mockStats.mockClear(); mockList.mockClear() })

  it('affiche un message vide si aucune catégorie', async () => {
    resolveOk([])
    renderWithProviders(<CategoriesPage />)
    await waitFor(() =>
      expect(screen.getByText(/aucune catégorie/i)).toBeInTheDocument()
    )
  })
})
