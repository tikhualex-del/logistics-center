import type { StoredUser } from '@/lib/auth/token-storage'

export interface LoginInput {
  email: string
  password: string
  companySlug: string
}

export interface PlatformLoginInput {
  email: string
  password: string
}

export type AuthUser = StoredUser

export interface LoginResponse {
  token: string
  user: AuthUser
}
