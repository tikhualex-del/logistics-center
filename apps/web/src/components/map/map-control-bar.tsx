'use client'

import { useRef } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { NotificationsButton } from './notifications-popover'
import type { MapOrderFilters } from '@/features/map/types'
import { ORDER_STATUS_LABELS } from '@/constants/order-statuses'

interface MapControlBarProps {
  onMenuClick: () => void
  filters: MapOrderFilters
  onFilterChange: (patch: Partial<MapOrderFilters>) => void
}

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

const TIME_OPTIONS = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'] as const

// ─── Date picker control ──────────────────────────────────────────────────────

function DateFilterControl({
  value,
  onChange,
}: {
  value: string
  onChange: (date: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Show today's date as default label, or the selected date when filtered
  const label = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
    : new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })

  const isFiltered = value !== ''

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (inputRef.current as any)?.showPicker?.()}
        className={[
          'rounded-lg p-2 text-gray-500 transition-colors',
          isFiltered
            ? 'text-blue-700 hover:bg-gray-100'
            : 'hover:bg-gray-100 hover:text-gray-700',
        ].join(' ')}
      >
        <svg
          className="h-5 w-5 shrink-0 opacity-70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v11.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6.75a1.5 1.5 0 011.5-1.5z"
          />
        </svg>
        {isFiltered ? (
          <span
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className="absolute -right-1 -top-1 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-100"
            role="button"
            tabIndex={0}
            aria-label="Сбросить дату"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onChange('')
              }
            }}
          >
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        ) : null}
      </button>

      {/* Hidden input — showPicker() opens the native date picker */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute top-full left-0 h-px w-px opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  )
}

// ─── Status dropdown ──────────────────────────────────────────────────────────

function StatusFilterControl({
  value,
  onChange,
}: {
  value: string
  onChange: (status: string) => void
}) {
  const isFiltered = value !== ''

  return (
    <div className="relative flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'appearance-none rounded-lg px-2 py-2 pr-6 text-sm transition-colors',
          'focus:outline-none',
          isFiltered
            ? 'bg-transparent text-blue-700 hover:bg-gray-100'
            : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700',
        ].join(' ')}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-1.5 h-3.5 w-3.5 text-gray-400"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}

// ─── Time slot switcher ───────────────────────────────────────────────────────

function TimeRangeControls({
  timeFrom,
  timeTo,
  onChange,
}: {
  timeFrom: string
  timeTo: string
  onChange: (patch: { timeFrom?: string; timeTo?: string }) => void
}) {
  return (
    <div className="flex items-center gap-1">


      <select
        value={timeFrom}
        onChange={(e) => onChange({ timeFrom: e.target.value })}
        className="rounded-lg bg-transparent px-2 py-2 pr-1 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
      >
        {TIME_OPTIONS.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>



      <select
        value={timeTo}
        onChange={(e) => onChange({ timeTo: e.target.value })}
        className="rounded-lg bg-transparent px-2 py-2 pr-1 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
      >
        {TIME_OPTIONS.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── Main bar ─────────────────────────────────────────────────────────────────

export function MapControlBar({ onMenuClick, filters, onFilterChange }: MapControlBarProps) {
  const { logout } = useAuth()

  return (
    <div className="mx-3 mt-3 flex h-14 shrink-0 items-center gap-2 rounded-2xl border border-gray-200/60 bg-gray-100/90 px-3 shadow-sm backdrop-blur-md">

      {/* Left — burger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Открыть меню"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* Center — filter controls */}
      <div className="flex flex-1 items-center gap-2">
        <DateFilterControl
          value={filters.date}
          onChange={(date) => onFilterChange({ date })}
        />
        <StatusFilterControl
          value={filters.status}
          onChange={(status) => onFilterChange({ status })}
        />
        <TimeRangeControls
          timeFrom={filters.timeFrom}
          timeTo={filters.timeTo}
          onChange={onFilterChange}
        />
      </div>

      {/* Right — notifications + logout */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>

          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Поиск по номеру заказа или адресу..."
            className="w-96 rounded-xl border border-white/70 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-gray-700 shadow-sm transition-colors placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-white/80"
          />
        </div>

        <NotificationsButton />

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-white/70 hover:text-red-600"
        >
          <span className="hidden sm:block">Выход</span>

          <svg
            className="h-6 w-6 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 5H7a2 2 0 00-2 2v10a2 2 0 002 2h7"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 12h10"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4-4 4"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
