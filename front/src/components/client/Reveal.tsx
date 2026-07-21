import { useEffect, useRef, useState, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Délai en secondes, pour un effet de cascade entre plusieurs éléments */
  delay?: number
}

/**
 * Fait apparaître son contenu (fondu + léger glissement) quand il entre dans
 * le viewport au scroll. Basé sur IntersectionObserver + CSS — aucune
 * dépendance d'animation lourde (framer-motion retiré pour la performance :
 * il chargeait ~42 Ko sur toutes les pages). Se déclenche une seule fois.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Pas de support (ou reduced-motion) : on affiche directement.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { rootMargin: '0px 0px -80px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${className ?? ''} reveal ${visible ? 'reveal-in' : ''}`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  )
}
