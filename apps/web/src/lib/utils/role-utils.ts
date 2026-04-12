import { ROLE_HIERARCHY, ROLES, type Role } from '@/constants/roles'

export function hasRole(userRole: string | undefined, requiredRole: Role): boolean {
  if (!userRole) return false
  const userIdx     = ROLE_HIERARCHY.indexOf(userRole as Role)
  const requiredIdx = ROLE_HIERARCHY.indexOf(requiredRole)
  return userIdx !== -1 && userIdx >= requiredIdx
}

export function canWrite(userRole: string | undefined): boolean {
  return hasRole(userRole, ROLES.DISPATCHER)
}

export function isOwnerOrAbove(userRole: string | undefined): boolean {
  return hasRole(userRole, ROLES.OWNER)
}

export function isSuperAdmin(userRole: string | undefined): boolean {
  return hasRole(userRole, ROLES.SUPER_ADMIN)
}
