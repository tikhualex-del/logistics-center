import type { OrderStatus } from '@/api'

export const NEXT_ORDER_STATUSES: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ['confirmed'],
  confirmed: ['assigned'],
  assigned: ['handed_over'],
  handed_over: ['in_transit'],
  in_transit: ['delivered', 'undelivered', 'returned', 'cancelled'],
  delivered: [],
  undelivered: [],
  returned: [],
  cancelled: [],
}
