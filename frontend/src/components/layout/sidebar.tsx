import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePermissions } from '@/hooks'
import { useUiStore } from '@/store'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Permission } from '@/hooks'

/**
 * A single navigation item definition.
 * `requiredPermissions`: user must have AT LEAST ONE of these to see the item.
 */
interface NavItem {
  labelKey: string
  href: string
  requiredPermissions: Permission[]
  icon: React.ReactNode
}

/** Map icon (SVG) */
function IconMap(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  )
}

/** Users / couriers icon */
function IconUsers(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

/** Wallet / payments icon */
function IconWallet(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M16 10h.01" />
      <path d="M2 10h20" />
    </svg>
  )
}

/** Settings / gear icon */
function IconSettings(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

/** Collapse/expand chevron icon */
function IconChevron({ collapsed }: { collapsed: boolean }): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('transition-transform duration-200', collapsed ? 'rotate-180' : '')}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

/**
 * Nav items definition.
 * Per CLAUDE.md §22: items not accessible to the current role are NOT rendered.
 * `requiredPermissions`: user needs at least one of these to see the item.
 */
const NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'nav.map',
    href: ROUTES.DISPATCHER,
    requiredPermissions: ['view:orders'],
    icon: <IconMap />,
  },
  {
    labelKey: 'nav.couriers',
    href: ROUTES.COURIERS,
    requiredPermissions: ['manage:couriers'],
    icon: <IconUsers />,
  },
  {
    labelKey: 'nav.payments',
    href: ROUTES.PAYMENTS,
    requiredPermissions: ['edit:payment-rules', 'view:own-earnings'],
    icon: <IconWallet />,
  },
  {
    labelKey: 'nav.settings',
    href: ROUTES.SETTINGS,
    requiredPermissions: ['manage:users'],
    icon: <IconSettings />,
  },
]

/**
 * Sidebar navigation component.
 *
 * Role-based visibility: nav items are conditionally rendered — NOT hidden via CSS.
 * Per CLAUDE.md §8 and §22: "render them conditionally based on permissions"
 *
 * Collapse state is managed via useUiStore (Zustand UI state — correct per §8).
 */
export function Sidebar(): React.ReactElement {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()

  // Filter nav items to only those the current user has permission to see.
  // At least one of requiredPermissions must be granted.
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.requiredPermissions.some((permission) => can(permission)),
  )

  return (
    <nav
      className={cn(
        'flex flex-col h-full bg-card border-r border-border transition-all duration-200 shrink-0',
        sidebarCollapsed ? 'w-14' : 'w-52',
      )}
      aria-label={t('nav.main')}
    >
      {/* Brand / logo area */}
      <div
        className={cn(
          'flex items-center h-14 border-b border-border px-3 shrink-0',
          sidebarCollapsed ? 'justify-center' : 'gap-2',
        )}
      >
        {/* Compact brand mark */}
        <div className="w-7 h-7 rounded bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-xs font-bold">LC</span>
        </div>
        {!sidebarCollapsed && (
          <span className="text-sm font-semibold truncate">{t('nav.brand')}</span>
        )}
      </div>

      {/* Navigation items — only visible items are rendered */}
      <ul className="flex-1 py-2 space-y-1 px-2 overflow-y-auto" role="list">
        {visibleItems.map((item) => (
          <li key={item.href}>
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground',
                  sidebarCollapsed && 'justify-center',
                )
              }
              title={sidebarCollapsed ? t(item.labelKey) : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="truncate">{t(item.labelKey)}</span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border shrink-0">
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-2 rounded-md text-xs text-muted-foreground',
            'hover:bg-accent hover:text-accent-foreground transition-colors',
            sidebarCollapsed && 'justify-center',
          )}
          aria-label={sidebarCollapsed ? t('nav.expand') : t('nav.collapse')}
        >
          <IconChevron collapsed={sidebarCollapsed} />
          {!sidebarCollapsed && <span>{t('nav.collapseShort')}</span>}
        </button>
      </div>
    </nav>
  )
}
