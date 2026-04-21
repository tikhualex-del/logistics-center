export const ROLES = ['owner', 'dispatcher', 'viewer'] as const
export type Role = typeof ROLES[number]

export const PLATFORM_ROLES = ['platform_admin'] as const
export type PlatformRole = typeof PLATFORM_ROLES[number]

export function canManageOrders(role: string): boolean {
  return ['owner', 'dispatcher'].includes(role)
}

export function canManageUsers(role: string): boolean {
  return role === 'owner'
}

export function isPlatformAdmin(role: string): boolean {
  return role === 'platform_admin'
}
