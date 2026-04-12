'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:            30 * 1000,   // 30s — avoid waterfall refetches
        retry:                1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

// Browser singleton — avoids recreating the client on every render
let browserQueryClient: QueryClient | undefined

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always new instance (no shared state between requests)
    return makeQueryClient()
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export { getQueryClient }
