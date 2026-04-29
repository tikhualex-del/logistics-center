import { describe, expect, it } from 'vitest'
import type { Order } from '@/api/orders.api'
import { orderMatchesTimeRange } from './order-utils'

function createOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    companyId: 'company-1',
    status: 'new',
    externalId: null,
    orderNumber: null,
    customerName: null,
    customerPhone: null,
    deliveryAddress: 'Test address',
    deliveryLatitude: null,
    deliveryLongitude: null,
    comment: null,
    scheduledDate: null,
    timeWindowFrom: null,
    timeWindowTo: null,
    zoneId: null,
    assignedCourierId: null,
    createdByUserId: null,
    assignedByUserId: null,
    metadata: null,
    createdAt: '2026-04-21T00:00:00.000',
    updatedAt: '2026-04-21T00:00:00.000',
    ...overrides,
  }
}

describe('orderMatchesTimeRange', () => {
  it('does not filter orders when both bounds are empty', () => {
    const order = createOrder()

    expect(orderMatchesTimeRange(order, null, null)).toBe(true)
  })

  it('matches a lower bound against the delivery window start', () => {
    const order = createOrder({
      timeWindowFrom: '2026-04-21T09:00:00.000',
      timeWindowTo: '2026-04-21T11:00:00.000',
    })

    expect(orderMatchesTimeRange(order, '09:00', null)).toBe(true)
    expect(orderMatchesTimeRange(order, '10:00', null)).toBe(false)
  })

  it('matches an upper bound against the delivery window end', () => {
    const order = createOrder({
      timeWindowFrom: '2026-04-21T09:00:00.000',
      timeWindowTo: '2026-04-21T11:00:00.000',
    })

    expect(orderMatchesTimeRange(order, null, '11:00')).toBe(true)
    expect(orderMatchesTimeRange(order, null, '10:00')).toBe(false)
  })

  it('requires the full delivery window to fit inside a two-sided range', () => {
    const order = createOrder({
      timeWindowFrom: '2026-04-21T09:00:00.000',
      timeWindowTo: '2026-04-21T13:00:00.000',
    })

    expect(orderMatchesTimeRange(order, '09:00', '13:00')).toBe(true)
    expect(orderMatchesTimeRange(order, '10:00', '14:00')).toBe(false)
    expect(orderMatchesTimeRange(order, '08:00', '12:00')).toBe(false)
  })

  it('uses scheduledDate as a point-in-time fallback when there is no window', () => {
    const order = createOrder({
      scheduledDate: '2026-04-21T10:30:00.000',
    })

    expect(orderMatchesTimeRange(order, '10:00', '11:00')).toBe(true)
    expect(orderMatchesTimeRange(order, '11:00', null)).toBe(false)
  })
})
