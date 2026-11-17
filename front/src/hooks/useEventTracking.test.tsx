import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

const logEvent = vi.fn()
const exitHooks: Array<() => void> = []
vi.mock('@/lib/events', () => ({
  logEvent: (...a: unknown[]) => logEvent(...a),
  onPageExit: (hook: () => void) => { exitHooks.push(hook); return () => { exitHooks.splice(exitHooks.indexOf(hook), 1) } },
}))

import { useDwellTime, useRecoTracking } from './useEventTracking'

describe('useDwellTime — temps passé sur une fiche', () => {
  beforeEach(() => { logEvent.mockReset(); exitHooks.length = 0 })

  it('envoie la durée en quittant la fiche', () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const { unmount } = renderHook(() => useDwellTime(7))
    now.mockReturnValue(13_500)

    unmount()

    expect(logEvent).toHaveBeenCalledWith('temps_vue_produit', {
      produit_id: 7, metadata: expect.objectContaining({ duree_ms: 12_500 }),
    })
    now.mockRestore()
  })

  it("envoie un morceau quand l'onglet se cache, sans le compter deux fois", () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(0)
    const { unmount } = renderHook(() => useDwellTime(7))
    now.mockReturnValue(5000)

    exitHooks.forEach((h) => h()) // onglet caché
    unmount()                       // déjà envoyé : rien de plus

    expect(logEvent).toHaveBeenCalledTimes(1)
    expect(logEvent.mock.calls[0][1].metadata.duree_ms).toBe(5000)
    now.mockRestore()
  })

  it('ne fait rien sans produit', () => {
    const { unmount } = renderHook(() => useDwellTime(null))
    unmount()
    expect(logEvent).not.toHaveBeenCalled()
  })
})

describe('useRecoTracking — recommandations', () => {
  beforeEach(() => logEvent.mockReset())

  it('journalise le clic avec la position et le produit d’origine', () => {
    const { result } = renderHook(() => useRecoTracking({
      source: 'produits_similaires', version: 'categorie_v1', produitOrigine: 7, produits: [3, 4, 5],
    }))

    result.current.onClick(4, 2)

    expect(logEvent).toHaveBeenCalledWith('clic_reco', {
      produit_id: 4,
      metadata: { source: 'produits_similaires', version: 'categorie_v1', position: 2, produit_origine: 7 },
    })
  })
})
