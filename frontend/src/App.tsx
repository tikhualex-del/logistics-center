import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/api'
import { AppRouter } from '@/pages'

/**
 * Root application component.
 *
 * Provider hierarchy:
 * 1. QueryClientProvider — TanStack Query (server state)
 * 2. BrowserRouter — React Router v6
 *
 * Auth state (Zustand) does not need a provider — it uses the global store directly.
 */
export function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  )
}
