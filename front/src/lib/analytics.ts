/**
 * Intégration Google Analytics 4 (gtag.js) et pixel Meta (voir initMetaPixel plus bas).
 *
 * L'ID de mesure vient de Admin → Réglages → Analytics (piloté par
 * commerçant, voir [[shopStore]]) — jamais codé en dur, ce site étant
 * revendu à plusieurs commerçants avec des comptes GA distincts.
 *
 * SPA : GA ne voit pas les navigations React Router par défaut, d'où
 * send_page_view: false + trackPageview() appelé manuellement à chaque
 * changement de route (voir ClientLayout).
 *
 * Certains navigateurs intégrés (Instagram, WhatsApp, Snapchat) bloquent ou
 * limitent googletagmanager.com — cf. les erreurs Sentry
 * "webkit.messageHandlers" émises par ces mêmes navigateurs. On journalise
 * l'échec de chargement du script (via Sentry si dispo) pour avoir une
 * preuve concrète plutôt que de deviner, sans jamais faire planter la page.
 *
 * Consent Mode : sans signal de consentement explicite, gtag.js met les
 * évènements en file d'attente (dataLayer) sans jamais les envoyer, de façon
 * silencieuse — script chargé, config exécutée, mais aucun hit ne part.
 * Le site n'a pas de bannière de cookies, donc on accorde le consentement
 * par défaut avant tout autre appel gtag (sinon rien ne s'envoie jamais).
 */

import * as Sentry from '@sentry/react'

type GtagArgs =
  | [string, string, Record<string, unknown>?]
  | [string, Date]
  | [string, Record<string, string>]

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  push: FbqFn
  loaded: boolean
  version: string
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: GtagArgs) => void
    fbq?: FbqFn
    _fbq?: FbqFn
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

    // Doit être appelé avant 'js'/'config' : sans ça, gtag.js met les hits en
    // attente indéfiniment sans jamais les envoyer (voir note en haut du fichier).
    window.gtag('consent', 'default', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
    })
    window.gtag('js', new Date())

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    script.onerror = () => {
      Sentry.captureMessage('gtag.js n\'a pas pu se charger (navigateur intégré ou bloqueur ?)', {
        level: 'warning',
        tags: { source: 'analytics' },
        extra: { userAgent: navigator.userAgent, measurementId },
      })
    }
    document.head.appendChild(script)
  }

  window.gtag!('config', measurementId, { send_page_view: false })
}

/**
 * Pixel Meta (Facebook / Instagram Ads), même principe que GA : l'ID vient de
 * Admin → Réglages → Analytics, jamais codé en dur (site revendu en marque blanche).
 * Reprend le snippet officiel de Meta (file d'attente fbq + fbevents.js asynchrone).
 * Indispensable aux campagnes « Ventes » : Meta optimise la diffusion sur les achats.
 */
let currentPixelId: string | null = null

export function initMetaPixel(pixelId: string | null | undefined): void {
  if (!pixelId || !/^\d{10,20}$/.test(pixelId) || pixelId === currentPixelId) return
  currentPixelId = pixelId

  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args)
      else fbq.queue.push(args)
    } as FbqFn
    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = []
    window.fbq = fbq
    if (!window._fbq) window._fbq = fbq

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    script.onerror = () => {
      Sentry.captureMessage('fbevents.js n\'a pas pu se charger (bloqueur ou navigateur intégré ?)', {
        level: 'warning',
        tags: { source: 'analytics' },
        extra: { userAgent: navigator.userAgent, pixelId },
      })
    }
    document.head.appendChild(script)
  }

  window.fbq('init', pixelId)
}

function trackMeta(event: string, params?: Record<string, unknown>, eventId?: string): void {
  if (!currentPixelId || !window.fbq) return
  if (eventId) window.fbq('track', event, params ?? {}, { eventID: eventId })
  else if (params) window.fbq('track', event, params)
  else window.fbq('track', event)
}

/** Format des contenus attendu par Meta (catalogue / publicités dynamiques). */
function metaContents(items: GAItem[]) {
  return {
    content_ids: items.map((i) => String(i.item_id)),
    content_type: 'product',
    contents: items.map((i) => ({ id: String(i.item_id), quantity: i.quantity ?? 1, item_price: i.price })),
    num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
  }
}

export function trackPageview(path: string, title?: string): void {
  trackMeta('PageView')
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
  trackMeta('ViewContent', {
    ...metaContents([item]), content_name: item.item_name, content_category: item.item_category ?? undefined,
    currency: CURRENCY, value: item.price,
  })
}

export function trackAddToCart(item: GAItem): void {
  const value = item.price * (item.quantity ?? 1)
  trackEvent('add_to_cart', { currency: CURRENCY, value, items: [item] })
  trackMeta('AddToCart', { ...metaContents([item]), content_name: item.item_name, currency: CURRENCY, value })
}

export function trackRemoveFromCart(item: GAItem): void {
  trackEvent('remove_from_cart', { currency: CURRENCY, value: item.price * (item.quantity ?? 1), items: [item] })
}

export function trackBeginCheckout(items: GAItem[], value: number): void {
  trackEvent('begin_checkout', { currency: CURRENCY, value, items })
  trackMeta('InitiateCheckout', { ...metaContents(items), currency: CURRENCY, value })
}

export function trackPurchase(orderId: string, value: number, shipping: number, items: GAItem[]): void {
  trackEvent('purchase', { transaction_id: orderId, currency: CURRENCY, value, shipping, items })
  // eventID = numéro de commande : permettra à Meta de dédoublonner si l'achat est un jour
  // aussi envoyé côté serveur (API Conversions).
  trackMeta('Purchase', { ...metaContents(items), currency: CURRENCY, value }, `purchase_${orderId}`)
}
