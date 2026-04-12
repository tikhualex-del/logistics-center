import { ROLE_HIERARCHY, type Role } from '@/constants/roles'
import { tokenStorage } from './token-storage'

export function hasRole(userRole: string | undefined, requiredRole: Role): boolean {
  if (!userRole) return false
  const userIdx     = ROLE_HIERARCHY.indexOf(userRole as Role)
  const requiredIdx = ROLE_HIERARCHY.indexOf(requiredRole)
  return userIdx !== -1 && userIdx >= requiredIdx
}

export function isAuthenticated(): boolean {
  return !!(tokenStorage.getToken() && tokenStorage.getUser())
}
