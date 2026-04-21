import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { disconnectSocket } from '@/api/socket-client'

/**
 * User roles (per CLAUDE.md Section 7 permission matrix).
 */
export type UserRole = 'admin' | 'dispatcher' | 'courier'

/**
 * Authenticated user context extracted from JWT claims.
 * companyId is always present — required for multi-tenant isolation (CLAUDE.md Section 5).
 */
export interface AuthUser {
  id: string
  companyId: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean

  setAuth: (user: AuthUser, token: string) => void
  clearAuth: () => void
}

/**
 * Auth store — persists minimal auth state to localStorage.
 *
 * Note: only stores UI-visible auth data. The actual access token
 * is also kept in localStorage for the Axios interceptor.
 * The refresh token is stored in an httpOnly cookie (backend-managed).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user: AuthUser, token: string) => {
        localStorage.setItem('access_token', token)
        set({ user, accessToken: token, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('access_token')
        disconnectSocket()
        set({ user: null, accessToken: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      // Only persist non-sensitive fields
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
