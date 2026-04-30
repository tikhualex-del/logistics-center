import { useCallback, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  Bot,
  ClipboardList,
  Route as RouteIcon,
  ShieldCheck,
  Webhook,
} from 'lucide-react'
import { usePermissions } from '@/hooks'
import { useUiStore } from '@/store'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Permission } from '@/hooks'

interface NavItem {
  labelKey: string
  href: string
  requiredPermissions: Permission[]
  icon: React.ReactNode
}

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

function IconClose(): React.ReactElement {
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
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'nav.map',
    href: ROUTES.DISPATCHER,
    requiredPermissions: ['view:orders'],
    icon: <IconMap />,
  },
  {
    labelKey: 'nav.monitoring',
    href: ROUTES.MONITORING,
    requiredPermissions: ['view:operational-analytics', 'view:orders'],
    icon: <Activity aria-hidden="true" />,
  },
  {
    labelKey: 'nav.orders',
    href: ROUTES.ORDERS,
    requiredPermissions: ['view:orders'],
    icon: <ClipboardList aria-hidden="true" />,
  },
  {
    labelKey: 'nav.routes',
    href: ROUTES.ROUTES,
    requiredPermissions: ['build:routes', 'edit:routes'],
    icon: <RouteIcon aria-hidden="true" />,
  },
  {
    labelKey: 'nav.couriers',
    href: ROUTES.COURIERS,
    requiredPermissions: ['manage:couriers'],
    icon: <IconUsers />,
  },
  {
    labelKey: 'nav.integrations',
    href: ROUTES.INTEGRATIONS,
    requiredPermissions: ['connect:integrations'],
    icon: <Webhook aria-hidden="true" />,
  },
  {
    labelKey: 'nav.payments',
    href: ROUTES.PAYMENTS,
    requiredPermissions: ['edit:payment-rules', 'view:own-earnings'],
    icon: <IconWallet />,
  },
  {
    labelKey: 'nav.ai',
    href: ROUTES.AI_ASSISTANT,
    requiredPermissions: ['view:orders'],
    icon: <Bot aria-hidden="true" />,
  },
  {
    labelKey: 'nav.platform',
    href: ROUTES.PLATFORM,
    requiredPermissions: ['manage:users'],
    icon: <ShieldCheck aria-hidden="true" />,
  },
  {
    labelKey: 'nav.settings',
    href: ROUTES.SETTINGS,
    requiredPermissions: ['manage:users'],
    icon: <IconSettings />,
  },
]

export function Sidebar(): React.ReactElement {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const { sidebarOpen, closeSidebar } = useUiStore()
  const navRef = useRef<HTMLElement | null>(null)

  const handleCloseSidebar = useCallback((): void => {
    const activeElement = document.activeElement

    if (
      activeElement instanceof HTMLElement &&
      navRef.current?.contains(activeElement)
    ) {
      activeElement.blur()
    }

    closeSidebar()
  }, [closeSidebar])

  useEffect(() => {
    if (!sidebarOpen) return

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        handleCloseSidebar()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleCloseSidebar, sidebarOpen])

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.requiredPermissions.some((permission) => can(permission)),
  )

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/35 transition-opacity duration-200',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={handleCloseSidebar}
        aria-hidden="true"
      />

      <nav
        ref={navRef}
        className={cn(
          'fixed bottom-[22rem] left-1.5 top-[4.5rem] z-50 flex w-64 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border transition-transform duration-200 ease-out',
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-[calc(100%+0.375rem)] pointer-events-none',
        )}
        aria-label={t('nav.main')}
        aria-hidden={!sidebarOpen}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-3 shrink-0">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground text-xs font-bold">LC</span>
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
            {t('nav.brand')}
          </span>
          <button
            type="button"
            onClick={handleCloseSidebar}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label={t('common.close')}
            title={t('common.close')}
          >
            <IconClose />
          </button>
        </div>

        <ul className="flex-1 py-2 space-y-1 px-2 overflow-y-auto" role="list">
          {visibleItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                onClick={handleCloseSidebar}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground',
                  )
                }
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{t(item.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="p-2 border-t border-border shrink-0">
          <button
            type="button"
            onClick={handleCloseSidebar}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <IconClose />
            <span>{t('common.close')}</span>
          </button>
        </div>
      </nav>
    </>
  )
}
