import { useAuthStore } from '@/store'
import type { UserRole } from '@/store'

/**
 * Permission definitions (per CLAUDE.md Section 7 permission matrix).
 *
 * Format: `<action>:<resource>`
 * These must stay in sync with backend permission matrix.
 */
export type Permission =
  | 'view:orders'
  | 'create:orders'
  | 'edit:orders'
  | 'build:routes'
  | 'edit:routes'
  | 'edit:zones'
  | 'edit:payment-rules'
  | 'approve:motivation-rules'
  | 'view:financial-analytics'
  | 'view:operational-analytics'
  | 'view:own-earnings'
  | 'manage:couriers'
  | 'manage:shifts'
  | 'connect:integrations'
  | 'manage:users'

/**
 * Role-to-permission mapping (mirrors CLAUDE.md Section 7 table).
 * Frontend permission checks are UX-only — backend Guards are authoritative.
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view:orders',
    'create:orders',
    'edit:orders',
    'build:routes',
    'edit:routes',
    'edit:zones',
    'edit:payment-rules',
    'approve:motivation-rules',
    'view:financial-analytics',
    'view:operational-analytics',
    'view:own-earnings',
    'manage:couriers',
    'manage:shifts',
    'connect:integrations',
    'manage:users',
  ],
  dispatcher: [
    'view:orders',
    'create:orders',
    'edit:orders',
    'build:routes',
    'edit:routes',
    'view:operational-analytics',
    'manage:couriers',
    'manage:shifts',
  ],
  courier: ['view:orders', 'view:own-earnings'],
}

interface UsePermissionsReturn {
  /** Check if the current user has a given permission */
  can: (permission: Permission) => boolean
  /** Current user role (or null if not authenticated) */
  role: UserRole | null
}

/**
 * Permission check hook.
 *
 * Per CLAUDE.md Section 8: navigation items not accessible to the current
 * role must not be rendered (not just disabled).
 *
 * @example
 * const { can } = usePermissions()
 * {can('view:financial-analytics') && <NavItem href="/analytics/finance" />}
 */
export function usePermissions(): UsePermissionsReturn {
  const user = useAuthStore((state) => state.user)

  const can = (permission: Permission): boolean => {
    if (!user) return false
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
  }

  return {
    can,
    role: user?.role ?? null,
  }
}
