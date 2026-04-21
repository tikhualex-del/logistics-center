'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { tokenStorage, type StoredUser } from './token-storage'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: StoredUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login(token: string, user: StoredUser): void
  logout(): void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    const token = tokenStorage.getToken()
    const user  = tokenStorage.getUser()
    setState({
      token,
      user,
      isLoading: false,
      isAuthenticated: !!(token && user),
    })
  }, [])

  const login = useCallback((token: string, user: StoredUser) => {
    tokenStorage.setToken(token)
    tokenStorage.setUser(user)
    tokenStorage.setCompanyId(user.companyId)
    setState({ token, user, isLoading: false, isAuthenticated: true })
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setState({ token: null, user: null, isLoading: false, isAuthenticated: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
