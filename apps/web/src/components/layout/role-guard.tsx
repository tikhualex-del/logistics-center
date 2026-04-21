'use client'

import { useAuth } from '@/lib/auth/auth-context'

interface RoleGuardProps {
  roles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth()

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
