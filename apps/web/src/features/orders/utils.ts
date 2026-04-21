import type { Order } from './types'

export function formatDeadline(order: Order): string {
  if (!order.deadline) return 'No deadline'
  return new Date(order.deadline).toLocaleString()
}

export function getTimeToDeadline(order: Order, now: Date = new Date()): number | null {
  if (!order.deadline) return null
  return new Date(order.deadline).getTime() - now.getTime()
}
