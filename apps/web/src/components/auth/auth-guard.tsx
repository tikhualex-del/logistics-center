'use client'

import { useAuth } from '@/lib/auth/auth-context'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const { user, isLoading } = useAuth()

  if (isLoading || !user) return <>{fallback}</>

  return <>{children}</>
}
