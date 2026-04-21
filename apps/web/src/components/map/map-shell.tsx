'use client'

import { useState, useCallback, useEffect } from 'react'
import { NavDrawer } from '@/components/layout/nav-drawer'
import { MapControlBar } from './map-control-bar'
import { MapCanvas } from './map-canvas'
import { MapOrdersPanel } from './map-orders-panel'
import { useMapOrderFilters, useMapOrders } from '@/features/map/hooks'

// MapShell is the single source of truth for:
//   - nav drawer state
//   - filter state → passed to control bar, orders panel, and map canvas
//   - selectedOrderId → passed to panel and canvas
//
// Data flows: useMapOrders(filters) → filteredOrders + markableOrders
//   filteredOrders → MapOrdersPanel (list)
//   markableOrders → MapCanvas → YandexMap (markers)
//
// Fixed inset-0 z-40 covers the (dashboard) layout without breaking auth.
export function MapShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { filters, updateFilter } = useMapOrderFilters()
  const { filteredOrders, markableOrders, isLoading } = useMapOrders(filters)

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Smart reset: clear selection when the selected order drops out of filtered results.
  // Preserve selection if it's still present (e.g. filter changed but order still matches).
  useEffect(() => {
    if (selectedOrderId && filteredOrders.length > 0) {
      const stillPresent = filteredOrders.some((o) => o.id === selectedOrderId)
      if (!stillPresent) setSelectedOrderId(null)
    }
  }, [filteredOrders, selectedOrderId])

  const selectedOrder = filteredOrders.find((o) => o.id === selectedOrderId) ?? null

  // Toggle: clicking a selected order deselects it
  const handleSelectOrder = useCallback((id: string) => {
    setSelectedOrderId((prev) => (prev === id ? null : id))
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-gray-900">
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="absolute left-0 right-0 top-0 z-30">
        <MapControlBar
          onMenuClick={() => setDrawerOpen(true)}
          filters={filters}
          onFilterChange={updateFilter}
        />
      </div>

      <div className="relative flex-1 overflow-hidden">
        <MapCanvas
          orders={markableOrders}
          selectedOrder={selectedOrder}
          onSelectOrder={handleSelectOrder}
          onClearSelection={() => setSelectedOrderId(null)}
        />

        <MapOrdersPanel
          orders={filteredOrders}
          isLoading={isLoading}
          filters={filters}
          onFilterChange={updateFilter}
          selectedOrderId={selectedOrderId}
          onSelectOrder={handleSelectOrder}
        />
      </div>
    </div>
  )
}
