import axios from 'axios'

const clientApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
})

const SESSION_COOKIE = 'ndeya_sid'

/**
 * Identifiant de visiteur pour les statistiques internes, stocké dans un
 * COOKIE (pas un en-tête HTTP). Crucial pour la performance : un en-tête
 * personnalisé force le navigateur à faire une requête CORS preflight
 * (OPTIONS) AVANT chaque appel API, ce qui double les allers-retours réseau
 * et ralentit fortement le chargement, surtout sur mobile. Un cookie est
 * envoyé automatiquement (withCredentials) sans en-tête custom → aucun
 * preflight. Le back le lit côté serveur (voir EvenementService).
 */
function ensureSessionCookie(): void {
  const has = document.cookie.split('; ').some((c) => c.startsWith(SESSION_COOKIE + '='))
  if (has) return

  const id = crypto.randomUUID?.() ?? (String(Date.now()) + Math.random().toString(16).slice(2))
  const host = location.hostname
  const isIpOrLocal = host === 'localhost' || /^[0-9.]+$/.test(host)
  const parts = host.split('.')
  // domaine parent (.mondomaine.tld) pour que le cookie atteigne aussi le
  // sous-domaine api. Générique (pas de domaine en dur) — le site est vendu
  // en marque blanche sur d'autres domaines.
  const domainAttr = !isIpOrLocal && parts.length >= 2 ? `; domain=.${parts.slice(-2).join('.')}` : ''
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${SESSION_COOKIE}=${id}; path=/; max-age=31536000; SameSite=Lax${domainAttr}${secure}`
}

ensureSessionCookie()

clientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('client_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Convertit les URLs absolues du backend en chemins relatifs
// pour que le proxy Vite les serve quel que soit l'appareil (mobile, etc.)
clientApi.interceptors.response.use((response) => {
  try {
    const raw = JSON.stringify(response.data)
    const cleaned = raw.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, '')
    response.data = JSON.parse(cleaned)
  } catch { /* ne pas bloquer si JSON non sérialisable */ }
  return response
})

export default clientApi
