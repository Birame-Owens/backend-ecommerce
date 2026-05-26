import { Construction } from 'lucide-react'

interface Props {
  title: string
}

export function ComingSoonPage({ title }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-14 h-14 bg-beige-200 rounded-2xl flex items-center justify-center mb-4">
        <Construction className="w-6 h-6 text-beige-500" strokeWidth={1.5} />
      </div>
      <h1 className="text-base font-serif font-semibold text-ink mb-1.5">{title}</h1>
      <p className="text-sm text-muted">Cette section est en cours de développement.</p>
    </div>
  )
}
