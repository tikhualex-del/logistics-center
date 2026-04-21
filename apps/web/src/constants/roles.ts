export const ROLES = {
  VIEWER: 'viewer',
  DISPATCHER: 'dispatcher',
  OWNER: 'owner',
  SUPER_ADMIN: 'super_admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  viewer: 'Viewer',
  dispatcher: 'Dispatcher',
  owner: 'Owner',
  super_admin: 'Super Admin',
}

// Hierarchy — lowest to highest
export const ROLE_HIERARCHY: Role[] = [
  ROLES.VIEWER,
  ROLES.DISPATCHER,
  ROLES.OWNER,
  ROLES.SUPER_ADMIN,
]
