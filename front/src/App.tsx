import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { router } from '@/routes'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useToastStore } from '@/store/toastStore'

function getHttpStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.suppressGlobalError) return
      const status = getHttpStatus(error)
      // Afficher uniquement pour les erreurs serveur (5xx) ou absence de réseau
      if (!status || status >= 500) {
        useToastStore.getState().show('Erreur réseau — réessayez dans un instant', 'x')
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.suppressGlobalError) return
      const status = getHttpStatus(error)
      if (!status || status >= 500) {
        useToastStore.getState().show('Une erreur est survenue — réessayez', 'x')
      }
    },
  }),
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
})

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
