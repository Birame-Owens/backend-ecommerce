import clientApi from '@/lib/clientAxios'

/**
 * Journalisation d'événements comportementaux vers notre propre backend, pour
 * les statistiques internes, la recommandation et la détection d'anomalies.
 *
 * Contrairement à Google Analytics (bloqué par les bloqueurs de pub, les
 * navigateurs intégrés Instagram/WhatsApp, le Consent Mode…), cet appel part
 * vers notre API : rien ne le bloque.
 *
 * Performance : les événements sont mis en FILE et envoyés PAR PAQUETS (une
 * requête toutes les quelques secondes au lieu d'une par événement). Quand la
 * page passe en arrière-plan ou se ferme, le reste part via sendBeacon, qui ne
 * bloque jamais la navigation. Best-effort : jamais d'attente, jamais d'erreur
 * remontée — le parcours d'achat ne doit jamais être perturbé.
 */
export type EventType =
  | 'debut_session'
  | 'vue_produit'
  | 'vue_categorie'
  | 'ajout_panier'
  | 'retrait_panier'
  | 'modification_quantite'
  | 'vidage_panier'
  | 'vue_panier'
  | 'ajout_wishlist'
  | 'retrait_wishlist'
  | 'debut_checkout'
  | 'changement_variante'
  | 'partage_produit'
  | 'clic_whatsapp'
  | 'recherche'
  | 'filtre_catalogue'
  | 'temps_vue_produit'
  | 'reco_affichee'
  | 'clic_reco'

export interface EventPayload {
  produit_id?: number | null
  categorie_id?: number | null
  terme_recherche?: string | null
  metadata?: Record<string, unknown>
}

interface QueuedEvent extends EventPayload {
  type: EventType
}

export const FLUSH_DELAY_MS = 4000
export const MAX_BATCH = 20
const BATCH_URL = '/api/client/evenements/batch'

let queue: QueuedEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null
const exitHooks = new Set<() => void>()

export function logEvent(type: EventType, payload: EventPayload = {}): void {
  queue.push({ type, ...payload })
  if (queue.length >= MAX_BATCH) {
    flushEvents()
  } else if (!timer) {
    timer = setTimeout(() => flushEvents(), FLUSH_DELAY_MS)
  }
}

/** Envoie la file. `exit` : la page se cache ou se ferme → sendBeacon (non bloquant). */
export function flushEvents(exit = false): void {
  if (timer) { clearTimeout(timer); timer = null }
  if (queue.length === 0) return
  const events = queue.slice(0, 50)
  queue = queue.slice(50)

  if (exit && sendWithBeacon(events)) {
    if (queue.length) flushEvents(true)
    return
  }

  clientApi.post(BATCH_URL, { events }).catch(() => { /* best-effort : jamais bloquant */ })
  if (queue.length) flushEvents(exit)
}

function sendWithBeacon(events: QueuedEvent[]): boolean {
  try {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return false
    const base = import.meta.env.VITE_API_URL || ''
    // text/plain = requête « simple » : pas de requête CORS préalable, envoi garanti à la fermeture.
    const blob = new Blob([JSON.stringify({ events })], { type: 'text/plain;charset=UTF-8' })
    return navigator.sendBeacon(`${base}${BATCH_URL}`, blob)
  } catch {
    return false
  }
}

/**
 * Code à exécuter juste AVANT l'envoi final quand la page se cache ou se ferme
 * (ex. : envoyer le temps passé sur une fiche). Renvoie la fonction de retrait.
 */
export function onPageExit(hook: () => void): () => void {
  exitHooks.add(hook)
  return () => { exitHooks.delete(hook) }
}

function handleExit() {
  exitHooks.forEach((hook) => { try { hook() } catch { /* jamais bloquant */ } })
  flushEvents(true)
}

/* ── Événements globaux ─────────────────────────────────────────────── */

const SESSION_KEY = 'ndeya-session-debut'

/** L'administration n'est pas du trafic client : rien n'y est journalisé. */
function isAdminPage(): boolean {
  return typeof location !== 'undefined' && location.pathname.startsWith('/admin')
}

/** Début de visite : provenance (campagne Meta, Google, lien direct…) et page d'arrivée. */
export function logSessionStart(): void {
  if (isAdminPage()) return
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch { /* stockage indisponible : on journalise quand même */ }

  const params = new URLSearchParams(location.search)
  let referrer: string | null = null
  try { referrer = document.referrer ? new URL(document.referrer).hostname : null } catch { /* ignoré */ }

  logEvent('debut_session', {
    metadata: {
      page_arrivee: location.pathname,
      referent: referrer,
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      pub_meta: params.has('fbclid'),
      pub_google: params.has('gclid'),
      ecran: `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`,
      langue: navigator.language,
    },
  })
}

/** Clics vers WhatsApp, où qu'ils soient sur le site (un seul écouteur global). */
function trackWhatsappClicks(e: MouseEvent) {
  if (isAdminPage()) return
  const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
  if (!link) return
  // Un partage de produit vers WhatsApp est journalisé comme « partage_produit », pas comme un contact.
  if (link.closest('[data-partage]')) return
  if (!/(^|\/\/)(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/.test(link.href)) return
  logEvent('clic_whatsapp', { metadata: { page: location.pathname } })
}

let started = false

/** À appeler une fois au démarrage de l'application. */
export function startEventTracking(): void {
  if (started || typeof window === 'undefined') return
  started = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') handleExit()
  })
  window.addEventListener('pagehide', handleExit)
  document.addEventListener('click', trackWhatsappClicks, true)
  logSessionStart()
}

/** Réservé aux tests. */
export function __resetEventsForTests(): void {
  queue = []
  if (timer) { clearTimeout(timer); timer = null }
  exitHooks.clear()
}
