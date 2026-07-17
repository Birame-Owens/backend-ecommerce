import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './styles/global.css'
import { App } from './App'

// Monitoring des erreurs front (no-op si VITE_SENTRY_DSN absent)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    // 10% des transactions tracées (perf) — ajustable
    tracesSampleRate: 0.1,
  })
}

// Après un déploiement, un onglet resté ouvert référence encore les anciens
// fichiers JS (hashés par build) que le nouveau déploiement a remplacés — le
// chargement différé d'une page pas encore visitée échoue alors avec
// "Failed to fetch dynamically imported module". Vite émet cet évènement
// dédié dans ce cas précis : on recharge une seule fois (sessionStorage
// évite une boucle si le rechargement ne résout pas le problème).
window.addEventListener('vite:preloadError', () => {
  const key = 'ndeya-preload-error-reload'
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, '1')
    window.location.reload()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
