import { useToastStore } from '@/store/toastStore'
import { NIcon } from './NIcon'

export function NToast() {
  const { toasts } = useToastStore()
  if (!toasts.length) return null

  return (
    <div className="fixed left-0 right-0 z-[80] flex flex-col items-center gap-2 pointer-events-none px-4"
      style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 8px)' }}>
      {toasts.map((t) => (
        <div key={t.id}
          className="bg-ink text-white px-5 py-3 rounded-full flex items-center gap-2.5 text-sm shadow-card animate-toastin">
          {t.icon && <NIcon name={t.icon} size={17} />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
