/**
 * order-card.test.tsx
 *
 * Component tests for <OrderCard /> using React Testing Library.
 *
 * Mocked boundaries:
 *  - react-i18next → useTranslation returns key passthrough
 *  - @/i18n        → i18n.t returns key passthrough
 *
 * With both mocks active, getStatusLabel(status) returns the raw status string
 * because i18n.t('orderStatus.new') === 'orderStatus.new' (mock returns key),
 * so `translated === key` is true → fallback returns `status`.
 *
 * Group 3 — Badge text for each status
 * Group 4 — Badge CSS classes for each status
 * Group 5 — aria-label accessibility
 * Group 6 — Edge cases: unknown status
 */

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Order, OrderStatus } from '@/api/orders.api'
import { getStatusColor } from '@/lib/order-utils'
import { OrderCard } from './order-card'

// ---------------------------------------------------------------------------
// Mock: react-i18next — key passthrough
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}))

// ---------------------------------------------------------------------------
// Mock: @/i18n — key passthrough (used by getStatusLabel via i18n.t directly)
// ---------------------------------------------------------------------------

vi.mock('@/i18n', () => ({
  default: {
    t: (key: string) => key,
  },
}))

// ---------------------------------------------------------------------------
// All 9 valid order statuses
// ---------------------------------------------------------------------------

const ALL_STATUSES: OrderStatus[] = [
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

// ---------------------------------------------------------------------------
// Factory helper — builds a minimal valid Order for testing
// ---------------------------------------------------------------------------

function makeOrder(status: OrderStatus, overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-test-id',
    companyId: 'company-1',
    status,
    externalId: null,
    orderNumber: `ORD-${status.toUpperCase()}`,
    customerName: 'Test Customer',
    customerPhone: null,
    deliveryAddress: '123 Test St',
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
    createdAt: '2026-04-30T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Helper — render OrderCard with sensible defaults
// ---------------------------------------------------------------------------

function renderCard(order: Order, isSelected = false): ReturnType<typeof render> {
  return render(
    <OrderCard order={order} isSelected={isSelected} onSelect={vi.fn()} />,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ===========================================================================
// Group 3 — Badge text for each status
// ===========================================================================

describe('OrderCard — status badge label', () => {
  it.each(ALL_STATUSES)(
    'renders status text "%s" in the badge with mocked i18n',
    (status) => {
      renderCard(makeOrder(status))
      // With i18n mocked to key passthrough, getStatusLabel returns the raw status string
      expect(screen.getByText(status)).toBeInTheDocument()
    },
  )
})

// ===========================================================================
// Group 4 — Badge CSS classes for each status
// ===========================================================================

describe('OrderCard — status badge color classes', () => {
  it('new — badge has bg-blue-100 text-blue-800', () => {
    renderCard(makeOrder('new'))
    const badge = screen.getByText('new')
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('confirmed — badge has bg-indigo-100 text-indigo-800', () => {
    renderCard(makeOrder('confirmed'))
    const badge = screen.getByText('confirmed')
    expect(badge).toHaveClass('bg-indigo-100', 'text-indigo-800')
  })

  it('assigned — badge has bg-purple-100 text-purple-800', () => {
    renderCard(makeOrder('assigned'))
    const badge = screen.getByText('assigned')
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-800')
  })

  it('handed_over — badge has bg-orange-100 text-orange-800', () => {
    renderCard(makeOrder('handed_over'))
    const badge = screen.getByText('handed_over')
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-800')
  })

  it('in_transit — badge has bg-amber-100 text-amber-800', () => {
    renderCard(makeOrder('in_transit'))
    const badge = screen.getByText('in_transit')
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-800')
  })

  it('delivered — badge has bg-green-100 text-green-800', () => {
    renderCard(makeOrder('delivered'))
    const badge = screen.getByText('delivered')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('undelivered — badge has bg-red-100 text-red-800', () => {
    renderCard(makeOrder('undelivered'))
    const badge = screen.getByText('undelivered')
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('returned — badge has bg-rose-100 text-rose-800', () => {
    renderCard(makeOrder('returned'))
    const badge = screen.getByText('returned')
    expect(badge).toHaveClass('bg-rose-100', 'text-rose-800')
  })

  it('cancelled — badge has bg-gray-100 text-gray-500', () => {
    renderCard(makeOrder('cancelled'))
    const badge = screen.getByText('cancelled')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-500')
  })

  it.each(ALL_STATUSES)(
    'badge classes for "%s" match getStatusColor output',
    (status) => {
      renderCard(makeOrder(status))
      const badge = screen.getByText(status)
      const expectedClasses = getStatusColor(status).split(' ')
      expectedClasses.forEach((cls) => {
        expect(badge).toHaveClass(cls)
      })
    },
  )
})

// ===========================================================================
// Group 5 — aria-label accessibility
// ===========================================================================

describe('OrderCard — accessible aria-label', () => {
  it('new: aria-label contains orderNumber, status, and address', () => {
    const order = makeOrder('new', {
      orderNumber: 'ORD-NEW',
      deliveryAddress: '123 Test St',
    })
    renderCard(order)
    // getStatusLabel('new') with mock → 'new'; displayId → 'ORD-NEW'
    expect(
      screen.getByRole('button', { name: /ORD-NEW, new, 123 Test St/ }),
    ).toBeInTheDocument()
  })

  it('in_transit: aria-label contains orderNumber, status, and address', () => {
    const order = makeOrder('in_transit', {
      orderNumber: 'ORD-IN_TRANSIT',
      deliveryAddress: '456 Highway Ave',
    })
    renderCard(order)
    expect(
      screen.getByRole('button', { name: /ORD-IN_TRANSIT, in_transit, 456 Highway Ave/ }),
    ).toBeInTheDocument()
  })

  it('delivered: aria-label contains orderNumber, status, and address', () => {
    const order = makeOrder('delivered', {
      orderNumber: 'ORD-DELIVERED',
      deliveryAddress: '789 End Rd',
    })
    renderCard(order)
    expect(
      screen.getByRole('button', { name: /ORD-DELIVERED, delivered, 789 End Rd/ }),
    ).toBeInTheDocument()
  })
})

// ===========================================================================
// Group 6 — Edge cases: unknown status
// ===========================================================================

describe('OrderCard — unknown status edge cases', () => {
  it('renders without throwing when status is unknown', () => {
    const order = makeOrder('ghost' as OrderStatus)
    expect(() => renderCard(order)).not.toThrow()
  })

  it('badge is present in the DOM for unknown status', () => {
    const order = makeOrder('ghost' as OrderStatus)
    renderCard(order)
    // With mock, getStatusLabel returns 'ghost'; badge renders that text
    expect(screen.getByText('ghost')).toBeInTheDocument()
  })

  it('badge has fallback classes bg-muted and text-muted-foreground for unknown status', () => {
    const order = makeOrder('ghost' as OrderStatus)
    renderCard(order)
    const badge = screen.getByText('ghost')
    expect(badge).toHaveClass('bg-muted')
    expect(badge).toHaveClass('text-muted-foreground')
  })
})
