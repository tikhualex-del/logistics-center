'use client'

import { useState, useDeferredValue, useMemo } from 'react'
import { useOrders } from '@/features/orders/hooks'
import type { Order } from '@/features/orders/types'
import type { MapOrderFilters, MapViewport } from './types'
import { EMPTY_MAP_FILTERS, DEFAULT_VIEWPORT } from './model'

// ─── Viewport ────────────────────────────────────────────────────────────────

export function useMapViewport() {
  const [viewport, setViewport] = useState<MapViewport>(DEFAULT_VIEWPORT)
  return { viewport, setViewport }
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export function useMapOrderFilters() {
  const [filters, setFilters] = useState<MapOrderFilters>(EMPTY_MAP_FILTERS)

  const updateFilter = (patch: Partial<MapOrderFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }))

  const resetFilters = () => setFilters(EMPTY_MAP_FILTERS)

  const activeFilterCount = [
    filters.status !== '',
    filters.slaStatus !== '',
    filters.search.trim() !== '',
    filters.date !== '',
  ].filter(Boolean).length

  return { filters, updateFilter, resetFilters, activeFilterCount }
}

// ─── Orders with client-side filtering ───────────────────────────────────────

// Returns the helper function to get the relevant time field for an order.
// Priority: scheduledPickupAt → deadline.
function getTimeField(order: Order): Date | null {
  const raw = order.scheduledPickupAt ?? order.deadline
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

export function useMapOrders(filters: MapOrderFilters) {
  // Status goes to backend; slaStatus also to backend.
  const { data: rawOrders, isLoading, error } = useOrders({
    status: (filters.status as Order['status']) || undefined,
    slaStatus: (filters.slaStatus as Order['slaStatus']) || undefined,
  })

  // Deferred search — avoids filtering on every keystroke
  const deferredSearch = useDeferredValue(filters.search.trim().toLowerCase())

  const filteredOrders = useMemo(() => {
    if (!rawOrders) return []

    return rawOrders.filter((order) => {
      // 1. Client-side search
      if (deferredSearch) {
        const match =
          order.customerName.toLowerCase().includes(deferredSearch) ||
          order.deliveryAddress.toLowerCase().includes(deferredSearch)
        if (!match) return false
      }

      // 2. Date filter
      if (filters.date) {
        const t = getTimeField(order)
        if (!t) return false // no time field → excluded when date filter active
        const orderDate = t.toISOString().slice(0, 10) // 'YYYY-MM-DD'
        if (orderDate !== filters.date) return false
      }

      // 3. Time range filter — only applied when date filter is active
      if (filters.date) {
        const t = getTimeField(order)
        if (!t) return false

        const orderMinutes = t.getHours() * 60 + t.getMinutes()

        const [fromHour, fromMinute] = filters.timeFrom.split(':').map(Number)
        const [toHour, toMinute] = filters.timeTo.split(':').map(Number)

        const fromMinutes = fromHour * 60 + fromMinute
        const toMinutes = toHour * 60 + toMinute

        if (orderMinutes < fromMinutes || orderMinutes > toMinutes) return false
      }

      return true
    })
  }, [rawOrders, deferredSearch, filters.date, filters.timeFrom, filters.timeTo])

  // Orders with coordinates — ready for map markers
  const markableOrders = useMemo(
    () => filteredOrders.filter((o) => o.deliveryLat !== null && o.deliveryLng !== null),
    [filteredOrders],
  )

  return { filteredOrders, markableOrders, isLoading, error, rawOrders }
}
