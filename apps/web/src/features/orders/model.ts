import type { OrderStatus } from './types'

export const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'failed', 'cancelled']
export const ACTIVE_STATUSES: OrderStatus[] = ['new', 'assigned', 'picked_up']

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export function canTransitionTo(from: OrderStatus, to: OrderStatus): boolean {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    new: ['assigned', 'cancelled'],
    assigned: ['picked_up', 'cancelled'],
    picked_up: ['delivered', 'failed'],
    delivered: [],
    failed: [],
    cancelled: [],
  }
  return transitions[from]?.includes(to) ?? false
}
