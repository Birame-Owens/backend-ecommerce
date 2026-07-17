import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

interface RevealProps {
  children: ReactNode
  className?: string
  /** Délai en secondes, utile pour faire apparaître plusieurs éléments en cascade */
  delay?: number
}

/**
 * Fait apparaître son contenu (fondu + léger glissement) quand il entre dans
 * le viewport au scroll. `once: true` : ne se déclenche qu'une fois, pas à
 * chaque scroll dans les deux sens.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      variants={variants}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
