import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { ROUTES } from '@/lib/constants'
import type { UserRole } from '@/store'

interface RouteGuardProps {
  children: React.ReactNode
  /** Required roles to access this route. If empty, any authenticated user is allowed. */
  roles?: UserRole[]
}

/**
 * Protects routes by authentication status and role.
 *
 * Per CLAUDE.md Section 8:
 * - Unauthorized access redirects to the appropriate fallback, not a generic 403.
 * - Frontend role checks are UX-only — backend Guards remain authoritative.
 */
export function RouteGuard({ children, roles = [] }: RouteGuardProps): React.ReactElement {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (roles.length > 0 && user && !roles.includes(user.role)) {
    // Redirect back to their default page instead of a generic 403
    return <Navigate to={ROUTES.DISPATCHER} replace />
  }

  return <>{children}</>
}
