'use client'

import { useCallback, useEffect, useState } from 'react'
import { NavDrawer } from '@/components/layout/nav-drawer'
import { useMapOrderFilters, useMapOrders } from '@/features/map/hooks'
import { MapCanvas } from './map-canvas'
import { MapControlBar } from './map-control-bar'
import { MapOrdersPanel } from './map-orders-panel'

interface OrderSelectionState {
  selectedOrderId: string | null
  selectedOrderIds: string[]
}

// MapShell is the single source of truth for nav, filters, and map selection.
export function MapShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { filters, updateFilter } = useMapOrderFilters()
  const { filteredOrders, markableOrders, isLoading } = useMapOrders(filters)

  const [selection, setSelection] = useState<OrderSelectionState>({
    selectedOrderId: null,
    selectedOrderIds: [],
  })

  useEffect(() => {
    const visibleOrderIds = new Set(filteredOrders.map((order) => order.id))

    setSelection((current) => {
      const selectedOrderIds = current.selectedOrderIds.filter((id) =>
        visibleOrderIds.has(id),
      )
      const selectedOrderId =
        current.selectedOrderId && visibleOrderIds.has(current.selectedOrderId)
          ? current.selectedOrderId
          : selectedOrderIds[selectedOrderIds.length - 1] ?? null

      if (
        selectedOrderId === current.selectedOrderId &&
        selectedOrderIds.length === current.selectedOrderIds.length
      ) {
        return current
      }

      return {
        selectedOrderId,
        selectedOrderIds,
      }
    })
  }, [filteredOrders])

  const selectedOrder =
    filteredOrders.find((order) => order.id === selection.selectedOrderId) ??
    null

  const handleSelectOrder = useCallback((id: string, multiSelect = false) => {
    setSelection((current) => {
      if (!multiSelect) {
        return {
          selectedOrderId: id,
          selectedOrderIds: [id],
        }
      }

      const isAlreadySelected = current.selectedOrderIds.includes(id)
      const selectedOrderIds = isAlreadySelected
        ? current.selectedOrderIds.filter((item) => item !== id)
        : [...current.selectedOrderIds, id]

      const selectedOrderId = isAlreadySelected
        ? current.selectedOrderId === id
          ? selectedOrderIds[selectedOrderIds.length - 1] ?? null
          : current.selectedOrderId
        : id

      return {
        selectedOrderId,
        selectedOrderIds,
      }
    })
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelection({
      selectedOrderId: null,
      selectedOrderIds: [],
    })
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
          selectedOrderIds={selection.selectedOrderIds}
          onSelectOrder={handleSelectOrder}
          onClearSelection={handleClearSelection}
        />

        <MapOrdersPanel
          orders={filteredOrders}
          isLoading={isLoading}
          filters={filters}
          onFilterChange={updateFilter}
          selectedOrderId={selection.selectedOrderId}
          selectedOrderIds={selection.selectedOrderIds}
          onSelectOrder={handleSelectOrder}
        />
      </div>
    </div>
  )
}
