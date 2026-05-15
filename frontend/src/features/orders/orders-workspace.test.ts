import { describe, expect, it } from 'vitest'

import type { OrderStatus } from '@/api'
import { NEXT_ORDER_STATUSES } from './order-status-transitions'

const BACKEND_COMPATIBLE_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
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

describe('NEXT_ORDER_STATUSES', () => {
  it('matches backend order state machine transitions', () => {
    expect(NEXT_ORDER_STATUSES).toEqual(BACKEND_COMPATIBLE_TRANSITIONS)
  })

  it('does not expose transitions rejected by backend before in_transit', () => {
    expect(NEXT_ORDER_STATUSES.new).not.toContain('cancelled')
    expect(NEXT_ORDER_STATUSES.confirmed).not.toContain('cancelled')
    expect(NEXT_ORDER_STATUSES.assigned).not.toContain('cancelled')
    expect(NEXT_ORDER_STATUSES.handed_over).not.toContain('returned')
  })

  it('allows cancellation from in_transit, matching backend', () => {
    expect(NEXT_ORDER_STATUSES.in_transit).toContain('cancelled')
  })
})
