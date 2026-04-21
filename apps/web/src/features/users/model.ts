import type { UserRole } from './types'

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  dispatcher: 'Dispatcher',
  viewer: 'Viewer',
}

export function hasPermission(role: UserRole, action: 'manage_orders' | 'manage_users' | 'view_only'): boolean {
  const permissions: Record<UserRole, string[]> = {
    owner: ['manage_orders', 'manage_users', 'view_only'],
    dispatcher: ['manage_orders', 'view_only'],
    viewer: ['view_only'],
  }
  return permissions[role]?.includes(action) ?? false
}
