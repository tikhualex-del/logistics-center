import { QueryClient } from '@tanstack/react-query'
import { QUERY_STALE_TIME } from '@/lib/constants'

/**
 * Global TanStack Query client.
 * Configured with sensible defaults for a real-time logistics application.
 *
 * - Retries: 1 (network hiccup tolerance without flooding)
 * - StaleTime: 30s (default — balance between freshness and request volume)
 * - GcTime: 5min (keep cache alive for navigation speed)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME.DEFAULT,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
