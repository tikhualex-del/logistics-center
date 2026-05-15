/**
 * order-status-display.test.ts
 *
 * Pure-function tests for getStatusColor and getStatusLabel.
 * No React rendering, no DOM — pure logic only.
 *
 * Group 1 — getStatusColor: all statuses, uniqueness, fallbacks
 * Group 2 — getStatusLabel: real i18n translations + fallback guard
 */

import { describe, expect, it } from 'vitest'
import type { OrderStatus } from '@/api/orders.api'
import { getStatusColor, getStatusLabel } from './order-utils'

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
// Group 1 — getStatusColor
// ---------------------------------------------------------------------------

describe('getStatusColor — all statuses return a non-empty string', () => {
  it.each(ALL_STATUSES)('getStatusColor("%s") returns non-empty string', (status) => {
    const result = getStatusColor(status)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('getStatusColor — specific color classes per status', () => {
  it('new → bg-blue-100 text-blue-800', () => {
    expect(getStatusColor('new')).toBe('bg-blue-100 text-blue-800')
  })

  it('confirmed → bg-indigo-100 text-indigo-800', () => {
    expect(getStatusColor('confirmed')).toBe('bg-indigo-100 text-indigo-800')
  })

  it('assigned → bg-purple-100 text-purple-800', () => {
    expect(getStatusColor('assigned')).toBe('bg-purple-100 text-purple-800')
  })

  it('handed_over → bg-orange-100 text-orange-800', () => {
    expect(getStatusColor('handed_over')).toBe('bg-orange-100 text-orange-800')
  })

  it('in_transit → bg-amber-100 text-amber-800', () => {
    expect(getStatusColor('in_transit')).toBe('bg-amber-100 text-amber-800')
  })

  it('delivered → bg-green-100 text-green-800', () => {
    expect(getStatusColor('delivered')).toBe('bg-green-100 text-green-800')
  })

  it('undelivered → bg-red-100 text-red-800', () => {
    expect(getStatusColor('undelivered')).toBe('bg-red-100 text-red-800')
  })

  it('returned → bg-rose-100 text-rose-800', () => {
    expect(getStatusColor('returned')).toBe('bg-rose-100 text-rose-800')
  })

  it('cancelled → bg-gray-100 text-gray-500', () => {
    expect(getStatusColor('cancelled')).toBe('bg-gray-100 text-gray-500')
  })
})

describe('getStatusColor — each status returns a unique color class', () => {
  it('all 9 color strings are distinct', () => {
    const colors = ALL_STATUSES.map((s) => getStatusColor(s))
    const uniqueColors = new Set(colors)
    expect(uniqueColors.size).toBe(9)
  })
})

describe('getStatusColor — fallback for unknown / edge-case input', () => {
  it('unknown status returns fallback bg-muted text-muted-foreground', () => {
    expect(getStatusColor('unknown_status' as OrderStatus)).toBe(
      'bg-muted text-muted-foreground',
    )
  })

  it('empty string returns fallback without throwing', () => {
    expect(() => getStatusColor('' as OrderStatus)).not.toThrow()
    expect(getStatusColor('' as OrderStatus)).toBe('bg-muted text-muted-foreground')
  })
})

// ---------------------------------------------------------------------------
// Group 2 — getStatusLabel
// Real i18n module — no mock. i18n initialises synchronously in index.ts.
// ---------------------------------------------------------------------------

describe('getStatusLabel — returns translated label for all statuses', () => {
  it('new → Новый', () => {
    expect(getStatusLabel('new')).toBe('Новый')
  })

  it('confirmed → Подтверждён', () => {
    expect(getStatusLabel('confirmed')).toBe('Подтверждён')
  })

  it('assigned → Назначен', () => {
    expect(getStatusLabel('assigned')).toBe('Назначен')
  })

  it('handed_over → Передан курьеру', () => {
    expect(getStatusLabel('handed_over')).toBe('Передан курьеру')
  })

  it('in_transit → В пути', () => {
    expect(getStatusLabel('in_transit')).toBe('В пути')
  })

  it('delivered → Доставлен', () => {
    expect(getStatusLabel('delivered')).toBe('Доставлен')
  })

  it('undelivered → Не доставлен', () => {
    expect(getStatusLabel('undelivered')).toBe('Не доставлен')
  })

  it('returned → Возврат', () => {
    expect(getStatusLabel('returned')).toBe('Возврат')
  })

  it('cancelled → Отменён', () => {
    expect(getStatusLabel('cancelled')).toBe('Отменён')
  })
})

describe('getStatusLabel — fallback for unknown / missing key', () => {
  it('unknown status returns the raw status string as fallback', () => {
    expect(getStatusLabel('ghost_status' as OrderStatus)).toBe('ghost_status')
  })

  it('all known statuses return a value different from the i18n key', () => {
    ALL_STATUSES.forEach((status) => {
      const label = getStatusLabel(status)
      // Real translation must differ from the raw key string
      expect(label).not.toBe(status)
      expect(label.length).toBeGreaterThan(0)
    })
  })
})
