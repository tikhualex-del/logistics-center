import { useAuthStore, useUiStore } from '@/store'
import { usePermissions } from '@/hooks'
import {
  ORDER_STATUS_OPTIONS,
  ORDER_TIME_SLOT_OPTIONS,
  type OrderTimeSlotFilter,
} from '@/lib/order-utils'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/api'

/** Format an ISO date string (YYYY-MM-DD) to a readable label. */
function formatDateLabel(isoDate: string): string {
  const now = new Date()
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  if (isoDate === today) return 'Today'

  const date = new Date(isoDate + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Bell / alerts icon */
function IconBell(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

/** Calendar icon for date picker trigger */
function IconCalendar(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

/** Search magnifier icon */
function IconSearch(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

/** Logout icon */
function IconLogout(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

/** User avatar — shows initials */
function UserAvatar({ firstName, lastName }: { firstName: string; lastName: string }): React.ReactElement {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return (
    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
      <span className="text-primary-foreground text-xs font-semibold">{initials}</span>
    </div>
  )
}

/** Role badge label */
function RoleBadge({ role }: { role: string }): React.ReactElement {
  const labels: Record<string, string> = {
    admin: 'Admin',
    dispatcher: 'Dispatcher',
    courier: 'Courier',
  }
  const colors: Record<string, string> = {
    admin: 'bg-blue-100 text-blue-800',
    dispatcher: 'bg-green-100 text-green-800',
    courier: 'bg-amber-100 text-amber-800',
  }
  return (
    <span
      className={cn(
        'px-1.5 py-0.5 text-[10px] rounded font-medium leading-none',
        colors[role] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {labels[role] ?? role}
    </span>
  )
}

/**
 * Top bar component — appears above all page content in protected routes.
 *
 * Layout (left → right):
 *   [Date picker] [Search bar]  ...space...  [Layer toggles] [Alerts] [User info]
 *
 * Fixed height h-14 (56px) per CLAUDE.md §21 — must not steal vertical space from map.
 *
 * State:
 * - `selectedDate`, `searchQuery` in Zustand UI store (shared across map/list)
 * - `alertCount` in Zustand UI store (updated by WS listener in Phase 7)
 * - Layer toggles in Zustand UI store
 * - User info from auth store
 */
export function TopBar(): React.ReactElement {
  const {
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    timeSlotFilter,
    setTimeSlotFilter,
    alertCount,
    setAlertCount,
    showRoutes,
    showCouriers,
    toggleRoutesLayer,
    toggleCouriersLayer,
  } = useUiStore()

  const { user, clearAuth } = useAuthStore()
  const { can } = usePermissions()

  return (
    <header
      className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0 bg-card"
      role="banner"
    >
      {/* Date picker */}
      <div className="relative flex items-center">
        <label htmlFor="top-bar-date" className="sr-only">
          Select date
        </label>
        {/* Visible styled trigger — overlaid on the native date input */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input text-sm text-foreground cursor-pointer hover:bg-accent select-none"
          aria-hidden="true"
        >
          <IconCalendar />
          <span className="min-w-[3.5rem]">{formatDateLabel(selectedDate)}</span>
        </div>
        {/* Native date input — absolutely positioned over the styled div */}
        <input
          id="top-bar-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
          aria-label="Select date"
        />
      </div>

      {/* Search bar */}
      <div className="relative flex items-center flex-1 max-w-sm">
        <span className="absolute left-2.5 text-muted-foreground pointer-events-none">
          <IconSearch />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search orders, couriers..."
          className="w-full h-8 pl-8 pr-3 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Search orders and couriers"
        />
      </div>

      {/* Dispatcher filters */}
      <label htmlFor="top-bar-status-filter" className="sr-only">
        Filter orders by status
      </label>
      <select
        id="top-bar-status-filter"
        value={statusFilter ?? ''}
        onChange={(e) =>
          setStatusFilter(e.target.value === '' ? null : (e.target.value as OrderStatus))
        }
        className="h-8 w-32 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Filter orders by status"
      >
        <option value="">All statuses</option>
        {ORDER_STATUS_OPTIONS.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      <label htmlFor="top-bar-time-slot-filter" className="sr-only">
        Filter orders by time slot
      </label>
      <select
        id="top-bar-time-slot-filter"
        value={timeSlotFilter ?? ''}
        onChange={(e) =>
          setTimeSlotFilter(
            e.target.value === '' ? null : (e.target.value as OrderTimeSlotFilter),
          )
        }
        className="h-8 w-28 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Filter orders by time slot"
      >
        <option value="">All slots</option>
        {ORDER_TIME_SLOT_OPTIONS.map((slot) => (
          <option key={slot.value} value={slot.value}>
            {slot.label}
          </option>
        ))}
      </select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Layer toggles — only for users who can build/view routes */}
      {can('build:routes') && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleRoutesLayer}
            className={cn(
              'px-3 py-1 text-xs rounded-full border transition-colors',
              showRoutes
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background text-muted-foreground hover:bg-accent',
            )}
            aria-pressed={showRoutes}
            aria-label="Toggle routes layer"
          >
            Routes
          </button>
          <button
            onClick={toggleCouriersLayer}
            className={cn(
              'px-3 py-1 text-xs rounded-full border transition-colors',
              showCouriers
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background text-muted-foreground hover:bg-accent',
            )}
            aria-pressed={showCouriers}
            aria-label="Toggle couriers layer"
          >
            Couriers
          </button>
        </div>
      )}

      {/* Alerts badge */}
      <button
        onClick={() => setAlertCount(0)}
        className="relative p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label={`Alerts${alertCount > 0 ? `, ${alertCount} unread` : ''}`}
        title={alertCount > 0 ? 'Mark alerts as read' : 'No unread alerts'}
      >
        <IconBell />
        {alertCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full flex items-center justify-center px-0.5"
            aria-hidden="true"
          >
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        )}
      </button>

      {/* User info + logout */}
      {user && (
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <UserAvatar firstName={user.firstName} lastName={user.lastName} />
          <div className="flex flex-col items-start leading-none gap-1">
            <span className="text-xs font-medium text-foreground leading-none">
              {user.firstName} {user.lastName}
            </span>
            <RoleBadge role={user.role} />
          </div>
          <button
            onClick={clearAuth}
            className="ml-1 p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Log out"
            title="Log out"
          >
            <IconLogout />
          </button>
        </div>
      )}
    </header>
  )
}
