import { useEffect } from 'react'
import { NIcon } from './NIcon'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function NSheet({ open, onClose, title, children, footer }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 z-60 bg-black/50 backdrop-blur-sm transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-[61] bg-white rounded-t-[18px] flex flex-col
          max-h-[92dvh] shadow-[0_-20px_50px_-20px_rgba(0,0,0,.4)]
          transition-transform duration-[360ms] ease-[cubic-bezier(.22,.61,.36,1)]
          sm:left-auto sm:right-auto sm:top-1/2 sm:bottom-auto sm:w-[460px] sm:rounded-[14px] sm:max-h-[80dvh]
          ${open
            ? 'translate-y-0 sm:-translate-x-1/2 sm:-translate-y-1/2'
            : 'translate-y-full sm:translate-y-[-46%] sm:-translate-x-1/2 sm:opacity-0 sm:scale-[.97]'}`}
        style={open ? {} : { pointerEvents: 'none' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="w-10 h-1 rounded-full bg-line-2 mx-auto mt-2.5 mb-1 flex-shrink-0" />
        {title && (
          <div className="flex items-center justify-between px-5 pb-3.5 flex-shrink-0">
            <h2 className="font-serif text-[18px] font-semibold text-ink">{title}</h2>
            <button className="w-10 h-10 grid place-items-center rounded-full hover:bg-paper transition-colors" onClick={onClose}>
              <NIcon name="close" size={20} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 pb-6 flex-1">{children}</div>
        {footer && (
          <div className="flex-shrink-0 px-5 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-3.5 border-t border-line">
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
