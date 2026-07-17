/**
 * Intégration Google Analytics 4 (gtag.js).
 *
 * L'ID de mesure vient de Admin → Réglages → Analytics (piloté par
 * commerçant, voir [[shopStore]]) — jamais codé en dur, ce site étant
 * revendu à plusieurs commerçants avec des comptes GA distincts.
 *
 * SPA : GA ne voit pas les navigations React Router par défaut, d'où
 * send_page_view: false + trackPageview() appelé manuellement à chaque
 * changement de route (voir ClientLayout).
 */

type GtagArgs = [string, string, Record<string, unknown>?] | [string, Date]

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: GtagArgs) => void
  }
}

let currentMeasurementId: string | null = null

export function initGA(measurementId: string | null | undefined): void {
  if (!measurementId || measurementId === currentMeasurementId) return

  const alreadyLoaded = !!window.gtag
  currentMeasurementId = measurementId

  if (!alreadyLoaded) {
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag(...args: GtagArgs) { window.dataLayer!.push(args) }
    window.gtag('js', new Date())

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)
  }

  window.gtag!('config', measurementId, { send_page_view: false })
}

export function trackPageview(path: string, title?: string): void {
  if (!currentMeasurementId || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  })
}

export interface GAItem {
  item_id: string | number
  item_name: string
  price: number
  item_category?: string | null
  quantity?: number
}

const CURRENCY = 'XOF'

function trackEvent(event: string, params: Record<string, unknown>): void {
  if (!currentMeasurementId || !window.gtag) return
  window.gtag('event', event, params)
}

export function trackViewItem(item: GAItem): void {
  trackEvent('view_item', { currency: CURRENCY, value: item.price, items: [item] })
}

export function trackAddToCart(item: GAItem): void {
  trackEvent('add_to_cart', { currency: CURRENCY, value: item.price * (item.quantity ?? 1), items: [item] })
}

export function trackRemoveFromCart(item: GAItem): void {
  trackEvent('remove_from_cart', { currency: CURRENCY, value: item.price * (item.quantity ?? 1), items: [item] })
}

export function trackBeginCheckout(items: GAItem[], value: number): void {
  trackEvent('begin_checkout', { currency: CURRENCY, value, items })
}

export function trackPurchase(orderId: string, value: number, shipping: number, items: GAItem[]): void {
  trackEvent('purchase', { transaction_id: orderId, currency: CURRENCY, value, shipping, items })
}
