import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-2xl">!</div>
          <h2 className="font-serif font-bold text-[22px] text-ink">Quelque chose s'est mal passé</h2>
          <p className="text-[13px] text-muted max-w-sm">{this.state.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload() }}
            className="mt-2 px-6 h-11 rounded-[10px] bg-accent text-white text-[13px] font-semibold hover:bg-accent-dark transition-colors"
          >
            Recharger la page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
