import type { Order } from '@/api'

export type SlaStatus = 'no_deadline' | 'on_track' | 'at_risk' | 'overdue'

const RISK_WINDOW_MS = 30 * 60 * 1000
const FINAL_STATUSES = new Set<Order['status']>([
  'delivered',
  'undelivered',
  'returned',
  'cancelled',
])

export function getOrderSlaStatus(order: Order, baseDate: string): SlaStatus {
  if (FINAL_STATUSES.has(order.status)) return 'on_track'

  const deadline = getOrderDeadline(order.timeWindowTo, baseDate)
  if (deadline === null) return 'no_deadline'

  const remainingMs = deadline.getTime() - Date.now()
  if (remainingMs < 0) return 'overdue'
  if (remainingMs <= RISK_WINDOW_MS) return 'at_risk'

  return 'on_track'
}

export function getOrderDeadline(
  timeWindowTo: string | null,
  baseDate: string,
): Date | null {
  if (!timeWindowTo) return null

  const timestamp = Date.parse(timeWindowTo)
  if (Number.isFinite(timestamp)) return new Date(timestamp)

  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeWindowTo)
  if (!timeMatch) return null

  return new Date(`${baseDate}T${timeMatch[1]}:${timeMatch[2]}:00`)
}
