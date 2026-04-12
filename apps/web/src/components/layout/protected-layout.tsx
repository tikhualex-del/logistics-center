'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { ROUTES } from '@/constants/routes'
import { PageLoader } from '@/components/ui/loader'

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(ROUTES.LOGIN)
    }
  }, [isLoading, user, router])

  if (isLoading) return <PageLoader />
  if (!user) return null

  return <>{children}</>
}
