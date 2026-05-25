import { Construction } from 'lucide-react'

interface Props {
  title: string
}

export function ComingSoonPage({ title }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-4">
        <Construction className="w-6 h-6 text-stone-400" strokeWidth={1.5} />
      </div>
      <h1 className="text-base font-semibold text-stone-900 mb-1">{title}</h1>
      <p className="text-sm text-stone-400">Cette section est en cours de développement.</p>
    </div>
  )
}
