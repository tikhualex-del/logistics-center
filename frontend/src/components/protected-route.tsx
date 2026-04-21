import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { ROUTES } from '@/lib/constants'
import type { UserRole } from '@/store'

interface ProtectedRouteProps {
  children: React.ReactNode
  /**
   * Allowed roles for this route. If empty, any authenticated user is granted access.
   * Per CLAUDE.md §8: frontend role checks are UX-only — backend Guards are authoritative.
   */
  allowedRoles?: UserRole[]
}

/**
 * Wraps a route and enforces authentication + optional role check.
 *
 * Behaviour:
 * - Unauthenticated user → redirect to /login (per CLAUDE.md §8)
 * - Authenticated user without required role → redirect to /dispatcher (role fallback, not 403)
 * - Authenticated user with correct role → render children
 */
export function ProtectedRoute({
  children,
  allowedRoles = [],
}: ProtectedRouteProps): React.ReactElement {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    // Redirect to the default workspace instead of a generic 403.
    return <Navigate to={ROUTES.DISPATCHER} replace />
  }

  return <>{children}</>
}
