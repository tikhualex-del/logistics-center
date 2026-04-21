'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'

export function Topbar() {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center justify-end border-b border-gray-200 bg-white px-6 gap-4">
      {user ? (
        <span className="text-sm text-gray-600">
          {user.fullName} &middot; <span className="capitalize">{user.role}</span>
        </span>
      ) : null}
      <Button variant="ghost" size="sm" onClick={logout}>
        Sign out
      </Button>
    </header>
  )
}
