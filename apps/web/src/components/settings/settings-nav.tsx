'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { ROUTES } from '@/constants/routes'

const SETTINGS_LINKS = [
  { label: 'Company', href: ROUTES.SETTINGS_COMPANY },
  { label: 'Operations', href: ROUTES.SETTINGS_OPERATIONS },
  { label: 'SLA', href: ROUTES.SETTINGS_SLA },
  { label: 'Integrations', href: ROUTES.SETTINGS_INTEGRATIONS },
  { label: 'Access', href: ROUTES.SETTINGS_ACCESS },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav>
      <ul className="space-y-1">
        {SETTINGS_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={clsx(
                'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
