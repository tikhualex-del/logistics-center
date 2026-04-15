import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/api'
import { RouteGuard } from '@/components/route-guard'
import { ROUTES } from '@/lib/constants'

// Lazy-load pages for code splitting
const LoginPage = lazy(() => import('@/pages/login'))
const DispatcherPage = lazy(() => import('@/pages/dispatcher'))
const NotFoundPage = lazy(() => import('@/pages/not-found'))

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
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />

            {/* Protected: dispatcher workspace (admin + dispatcher roles) */}
            <Route
              path={ROUTES.DISPATCHER}
              element={
                <RouteGuard roles={['admin', 'dispatcher']}>
                  <DispatcherPage />
                </RouteGuard>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to={ROUTES.DISPATCHER} replace />} />

            {/* 404 */}
            <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function PageLoader(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Loading...</div>
    </div>
  )
}
