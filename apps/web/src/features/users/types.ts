export type UserRole = 'owner' | 'dispatcher' | 'viewer'
export type UserStatus = 'active' | 'invited' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface InviteUserInput {
  name: string
  email: string
  role: UserRole
  password: string
}

export interface UpdateUserRoleInput {
  role: UserRole
}
