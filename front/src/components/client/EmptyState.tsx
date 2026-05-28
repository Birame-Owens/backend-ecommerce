import { Sparkles } from 'lucide-react'

export function EmptyState({ label, note }: { label: string; note?: string }) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 bg-beige-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-7 h-7 text-beige-400" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-ink mb-1">{label}</p>
      {note && <p className="text-xs text-muted">{note}</p>}
    </div>
  )
}
