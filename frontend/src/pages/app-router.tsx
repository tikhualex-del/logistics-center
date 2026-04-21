import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout, PageLoader, ProtectedRoute, PublicRoute } from '@/components'
import { ROUTES } from '@/lib'

const LoginPage = lazy(() => import('@/features/auth/login-screen'))
const RegisterPage = lazy(() => import('@/features/auth/register-screen'))
const DispatcherPage = lazy(() => import('./dispatcher'))
const CouriersPage = lazy(() => import('./couriers'))
const PaymentsPage = lazy(() => import('./payments'))
const SettingsPage = lazy(() => import('./settings'))
const NotFoundPage = lazy(() => import('./not-found'))

/**
 * Application router.
 *
 * Route protection strategy (CLAUDE.md §8):
 * - PublicRoute — wraps /login and /register: authenticated users are redirected to /dispatcher
 * - ProtectedRoute — wraps private pages: unauthenticated users are redirected to /login;
 *   role check redirects to /dispatcher instead of showing a generic 403
 *
 * Layout strategy:
 * - All protected pages are wrapped in AppLayout (sidebar + top-level chrome)
 * - Public pages (login, register) render without layout chrome
 */
export function AppRouter(): React.ReactElement {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes — no layout chrome */}
          <Route
            path={ROUTES.LOGIN}
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.REGISTER}
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected routes — wrapped in AppLayout (sidebar + chrome) */}
          <Route
            path={ROUTES.DISPATCHER}
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
                <AppLayout>
                  <DispatcherPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.COURIERS}
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
                <AppLayout>
                  <CouriersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PAYMENTS}
            element={
              <ProtectedRoute allowedRoles={['admin', 'courier']}>
                <AppLayout>
                  <PaymentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.SETTINGS}
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to={ROUTES.DISPATCHER} replace />} />
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
