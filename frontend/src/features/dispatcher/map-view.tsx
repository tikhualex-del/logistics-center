import { useMemo, useRef } from 'react'
import {
  useCouriers,
  useOrders,
  useRoutes,
  useYandexMap,
  useZones,
} from '@/hooks'
import { YANDEX_MAPS_API_KEY } from '@/lib/constants'
import {
  getOrderTimeSlotFilter,
  orderMatchesSearch,
} from '@/lib/order-utils'
import { useUiStore } from '@/store'
import {
  useCourierLayer,
  useOrderMarkers,
  useRouteLayer,
  useZonePolygons,
} from './map-layers'

/**
 * MapView — the central element of the dispatcher workspace.
 *
 * Per CLAUDE.md Section 21: the map is the core of the system.
 * It fills 100% of its parent container (absolute inset-0).
 *
 * The parent <main> element in dispatcher.tsx must be:
 *   position: relative (for absolute children to work)
 *   flex-1 + overflow: hidden (to fill remaining vertical space)
 *
 * Layers (markers, zones, couriers, routes) are added in Phase 7 tasks:
 *   7.1b — order markers
 *   7.1c — zone polygons
 *   7.1d — route/courier toggles
 */
export function MapView(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const { mapInstance, isLoading, error } = useYandexMap(containerRef)
  const mapEnabled = Boolean(YANDEX_MAPS_API_KEY)

  const selectedDate = useUiStore((state) => state.selectedDate)
  const statusFilter = useUiStore((state) => state.statusFilter)
  const searchQuery = useUiStore((state) => state.searchQuery)
  const timeSlotFilter = useUiStore((state) => state.timeSlotFilter)
  const selectedOrderId = useUiStore((state) => state.selectedOrderId)
  const selectedRouteId = useUiStore((state) => state.selectedRouteId)
  const showRoutes = useUiStore((state) => state.showRoutes)
  const showCouriers = useUiStore((state) => state.showCouriers)
  const setSelectedOrderId = useUiStore((state) => state.setSelectedOrderId)
  const setSelectedCourierId = useUiStore((state) => state.setSelectedCourierId)
  const setSelectedRouteId = useUiStore((state) => state.setSelectedRouteId)

  const { data: orders = [] } = useOrders(
    {
      date: selectedDate,
      status: statusFilter ?? undefined,
    },
    { enabled: mapEnabled },
  )
  const { data: zones = [] } = useZones({ enabled: mapEnabled })
  const { data: routes = [] } = useRoutes(
    { date: selectedDate },
    { enabled: mapEnabled && showRoutes },
  )
  const { data: couriers = [] } = useCouriers({
    enabled: mapEnabled && showCouriers,
  })

  const visibleOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesSearch = orderMatchesSearch(order, searchQuery)
        const matchesSlot =
          timeSlotFilter === null ||
          getOrderTimeSlotFilter(order) === timeSlotFilter

        return matchesSearch && matchesSlot
      }),
    [orders, searchQuery, timeSlotFilter],
  )

  useOrderMarkers(
    mapInstance,
    visibleOrders,
    selectedOrderId,
    setSelectedOrderId,
  )
  useZonePolygons(mapInstance, zones)
  useRouteLayer(
    mapInstance,
    routes,
    showRoutes,
    selectedRouteId,
    setSelectedRouteId,
  )
  useCourierLayer(mapInstance, couriers, showCouriers, setSelectedCourierId)

  // API key missing — show configuration warning
  if (!YANDEX_MAPS_API_KEY) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        <div className="text-center max-w-sm px-6">
          <div className="text-4xl mb-3 text-muted-foreground">&#128506;</div>
          <p className="text-sm font-semibold text-foreground">Map not configured</p>
          <p className="text-xs text-muted-foreground mt-1.5">
            Set <code className="font-mono bg-muted-foreground/10 px-1 rounded">VITE_YANDEX_MAPS_API_KEY</code>{' '}
            in your <code className="font-mono bg-muted-foreground/10 px-1 rounded">.env</code> file to enable the map.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Map container — fills parent absolutely */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        aria-label="Dispatcher map"
        role="application"
      />

      {/* Loading overlay — shown while API initialises */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error overlay — shown if API failed to load */}
      {!isLoading && error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center max-w-sm px-6">
            <div className="text-4xl mb-3 text-destructive">&#9888;</div>
            <p className="text-sm font-semibold text-foreground">Map unavailable</p>
            <p className="text-xs text-muted-foreground mt-1.5">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Check your API key and internet connection.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
