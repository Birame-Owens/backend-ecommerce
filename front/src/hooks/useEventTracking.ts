import { useEffect, useRef } from 'react'
import { logEvent, onPageExit } from '@/lib/events'

/** Au-delà, on considère que l'onglet a été oublié ouvert (valeur plafonnée). */
const DUREE_MAX_MS = 30 * 60 * 1000

/**
 * Temps RÉELLEMENT passé sur une fiche produit (onglet visible uniquement)
 * et profondeur de défilement maximale (%).
 *
 * Envoyé quand on quitte la fiche, et aussi quand l'onglet passe en
 * arrière-plan (sur mobile, une page cachée est souvent tuée sans prévenir) :
 * une visite peut donc produire plusieurs morceaux, à additionner à l'analyse.
 */
export function useDwellTime(produitId: number | null | undefined): void {
  useEffect(() => {
    if (!produitId) return

    let visibleDepuis: number | null = document.visibilityState === 'visible' ? performance.now() : null
    let cumul = 0
    let defilementMax = 0

    const mesurerDefilement = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const pct = max > 0 ? Math.round((doc.scrollTop / max) * 100) : 100
      if (pct > defilementMax) defilementMax = Math.min(100, pct)
    }

    const envoyer = () => {
      if (visibleDepuis !== null) {
        cumul += performance.now() - visibleDepuis
        visibleDepuis = null
      }
      if (cumul <= 0) return
      logEvent('temps_vue_produit', {
        produit_id: produitId,
        metadata: { duree_ms: Math.round(Math.min(cumul, DUREE_MAX_MS)), defilement_max: defilementMax },
      })
      cumul = 0
    }

    const auRetour = () => {
      if (document.visibilityState === 'visible' && visibleDepuis === null) visibleDepuis = performance.now()
    }

    mesurerDefilement()
    window.addEventListener('scroll', mesurerDefilement, { passive: true })
    document.addEventListener('visibilitychange', auRetour)
    const retirer = onPageExit(envoyer)

    return () => {
      envoyer()
      retirer()
      window.removeEventListener('scroll', mesurerDefilement)
      document.removeEventListener('visibilitychange', auRetour)
    }
  }, [produitId])
}

/**
 * Recommandations : « affichée » quand le bloc apparaît réellement à l'écran
 * (au moins 40 % visible, une fois), et « clic » avec la position cliquée.
 * `version` identifie l'algorithme qui a produit la liste (comparaison A/B,
 * détection d'une liste anormale).
 */
export function useRecoTracking(options: {
  source: string
  version: string
  produitOrigine: number | null | undefined
  produits: number[]
}) {
  const { source, version, produitOrigine, produits } = options
  const ref = useRef<HTMLElement | null>(null)
  const cle = produits.join(',')

  useEffect(() => {
    const el = ref.current
    if (!el || produits.length === 0) return
    let fait = false
    const journaliser = () => {
      if (fait) return
      fait = true
      logEvent('reco_affichee', {
        produit_id: produitOrigine ?? null,
        metadata: { source, version, produits },
      })
    }
    if (typeof IntersectionObserver === 'undefined') {
      journaliser()
      return
    }
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        journaliser()
        obs.disconnect()
      }
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, version, produitOrigine, cle])

  const onClick = (produitId: number, position: number) => {
    logEvent('clic_reco', {
      produit_id: produitId,
      metadata: { source, version, position, produit_origine: produitOrigine ?? null },
    })
  }

  return { ref, onClick }
}
