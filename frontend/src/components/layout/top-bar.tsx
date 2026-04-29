import { useTranslation } from 'react-i18next'
import { useAuthStore, useUiStore } from '@/store'
import { usePermissions } from '@/hooks'
import { useOrderStatusOptions } from '@/lib/order-utils'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/api'
import { useRef } from 'react'

const HALF_HOUR_TIME_OPTIONS = buildHalfHourTimeOptions()
const NATIVE_OPTION_CLASS = 'bg-white text-black'
const EMPTY_TIME_PLACEHOLDER = '00:00'

function buildHalfHourTimeOptions(): string[] {
  return Array.from({ length: 48 }, (_, index) => {
    const totalMinutes = index * 30
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
    const minutes = String(totalMinutes % 60).padStart(2, '0')

    return `${hours}:${minutes}`
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

/** Menu icon for sidebar drawer trigger */
function IconMenu(): React.ReactElement {
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
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
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

/** Clear filter icon */
function IconX(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
  const { t } = useTranslation()
  const colors: Record<string, string> = {
    admin: 'bg-blue-100 text-blue-800',
    dispatcher: 'bg-green-100 text-green-800',
    courier: 'bg-amber-100 text-amber-800',
  }
  const roleKey = `roles.${role}`
  const label = t(roleKey)
  return (
    <span
      className={cn(
        'px-1.5 py-0.5 text-[10px] rounded font-medium leading-none',
        colors[role] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {label === roleKey ? role : label}
    </span>
  )
}

interface TimeBoundSelectProps {
  id: string
  label: string
  value: string | null
  placeholder: string
  onChange: (value: string | null) => void
  onClear: () => void
  clearLabel: string
}

function TimeBoundSelect({
  id,
  label,
  value,
  placeholder,
  onChange,
  onClear,
  clearLabel,
}: TimeBoundSelectProps): React.ReactElement {
  const hasValue = value !== null

  return (
    <div
      className={cn(
        'flex h-9 items-center rounded-md bg-slate-900 p-0.5 shadow-sm ring-1 ring-slate-800',
        hasValue ? 'text-white' : 'text-slate-400',
      )}
    >
      <div
        className={cn(
          'relative grid h-8 w-[4.75rem] place-items-center overflow-hidden rounded-md transition-colors',
          hasValue ? 'bg-blue-600 shadow-sm' : 'bg-transparent hover:text-slate-100',
        )}
      >
        <span className="pointer-events-none text-sm font-semibold leading-none tabular-nums">
          {value ?? placeholder}
        </span>
        <select
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={label}
        >
          <option value="" className={NATIVE_OPTION_CLASS} disabled hidden />
          {HALF_HOUR_TIME_OPTIONS.map((time) => (
            <option key={`${id}-${time}`} value={time} className={NATIVE_OPTION_CLASS}>
              {time}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onClear}
        disabled={!hasValue}
        className="grid h-8 w-7 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-100 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-500"
        aria-label={clearLabel}
        title={clearLabel}
      >
        <IconX />
      </button>
    </div>
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
  const { t } = useTranslation()
  const {
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    startTimeFilter,
    setStartTimeFilter,
    endTimeFilter,
    setEndTimeFilter,
    alertCount,
    setAlertCount,
    showRoutes,
    showCouriers,
    toggleRoutesLayer,
    toggleCouriersLayer,
    openSidebar,
  } = useUiStore()

  const dateInputRef = useRef<HTMLInputElement | null>(null)

  const { user, clearAuth } = useAuthStore()
  const { can } = usePermissions()
  const statusOptions = useOrderStatusOptions()

  return (
    <div className="pointer-events-auto shrink-0 bg-transparent px-1.5 py-1">
      <header
        className="flex h-12 shrink-0 items-center gap-3 rounded-xl border border-violet-500/70 bg-slate-950 px-3 text-violet-100 shadow-lg shadow-violet-950/30 backdrop-blur"
        role="banner"
      >
      <button
        type="button"
        onClick={openSidebar}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-violet-100 transition-colors hover:bg-slate-900 hover:text-white"
        aria-label={t('nav.expand')}
        title={t('nav.expand')}
      >
        <IconMenu />
      </button>

      <div className="h-6 w-px shrink-0 bg-violet-500/40" aria-hidden="true" />

      {/* Date picker */}
      <div
        className="relative w-28 h-9 shrink-0 cursor-pointer"
        onClick={() => {
          dateInputRef.current?.showPicker?.()
          dateInputRef.current?.focus()
          dateInputRef.current?.click()
        }}
      >
        <label htmlFor="top-bar-date" className="sr-only">
          {t('topBar.selectDate')}
        </label>

        <input
          ref={dateInputRef}
          id="top-bar-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="absolute inset-0 z-50 opacity-0 cursor-pointer w-full h-full"
          aria-label={t('topBar.selectDate')}
        />

        <div
          className="flex items-center gap-2 px-3 h-9 rounded-md border border-transparent text-slate-200 hover:bg-slate-900 select-none"
          aria-hidden="true"
        >
          <IconCalendar />
          <span className="text-sm whitespace-nowrap">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Dispatcher filters */}
      <label htmlFor="top-bar-status-filter" className="sr-only">
        {t('topBar.allStatuses')}
      </label>
      <select
        id="top-bar-status-filter"
        value={statusFilter ?? ''}
        onChange={(e) =>
          setStatusFilter(e.target.value === '' ? null : (e.target.value as OrderStatus))
        }
        className="h-8 w-32 rounded-md border border-transparent bg-transparent px-2 text-xs text-slate-200 transition-colors hover:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-violet-500"
        aria-label={t('topBar.allStatuses')}
      >
        <option value="" className={NATIVE_OPTION_CLASS}>
          {t('topBar.allStatuses')}
        </option>
        {statusOptions.map((status) => (
          <option
            key={status.value}
            value={status.value}
            className={NATIVE_OPTION_CLASS}
          >
            {status.label}
          </option>
        ))}
      </select>

      <div
        className="flex items-center gap-2"
        role="group"
        aria-label={t('topBar.timeFilter')}
        title={t('topBar.timeFilter')}
      >
        <TimeBoundSelect
          id="top-bar-start-time-filter"
          label={t('topBar.timeFilterFrom')}
          value={startTimeFilter}
          placeholder={EMPTY_TIME_PLACEHOLDER}
          onChange={setStartTimeFilter}
          onClear={() => setStartTimeFilter(null)}
          clearLabel={t('topBar.clearTimeFilter')}
        />
        <TimeBoundSelect
          id="top-bar-end-time-filter"
          label={t('topBar.timeFilterTo')}
          value={endTimeFilter}
          placeholder={EMPTY_TIME_PLACEHOLDER}
          onChange={setEndTimeFilter}
          onClear={() => setEndTimeFilter(null)}
          clearLabel={t('topBar.clearTimeFilter')}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search bar */}
      <div className="relative flex w-72 max-w-sm shrink items-center lg:w-80">
        <span className="absolute left-2.5 text-slate-500 pointer-events-none">
          <IconSearch />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('topBar.searchPlaceholder')}
          className="w-full h-8 pl-8 pr-3 text-sm rounded-md border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          aria-label={t('topBar.searchPlaceholder')}
        />
      </div>

      {/* Layer toggles — only for users who can build/view routes */}
      {can('build:routes') && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleRoutesLayer}
            className={cn(
              'px-3 py-1 text-xs rounded-full border transition-colors',
              showRoutes
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white',
            )}
            aria-pressed={showRoutes}
            aria-label={t('topBar.routes')}
          >
            {t('topBar.routes')}
          </button>
          <button
            onClick={toggleCouriersLayer}
            className={cn(
              'px-3 py-1 text-xs rounded-full border transition-colors',
              showCouriers
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white',
            )}
            aria-pressed={showCouriers}
            aria-label={t('topBar.couriers')}
          >
            {t('topBar.couriers')}
          </button>
        </div>
      )}

      {/* Alerts badge */}
      <button
        onClick={() => setAlertCount(0)}
        className="relative p-1.5 rounded-md text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
        aria-label={alertCount > 0 ? `${t('alerts.title')}, ${alertCount}` : t('alerts.title')}
        title={alertCount > 0 ? t('topBar.markAlertsRead') : t('topBar.noAlerts')}
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
        <div className="flex items-center gap-2 pl-2 border-l border-violet-500/40">
          <UserAvatar firstName={user.firstName} lastName={user.lastName} />
          <div className="flex flex-col items-start leading-none gap-1">
            <span className="text-xs font-medium text-white leading-none">
              {user.firstName} {user.lastName}
            </span>
            <RoleBadge role={user.role} />
          </div>
          <button
            onClick={clearAuth}
            className="ml-1 p-1.5 rounded-md text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
            aria-label={t('common.logout')}
            title={t('common.logout')}
          >
            <IconLogout />
          </button>
        </div>
      )}
      </header>
    </div>
  )
}
