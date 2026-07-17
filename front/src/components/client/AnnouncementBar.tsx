import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { homeClientApi } from '@/api/client/home'
import { NIcon } from '@/components/client/NIcon'
import { useToastStore } from '@/store/toastStore'

const DISMISSED_KEY = 'ndeya-dismissed-promo-id'

function fmtValue(type: string, valeur: number, formatted?: string) {
  if (formatted) return formatted
  if (type === 'pourcentage') return `-${valeur}%`
  if (type === 'livraison_gratuite') return 'Livraison offerte'
  return `-${valeur.toLocaleString('fr-FR')} F`
}

export function AnnouncementBar() {
  const navigate = useNavigate()
  const toast = useToastStore((s) => s.show)
  const [dismissedId, setDismissedId] = useState<number | null>(() => {
    const stored = localStorage.getItem(DISMISSED_KEY)
    return stored ? Number(stored) : null
  })

  const { data } = useQuery({
    queryKey: ['client-active-promotions'],
    queryFn: () => homeClientApi.activePromotions().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const promo = data?.promotions?.[0]

  if (!promo || promo.id === dismissedId) {
    return null
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(promo!.id))
    setDismissedId(promo!.id)
  }

  function copyCode(e: React.MouseEvent) {
    e.stopPropagation()
    if (!promo!.code) return
    navigator.clipboard.writeText(promo!.code).then(() => toast('Code copié !', 'check'))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate('/categories')}
      onKeyDown={(e) => e.key === 'Enter' && navigate('/categories')}
      className="relative bg-ink text-white cursor-pointer select-none"
    >
      <div className="max-w-7xl mx-auto pl-3 pr-9 sm:px-6 lg:px-8 h-11 flex items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] overflow-hidden">
        {/* Badge toujours visible, y compris sur mobile : doit se voir au premier coup d'œil. */}
        <span className="flex-shrink-0 inline-flex items-center gap-1 pl-1.5 pr-2.5 h-7 rounded-full
          bg-accent text-white font-bold uppercase tracking-wide text-[11px] shadow-sm">
          <NIcon name="spark" size={13} strokeWidth={2} />
          Promo {fmtValue(promo.type, promo.valeur, promo.valeur_formatted)}
        </span>
        <span className="hidden sm:inline text-white/85 truncate">
          {promo.description ?? promo.nom}
        </span>
        {promo.code && (
          <button
            onClick={copyCode}
            className="flex-shrink-0 inline-flex items-center gap-1 px-2 h-6 rounded-full border border-white/25
              text-[10px] font-mono font-semibold tracking-wide hover:bg-white/10 transition-colors"
          >
            {promo.code}
            <NIcon name="copy" size={11} strokeWidth={2} />
          </button>
        )}
        {promo.is_flash_sale && (
          <span className="hidden md:inline text-[10px] font-semibold uppercase tracking-widest text-camel/90 flex-shrink-0">
            Offre limitée
          </span>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); dismiss() }}
        aria-label="Fermer la bannière promo"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center
          rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <NIcon name="close" size={13} strokeWidth={2} />
      </button>
    </div>
  )
}
