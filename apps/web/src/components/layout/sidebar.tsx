'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/lib/auth/auth-context'

interface NavItem {
  label: string
  href: string
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Orders', href: ROUTES.ORDERS },
  { label: 'Couriers', href: ROUTES.COURIERS },
  { label: 'Routes', href: ROUTES.ROUTES_LIST },
  { label: 'Users', href: ROUTES.USERS },
  { label: 'Integrations', href: ROUTES.INTEGRATIONS },
  { label: 'AI Assistant', href: ROUTES.AI_ASSISTANT },
  { label: 'Settings', href: ROUTES.SETTINGS_COMPANY },
]

const PLATFORM_NAV_ITEMS: NavItem[] = [
  { label: 'Companies', href: ROUTES.COMPANIES },
  { label: 'Platform Admins', href: ROUTES.PLATFORM_ADMINS },
  { label: 'Impersonation', href: ROUTES.IMPERSONATION },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const isPlatformAdmin = user?.role === 'platform_admin'

  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <span className="text-base font-semibold text-gray-900">Logistics Center</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {(isPlatformAdmin ? PLATFORM_NAV_ITEMS : NAV_ITEMS).map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
