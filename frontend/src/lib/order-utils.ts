import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import type { Order, OrderStatus } from '@/api/orders.api'

/**
 * Utility functions for order display in the dispatcher workspace.
 */

/** Tailwind color classes for each order status badge */
const STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  assigned: 'bg-purple-100 text-purple-800',
  handed_over: 'bg-orange-100 text-orange-800',
  in_transit: 'bg-amber-100 text-amber-800',
  delivered: 'bg-green-100 text-green-800',
  undelivered: 'bg-red-100 text-red-800',
  returned: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

const ORDER_STATUS_VALUES: OrderStatus[] = [
  'new',
  'confirmed',
  'assigned',
  'handed_over',
  'in_transit',
  'delivered',
  'undelivered',
  'returned',
  'cancelled',
]

/**
 * Returns Tailwind badge classes for a given order status.
 * Falls back to a neutral style if status is unknown.
 */
export function getStatusColor(status: OrderStatus): string {
  return STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground'
}

/**
 * Returns a human-readable label for a given order status.
 */
export function getStatusLabel(status: OrderStatus): string {
  const key = `orderStatus.${status}`
  const translated = i18n.t(key)
  return translated === key ? status : translated
}

/**
 * All order statuses in pipeline order (for filter dropdowns).
 */
export function useOrderStatusOptions(): { value: OrderStatus; label: string }[] {
  const { t } = useTranslation()
  return useMemo(
    () =>
      ORDER_STATUS_VALUES.map((value) => ({
        value,
        label: t(`orderStatus.${value}`),
      })),
    [t],
  )
}

/**
 * Formats an ISO datetime string to a short HH:mm time representation.
 * Returns "—" if the value is null or unparseable.
 *
 * @example
 * formatTimeSlot('2024-04-17T14:30:00.000Z') → '14:30'
 * formatTimeSlot(null) → '—'
 */
export function formatTimeSlot(scheduledAt: string | null): string {
  if (!scheduledAt) return '—'
  try {
    const date = new Date(scheduledAt)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return '—'
  }
}

export function formatDeliveryWindow(
  scheduledDate: string | null,
  timeWindowFrom: string | null,
  timeWindowTo: string | null,
): string {
  const from = formatTimeSlot(timeWindowFrom)
  const to = formatTimeSlot(timeWindowTo)

  if (from !== '—' && to !== '—') {
    return `${from}-${to}`
  }

  if (from !== '—') return i18n.t('orders.from', { time: from })
  if (to !== '—') return i18n.t('orders.until', { time: to })
  return formatTimeSlot(scheduledDate)
}

/**
 * Returns a short display ID for an order.
 * Uses externalId if available, otherwise last 8 chars of UUID.
 */
export function getOrderDisplayId(order: {
  id: string
  externalId: string | null
  orderNumber?: string | null
}): string {
  if (order.orderNumber) return order.orderNumber
  if (order.externalId) return order.externalId
  return `#${order.id.slice(-8).toUpperCase()}`
}

export function orderMatchesSearch(order: Order, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return [
    order.orderNumber,
    order.externalId,
    order.customerName,
    order.customerPhone,
    order.deliveryAddress,
  ].some((value) => value?.toLowerCase().includes(normalizedQuery))
}

const TIME_FILTER_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export function orderMatchesTimeRange(
  order: Order,
  startTimeFilter: string | null,
  endTimeFilter: string | null,
): boolean {
  const filterStart = parseTimeFilter(startTimeFilter)
  const filterEnd = parseTimeFilter(endTimeFilter)

  if (filterStart === null && filterEnd === null) return true

  const { start, end } = getOrderDeliveryWindowMinutes(order)

  if (filterStart !== null && filterEnd !== null) {
    return start !== null && end !== null && start >= filterStart && end <= filterEnd
  }

  if (filterStart !== null) {
    return start !== null && start >= filterStart
  }

  return end !== null && filterEnd !== null && end <= filterEnd
}

function parseTimeFilter(value: string | null): number | null {
  if (!value) return null

  const match = TIME_FILTER_PATTERN.exec(value)
  if (!match) return null

  return Number(match[1]) * 60 + Number(match[2])
}

function getOrderDeliveryWindowMinutes(order: Order): {
  start: number | null
  end: number | null
} {
  const windowStart = dateTimeToLocalMinutes(order.timeWindowFrom)
  const windowEnd = dateTimeToLocalMinutes(order.timeWindowTo)

  if (windowStart !== null || windowEnd !== null) {
    return { start: windowStart, end: windowEnd }
  }

  const scheduledTime = dateTimeToLocalMinutes(order.scheduledDate)
  return { start: scheduledTime, end: scheduledTime }
}

function dateTimeToLocalMinutes(value: string | null): number | null {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.getHours() * 60 + date.getMinutes()
}
