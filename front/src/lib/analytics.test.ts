import { beforeEach, describe, expect, it, vi } from 'vitest'

// Le module garde l'ID courant en mémoire : on le recharge à neuf pour chaque test.
async function freshAnalytics() {
  vi.resetModules()
  return import('./analytics')
}

function fbqCalls(): unknown[][] {
  return (window.fbq!.queue as unknown[][]).slice()
}

// Le rechargement du module (vi.resetModules + import) peut dépasser les 5 s par défaut
// quand toute la suite tourne en parallèle.
describe('pixel Meta', { timeout: 30000 }, () => {
  beforeEach(() => {
    delete window.fbq
    delete window._fbq
    delete window.gtag
    document.head.querySelectorAll('script').forEach((s) => s.remove())
  })

  it('charge fbevents.js une seule fois et initialise le pixel', async () => {
    const a = await freshAnalytics()
    a.initMetaPixel('2662935704152680')
    a.initMetaPixel('2662935704152680')

    const scripts = document.head.querySelectorAll('script[src*="connect.facebook.net"]')
    expect(scripts).toHaveLength(1)
    expect(fbqCalls()).toEqual([['init', '2662935704152680']])
  })

  it('ignore un identifiant qui n\'est pas une suite de chiffres', async () => {
    const a = await freshAnalytics()
    a.initMetaPixel('<script>alert(1)</script>')
    a.initMetaPixel('')

    expect(window.fbq).toBeUndefined()
    expect(document.head.querySelector('script[src*="facebook"]')).toBeNull()
  })

  it('n\'envoie rien tant que le pixel n\'est pas configuré', async () => {
    const a = await freshAnalytics()
    a.trackPageview('/produits')
    a.trackAddToCart({ item_id: 7, item_name: 'Robe Wax', price: 15000, quantity: 1 })

    expect(window.fbq).toBeUndefined()
  })

  it('traduit les évènements e-commerce au format Meta (F CFA)', async () => {
    const a = await freshAnalytics()
    a.initMetaPixel('2662935704152680')

    a.trackPageview('/')
    a.trackViewItem({ item_id: 7, item_name: 'Robe Wax', price: 15000, item_category: 'Robes' })
    a.trackAddToCart({ item_id: 7, item_name: 'Robe Wax', price: 15000, quantity: 2 })
    a.trackBeginCheckout([{ item_id: 7, item_name: 'Robe Wax', price: 15000, quantity: 2 }], 30000)
    a.trackPurchase('CMD-1', 31500, 1500, [{ item_id: 7, item_name: 'Robe Wax', price: 15000, quantity: 2 }])

    const calls = fbqCalls().slice(1) // sans le 'init'
    expect(calls.map((c) => c[1])).toEqual(['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'])

    const addToCart = calls[2][2] as Record<string, unknown>
    expect(addToCart).toMatchObject({ currency: 'XOF', value: 30000, content_ids: ['7'], content_type: 'product', num_items: 2 })

    const purchase = calls[4]
    expect(purchase[2]).toMatchObject({ currency: 'XOF', value: 31500 })
    expect(purchase[3]).toEqual({ eventID: 'purchase_CMD-1' })
  })
})
