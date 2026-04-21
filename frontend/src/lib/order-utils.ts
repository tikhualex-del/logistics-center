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

/** Human-readable status labels for display in the order list */
const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  confirmed: 'Confirmed',
  assigned: 'Assigned',
  handed_over: 'Handed over',
  in_transit: 'In transit',
  delivered: 'Delivered',
  undelivered: 'Undelivered',
  returned: 'Returned',
  cancelled: 'Cancelled',
}

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
  return STATUS_LABELS[status] ?? status
}

/**
 * All order statuses in pipeline order (for filter dropdowns).
 */
export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'new', label: STATUS_LABELS.new },
  { value: 'confirmed', label: STATUS_LABELS.confirmed },
  { value: 'assigned', label: STATUS_LABELS.assigned },
  { value: 'handed_over', label: STATUS_LABELS.handed_over },
  { value: 'in_transit', label: STATUS_LABELS.in_transit },
  { value: 'delivered', label: STATUS_LABELS.delivered },
  { value: 'undelivered', label: STATUS_LABELS.undelivered },
  { value: 'returned', label: STATUS_LABELS.returned },
  { value: 'cancelled', label: STATUS_LABELS.cancelled },
]

export type OrderTimeSlotFilter = 'morning' | 'day' | 'evening' | 'no-slot'

export const ORDER_TIME_SLOT_OPTIONS: {
  value: OrderTimeSlotFilter
  label: string
}[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'day', label: 'Day' },
  { value: 'evening', label: 'Evening' },
  { value: 'no-slot', label: 'No slot' },
]

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

  if (from !== '—') return `from ${from}`
  if (to !== '—') return `until ${to}`
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

export function getOrderTimeSlotFilter(order: Order): OrderTimeSlotFilter {
  const slotSource = order.timeWindowFrom ?? order.scheduledDate

  if (!slotSource) return 'no-slot'

  const date = new Date(slotSource)
  if (Number.isNaN(date.getTime())) return 'no-slot'

  const hour = date.getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'day'
  return 'evening'
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
