import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useCouriers,
  useOrders,
  useRoutePreview,
  useRoutes,
  useYandexMap,
  useZones,
} from '@/hooks'
import { YANDEX_MAPS_API_KEY } from '@/lib/constants'
import { buildOrderFilters } from '@/api'
import type { RoutePreview } from '@/store'
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
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const { mapInstance, isLoading, error } = useYandexMap(containerRef)
  const mapEnabled = Boolean(YANDEX_MAPS_API_KEY)

  const selectedDate = useUiStore((state) => state.selectedDate)
  const statusFilter = useUiStore((state) => state.statusFilter)
  const searchQuery = useUiStore((state) => state.searchQuery)
  const startTimeFilter = useUiStore((state) => state.startTimeFilter)
  const endTimeFilter = useUiStore((state) => state.endTimeFilter)
  const selectedOrderId = useUiStore((state) => state.selectedOrderId)
  const selectedOrderIds = useUiStore((state) => state.selectedOrderIds)
  const selectedRouteId = useUiStore((state) => state.selectedRouteId)
  const showRoutes = useUiStore((state) => state.showRoutes)
  const routeDisplayMode = useUiStore((state) => state.routeDisplayMode)
  const routePreview = useUiStore((state) => state.routePreview)
  const showCouriers = useUiStore((state) => state.showCouriers)
  const selectOrder = useUiStore((state) => state.selectOrder)
  const setSelectedCourierId = useUiStore((state) => state.setSelectedCourierId)
  const setSelectedRouteId = useUiStore((state) => state.setSelectedRouteId)

  const orderFilters = useMemo(
    () =>
      buildOrderFilters({
        date: selectedDate,
        status: statusFilter,
        search: searchQuery,
        timeWindowFrom: startTimeFilter,
        timeWindowTo: endTimeFilter,
      }),
    [endTimeFilter, searchQuery, selectedDate, startTimeFilter, statusFilter],
  )
  const { data: orders = [] } = useOrders(orderFilters, { enabled: mapEnabled })
  const { data: zones = [] } = useZones({ enabled: mapEnabled })
  const { data: routes = [] } = useRoutes(
    { date: selectedDate },
    { enabled: mapEnabled && showRoutes },
  )
  const ordersById = useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders],
  )
  const selectionRoutePreview = useMemo<RoutePreview | null>(() => {
    if (routePreview !== null || selectedRouteId !== null) {
      return null
    }

    const previewPoints = selectedOrderIds
      .map((orderId) => {
        const order = ordersById.get(orderId)
        if (
          !order ||
          order.deliveryLatitude === null ||
          order.deliveryLongitude === null
        ) {
          return null
        }

        return {
          orderId,
          latitude: order.deliveryLatitude,
          longitude: order.deliveryLongitude,
        }
      })
      .filter(
        (
          point,
        ): point is {
          orderId: string
          latitude: number
          longitude: number
        } => point !== null,
      )

    if (previewPoints.length < 2) {
      return null
    }

    return {
      routeId: null,
      orderIds: previewPoints.map((point) => point.orderId),
      routeDate: `${selectedDate}T09:00:00.000Z`,
      courierId: null,
      points: previewPoints,
    }
  }, [ordersById, routePreview, selectedDate, selectedOrderIds, selectedRouteId])
  const effectiveRoutePreview = routePreview ?? selectionRoutePreview
  const routePreviewRequest = useMemo(
    () =>
      routeDisplayMode === 'roads' &&
      effectiveRoutePreview !== null &&
      effectiveRoutePreview.orderIds.length >= 2
        ? {
            orderIds: effectiveRoutePreview.orderIds,
            courierId: effectiveRoutePreview.courierId,
            routeDate: effectiveRoutePreview.routeDate,
            mode: 'driving' as const,
            optimizeWaypoints: false,
            returnToStart: false,
          }
        : null,
    [effectiveRoutePreview, routeDisplayMode],
  )
  const { data: routePreviewRoadRoute = null } = useRoutePreview(
    routePreviewRequest,
    {
      enabled:
        mapEnabled &&
        showRoutes &&
        routePreviewRequest !== null,
    },
  )
  const routePreviewRoadCoordinates = useMemo(
    () =>
      routePreviewRoadRoute?.polyline.map(
        (point) => [point.latitude, point.longitude] as [number, number],
      ),
    [routePreviewRoadRoute],
  )
  const { data: couriers = [] } = useCouriers({
    enabled: mapEnabled && showCouriers,
  })

  const visibleOrders = orders

  useOrderMarkers(
    mapInstance,
    visibleOrders,
    selectedOrderId,
    selectedOrderIds,
    selectOrder,
  )
  useZonePolygons(mapInstance, zones)
  useRouteLayer(
    mapInstance,
    routes,
    showRoutes,
    routeDisplayMode,
    effectiveRoutePreview,
    routePreviewRoadCoordinates,
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
          <p className="text-sm font-semibold text-foreground">{t('map.notConfigured')}</p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {t('map.notConfiguredHint')}
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
        aria-label={t('map.ariaLabel')}
        role="application"
      />

      {/* Loading overlay — shown while API initialises */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">{t('map.loading')}</p>
          </div>
        </div>
      )}

      {/* Error overlay — shown if API failed to load */}
      {!isLoading && error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center max-w-sm px-6">
            <div className="text-4xl mb-3 text-destructive">&#9888;</div>
            <p className="text-sm font-semibold text-foreground">{t('map.unavailable')}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{error}</p>
          </div>
        </div>
      )}
    </>
  )
}
