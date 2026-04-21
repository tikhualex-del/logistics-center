import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { ROUTES } from '@/lib/constants'

interface PublicRouteProps {
  children: React.ReactNode
}

/**
 * Wraps public-only routes (/login, /register).
 *
 * Behaviour:
 * - Already authenticated user → redirect to /dispatcher
 * - Unauthenticated user → render children normally
 *
 * This ensures the auth flow is handled at the router level rather than
 * inside individual screen components, following a single-responsibility principle.
 */
export function PublicRoute({ children }: PublicRouteProps): React.ReactElement {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DISPATCHER} replace />
  }

  return <>{children}</>
}
