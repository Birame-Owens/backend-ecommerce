import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const post = vi.fn()
vi.mock('@/lib/clientAxios', () => ({ default: { post: (...a: unknown[]) => post(...a) } }))

import {
  logEvent, onPageExit, logSessionStart, startEventTracking,
  FLUSH_DELAY_MS, MAX_BATCH, __resetEventsForTests,
} from './events'

function sentEvents(callIndex = 0) {
  return (post.mock.calls[callIndex][1] as { events: Array<{ type: string }> }).events
}

describe('events — envoi par paquets', () => {
  let beacon: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    post.mockReset().mockResolvedValue({})
    __resetEventsForTests()
    beacon = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true })
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('regroupe plusieurs événements en une seule requête', async () => {
    logEvent('ajout_panier', { produit_id: 1 })
    logEvent('vue_panier')
    logEvent('retrait_panier', { produit_id: 1 })
    expect(post).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(FLUSH_DELAY_MS)

    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][0]).toBe('/api/client/evenements/batch')
    expect(sentEvents().map((e) => e.type)).toEqual(['ajout_panier', 'vue_panier', 'retrait_panier'])
  })

  it('envoie tout de suite quand le paquet est plein', () => {
    for (let i = 0; i < MAX_BATCH; i++) logEvent('ajout_panier', { produit_id: i + 1 })
    expect(post).toHaveBeenCalledTimes(1)
    expect(sentEvents()).toHaveLength(MAX_BATCH)
  })

  it('à la fermeture : exécute les crochets de sortie puis envoie via sendBeacon', async () => {
    sessionStorage.setItem('ndeya-session-debut', '1')
    startEventTracking()
    onPageExit(() => logEvent('temps_vue_produit', { produit_id: 7, metadata: { duree_ms: 1200 } }))
    logEvent('vue_panier')

    window.dispatchEvent(new Event('pagehide'))

    expect(post).not.toHaveBeenCalled()
    expect(beacon).toHaveBeenCalledTimes(1)
    const [url, blob] = beacon.mock.calls[0] as [string, Blob]
    expect(url).toContain('/api/client/evenements/batch')
    expect(blob.type).toContain('text/plain')
    vi.useRealTimers() // FileReader s'appuie sur de vrais minuteurs
    const texte = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(blob)
    })
    const corps = JSON.parse(texte) as { events: Array<{ type: string }> }
    expect(corps.events.map((e) => e.type)).toEqual(['vue_panier', 'temps_vue_produit'])
  })

  it('le début de visite est journalisé une seule fois par session, avec la provenance', async () => {
    window.history.pushState({}, '', '/produits/robe?utm_source=facebook&utm_campaign=soldes&fbclid=abc')
    logSessionStart()
    logSessionStart()
    await vi.advanceTimersByTimeAsync(FLUSH_DELAY_MS)

    const events = sentEvents() as Array<{ type: string; metadata: Record<string, unknown> }>
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('debut_session')
    expect(events[0].metadata).toMatchObject({
      page_arrivee: '/produits/robe', utm_source: 'facebook', utm_campaign: 'soldes', pub_meta: true,
    })
  })

  it("rien n'est journalisé sur les pages d'administration", async () => {
    window.history.pushState({}, '', '/admin/commandes')
    logSessionStart()
    await vi.advanceTimersByTimeAsync(FLUSH_DELAY_MS)
    expect(post).not.toHaveBeenCalled()
    window.history.pushState({}, '', '/')
  })

  it('les clics vers WhatsApp sont journalisés depuis n’importe quel lien', async () => {
    window.history.pushState({}, '', '/panier')
    sessionStorage.setItem('ndeya-session-debut', '1')
    startEventTracking()
    const a = document.createElement('a')
    a.href = 'https://wa.me/221770000000?text=Bonjour'
    a.addEventListener('click', (e) => e.preventDefault())
    document.body.appendChild(a)

    a.click()
    await vi.advanceTimersByTimeAsync(FLUSH_DELAY_MS)

    const events = sentEvents() as Array<{ type: string; metadata: Record<string, unknown> }>
    expect(events[0]).toMatchObject({ type: 'clic_whatsapp', metadata: { page: '/panier' } })
    a.remove()
  })
})
