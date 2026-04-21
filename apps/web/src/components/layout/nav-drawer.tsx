'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useAuth } from '@/lib/auth/auth-context'
import { ROUTES } from '@/constants/routes'

interface NavDrawerProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Карта', href: ROUTES.MAP },
  { label: 'Мониторинг', href: ROUTES.MONITORING },
  { label: 'Курьеры', href: ROUTES.COURIERS },
  { label: 'Аналитика', href: ROUTES.ANALYTICS },
  { label: 'Настройки', href: ROUTES.SETTINGS_COMPANY },
]

export function NavDrawer({ open, onClose }: NavDrawerProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-50 bg-black/40 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={clsx(
          'fixed left-3 top-20 bottom-120 z-50 flex w-64 flex-col rounded-2xl bg-white shadow-xl transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-[calc(-100%-0.75rem)]',
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
          <span className="text-base font-semibold text-gray-900">Logistics Center</span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Закрыть меню"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={clsx(
                      'flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 space-y-1">
          {user ? (
            <div className="px-3 py-2 text-xs text-gray-500 truncate">
              {user.fullName} &middot; <span className="capitalize">{user.role}</span>
            </div>
          ) : null}
          <button
            onClick={() => { logout(); onClose() }}
            className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            Выход
          </button>
        </div>
      </div>
    </>
  )
}
