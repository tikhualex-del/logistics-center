'use client'

import { useState } from 'react'
import { NavDrawer } from './nav-drawer'
import { useAuth } from '@/lib/auth/auth-context'

function BurgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      aria-label="Открыть меню"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )
}

function AppTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <BurgerButton onClick={onMenuClick} />
        <span className="text-sm font-semibold text-gray-700">Logistics Center</span>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <span className="text-sm text-gray-500 hidden sm:block">
            {user.fullName}
          </span>
        ) : null}
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Выход
        </button>
      </div>
    </header>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <AppTopbar onMenuClick={() => setDrawerOpen(true)} />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
    </div>
  )
}
