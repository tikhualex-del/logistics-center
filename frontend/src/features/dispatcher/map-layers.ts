import { useEffect, useRef } from 'react'
import i18n from '@/i18n'
import {
  formatDeliveryWindow,
  getOrderDisplayId,
  getStatusLabel,
} from '@/lib/order-utils'
import type {
  Courier,
  CourierStatus,
  Order,
  Route,
  RouteStatus,
  Zone,
} from '@/api'
import type { RoutePreview } from '@/store'
import {
  dispatchMapOrderDrop,
  ROUTE_DROP_TARGET_SELECTOR,
} from './route-dnd'

type MapObject =
  | ymaps.GeoObject
  | ymaps.Placemark
  | ymaps.Polygon
  | ymaps.Polyline

interface ClientPoint {
  clientX: number
  clientY: number
}

const COURIER_MARKER_COLORS: Record<CourierStatus, string> = {
  inactive: '#9ca3af',
  available: '#16a34a',
  busy: '#f59e0b',
  offline: '#6b7280',
  suspended: '#dc2626',
}

const ROUTE_COLORS: Record<RouteStatus, string> = {
  draft: '#64748b',
  planned: '#2563eb',
  in_progress: '#f59e0b',
  completed: '#16a34a',
  cancelled: '#ef4444',
}

export function useOrderMarkers(
  map: ymaps.Map | null,
  orders: Order[],
  selectedOrderId: string | null,
  selectedOrderIds: string[],
  onSelectOrder: (id: string, multiSelect?: boolean) => void,
): void {
  // Store callback in a ref to avoid re-running the effect when it changes
  const onSelectRef = useRef(onSelectOrder)
  const isMultiSelectKeyPressedRef = useRef(false)
  const pointerMultiSelectRef = useRef(false)
  const pointerMultiSelectTimerRef = useRef<number | null>(null)
  const lastPointerPositionRef = useRef<ClientPoint | null>(null)
  const suppressClickOrderIdRef = useRef<string | null>(null)
  const suppressClickTimerRef = useRef<number | null>(null)

  useEffect(() => {
    onSelectRef.current = onSelectOrder
  }, [onSelectOrder])

  useEffect(() => {
    const clearPointerModifier = () => {
      if (pointerMultiSelectTimerRef.current !== null) {
        window.clearTimeout(pointerMultiSelectTimerRef.current)
        pointerMultiSelectTimerRef.current = null
      }

      pointerMultiSelectRef.current = false
    }

    const syncMultiSelectKey = (event: KeyboardEvent) => {
      isMultiSelectKeyPressedRef.current = event.ctrlKey || event.metaKey
    }

    const syncPointerModifier = (event: MouseEvent | PointerEvent) => {
      lastPointerPositionRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      }
      pointerMultiSelectRef.current = event.ctrlKey || event.metaKey

      if (pointerMultiSelectTimerRef.current !== null) {
        window.clearTimeout(pointerMultiSelectTimerRef.current)
      }

      pointerMultiSelectTimerRef.current = window.setTimeout(() => {
        pointerMultiSelectRef.current = false
        pointerMultiSelectTimerRef.current = null
      }, 1500)
    }

    const trackPointerPosition = (event: MouseEvent | PointerEvent) => {
      lastPointerPositionRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      }
    }

    const clearMultiSelectState = () => {
      isMultiSelectKeyPressedRef.current = false
      clearPointerModifier()
    }

    window.addEventListener('keydown', syncMultiSelectKey, true)
    window.addEventListener('keyup', syncMultiSelectKey, true)
    window.addEventListener('pointerdown', syncPointerModifier, true)
    window.addEventListener('mousedown', syncPointerModifier, true)
    window.addEventListener('pointermove', trackPointerPosition, true)
    window.addEventListener('mousemove', trackPointerPosition, true)
    window.addEventListener('blur', clearMultiSelectState)
    document.addEventListener('visibilitychange', clearMultiSelectState)

    return () => {
      window.removeEventListener('keydown', syncMultiSelectKey, true)
      window.removeEventListener('keyup', syncMultiSelectKey, true)
      window.removeEventListener('pointerdown', syncPointerModifier, true)
      window.removeEventListener('mousedown', syncPointerModifier, true)
      window.removeEventListener('pointermove', trackPointerPosition, true)
      window.removeEventListener('mousemove', trackPointerPosition, true)
      window.removeEventListener('blur', clearMultiSelectState)
      document.removeEventListener('visibilitychange', clearMultiSelectState)
      clearPointerModifier()
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current)
        suppressClickTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!map || orders.length === 0) return

    const mapObjects: MapObject[] = []

    orders.forEach((order) => {
      if (!hasOrderCoordinates(order)) return

      const coords: ymaps.Coordinates = [
        order.deliveryLatitude,
        order.deliveryLongitude,
      ]

      try {
        const isSelected =
          order.id === selectedOrderId || selectedOrderIds.includes(order.id)
        const placemarkOptions = {
          preset: isSelected
            ? 'islands#blueStretchyIcon'
            : 'islands#redStretchyIcon',
          draggable: true,
          cursor: 'grab',
        } satisfies ymaps.PlacemarkOptions & {
          draggable: boolean
          cursor: string
        }
        const placemark = new window.ymaps.Placemark(
          coords,
          {
            hintContent: getOrderDisplayId(order),
            balloonContent: buildOrderBalloon(order),
            iconContent: String(order.orderNumber ?? getOrderDisplayId(order)),
          },
          placemarkOptions,
        )

        placemark.events.add('click', (event: unknown) => {
          if (suppressClickOrderIdRef.current === order.id) {
            suppressClickOrderIdRef.current = null
            return
          }

          const multiSelect =
            isMultiSelectKeyPressedRef.current ||
            pointerMultiSelectRef.current ||
            hasModifierKeyFromYandexEvent(event)

          pointerMultiSelectRef.current = false
          onSelectRef.current(order.id, multiSelect)
          void map.setCenter(coords, Math.max(map.getZoom(), 12))
        })

        placemark.events.add('dragend', (event: unknown) => {
          resetPlacemarkCoordinates(placemark, coords)
          suppressClickOrderIdRef.current = order.id

          if (suppressClickTimerRef.current !== null) {
            window.clearTimeout(suppressClickTimerRef.current)
          }

          suppressClickTimerRef.current = window.setTimeout(() => {
            suppressClickOrderIdRef.current = null
            suppressClickTimerRef.current = null
          }, 250)

          const point =
            getClientPointFromYandexEvent(event) ?? lastPointerPositionRef.current

          if (point && isRouteDropTargetAtPoint(point)) {
            dispatchMapOrderDrop(order.id)
          }
        })

        map.geoObjects.add(placemark)
        mapObjects.push(placemark)
      } catch (err: unknown) {
        console.error('Failed to create order placemark', order.id, err)
      }
    })

    return () => {
      mapObjects.forEach((object) => {
        try {
          map.geoObjects.remove(object)
        } catch {
          // ignore cleanup race conditions
        }
      })
    }
    // onSelectOrder stored in ref to keep deps stable.
  }, [map, orders, selectedOrderId, selectedOrderIds])
}

export function useZonePolygons(map: ymaps.Map | null, zones: Zone[]): void {
  useEffect(() => {
    if (!map) return

    const polygons: ymaps.Polygon[] = []

    zones.forEach((zone) => {
      if (!zone.isActive) return

      const geometry = toYandexPolygonGeometry(zone.polygon.coordinates)
      if (!geometry.length) return

      const color = zone.color ?? '#2563eb'
      const polygon = new window.ymaps.Polygon(
        geometry,
        {
          hintContent: zone.name,
          balloonContent: buildZoneBalloon(zone),
        },
        {
          fillColor: color,
          fillOpacity: 0.16,
          strokeColor: color,
          strokeOpacity: 0.7,
          strokeWidth: 2,
        },
      )

      map.geoObjects.add(polygon)
      polygons.push(polygon)
    })

    return () => {
      polygons.forEach((polygon) => {
        try {
          map.geoObjects.remove(polygon)
        } catch {
          // ignore Yandex Maps cleanup race conditions
        }
      })
    }
  }, [map, zones])
}

export function useRouteLayer(
  map: ymaps.Map | null,
  routes: Route[],
  visible: boolean,
  displayMode: 'roads' | 'lines',
  routePreview: RoutePreview | null,
  routePreviewRoadCoordinates: ymaps.Coordinates[] | undefined,
  selectedRouteId: string | null,
  onSelectRoute: (id: string) => void,
): void {
  useEffect(() => {
    if (!map || !visible) return

    const mapObjects: ymaps.GeoObject[] = []
    const previewCoordinates =
      displayMode === 'roads' && routePreviewRoadCoordinates && routePreviewRoadCoordinates.length > 1
        ? routePreviewRoadCoordinates
        : getPreviewCoordinates(routePreview)

    const addRoutePolyline = (
      route: Route,
      coordinates: ymaps.Coordinates[],
    ): void => {
      if (coordinates.length < 2) return

      const isSelected = route.id === selectedRouteId
      const polyline = new window.ymaps.Polyline(
        coordinates,
        {
          hintContent: i18n.t('map.balloon.routeVersion', { version: route.version }),
          balloonContent: buildRouteBalloon(route),
        },
        {
          strokeColor: isSelected ? '#111827' : ROUTE_COLORS[route.status],
          strokeOpacity: isSelected ? 0.96 : 0.82,
          strokeWidth: isSelected ? 7 : route.status === 'in_progress' ? 5 : 4,
        },
      )

      polyline.events.add('click', () => {
        onSelectRoute(route.id)
      })

      map.geoObjects.add(polyline)
      mapObjects.push(polyline)
    }

    const addPreviewPolyline = (coordinates: ymaps.Coordinates[]): void => {
      if (coordinates.length < 2) return

      const polyline = new window.ymaps.Polyline(
        coordinates,
        {
          hintContent: 'Новый черновик',
          balloonContent: 'Новый черновик',
        },
        {
          strokeColor: ROUTE_COLORS.draft,
          strokeOpacity: 0.9,
          strokeWidth: 4,
        },
      )

      map.geoObjects.add(polyline)
      mapObjects.push(polyline)
    }

    routes.forEach((route) => {
      addRoutePolyline(
        route,
        getRouteCoordinates(
          route,
          displayMode,
          routePreview,
          routePreviewRoadCoordinates,
        ),
      )
    })

    if (routePreview?.routeId === null) {
      addPreviewPolyline(previewCoordinates)
    }

    return () => {
      mapObjects.forEach((object) => {
        try {
          map.geoObjects.remove(object)
        } catch {
          // ignore Yandex Maps cleanup race conditions
        }
      })
    }
  }, [
    displayMode,
    map,
    onSelectRoute,
    routePreview,
    routePreviewRoadCoordinates,
    routes,
    selectedRouteId,
    visible,
  ])
}

export function useCourierLayer(
  map: ymaps.Map | null,
  couriers: Courier[],
  visible: boolean,
  onSelectCourier: (id: string) => void,
): void {
  useEffect(() => {
    if (!map || !visible) return

    const mapObjects: MapObject[] = []

    couriers.forEach((courier) => {
      if (!hasCourierCoordinates(courier)) return

      const coords: ymaps.Coordinates = [courier.latitude, courier.longitude]
      const placemark = new window.ymaps.Placemark(
        coords,
        {
          hintContent: `${courier.firstName} ${courier.lastName ?? ''}`.trim(),
          balloonContent: buildCourierBalloon(courier),
          iconContent: courier.isOnline ? 'C' : '',
        },
        {
          preset: courier.isOnline
            ? 'islands#circleDotIcon'
            : 'islands#grayCircleIcon',
          iconColor: COURIER_MARKER_COLORS[courier.status],
        },
      )

      placemark.events.add('click', () => {
        onSelectCourier(courier.id)
        void map.setCenter(coords, Math.max(map.getZoom(), 12))
      })

      map.geoObjects.add(placemark)
      mapObjects.push(placemark)
    })

    return () => {
      mapObjects.forEach((object) => {
        try {
          map.geoObjects.remove(object)
        } catch {
          // ignore Yandex Maps cleanup race conditions
        }
      })
    }
  }, [couriers, map, onSelectCourier, visible])
}

function hasOrderCoordinates(
  order: Order,
): order is Order & { deliveryLatitude: number; deliveryLongitude: number } {
  return order.deliveryLatitude !== null && order.deliveryLongitude !== null
}

function hasCourierCoordinates(
  courier: Courier,
): courier is Courier & { latitude: number; longitude: number } {
  return courier.latitude !== null && courier.longitude !== null
}

function toYandexPolygonGeometry(
  coordinates: number[][][],
): ymaps.Coordinates[][] {
  return coordinates
    .map((ring) =>
      ring
        .map(([longitude, latitude]) =>
          typeof latitude === 'number' && typeof longitude === 'number'
            ? ([latitude, longitude] satisfies ymaps.Coordinates)
            : null,
        )
        .filter((point): point is ymaps.Coordinates => point !== null),
    )
    .filter((ring) => ring.length >= 3)
}

function getRouteCoordinates(
  route: Route,
  displayMode: 'roads' | 'lines',
  routePreview: RoutePreview | null,
  routePreviewRoadCoordinates?: ymaps.Coordinates[],
): ymaps.Coordinates[] {
  if (
    routePreview?.routeId === route.id &&
    routePreview.points.length > 1
  ) {
    if (
      displayMode === 'roads' &&
      routePreviewRoadCoordinates &&
      routePreviewRoadCoordinates.length > 1
    ) {
      return routePreviewRoadCoordinates
    }

    return routePreview.points.map((point) => [point.latitude, point.longitude])
  }

  if (displayMode === 'roads' && route.polyline.length > 1) {
    return route.polyline.map((point) => [point.latitude, point.longitude])
  }

  return [...route.routePoints]
    .sort((a, b) => a.sequence - b.sequence)
    .filter(
      (
        point,
      ): point is typeof point & {
        deliveryLatitude: number
        deliveryLongitude: number
      } =>
        point.deliveryLatitude !== null && point.deliveryLongitude !== null,
    )
    .map((point) => [point.deliveryLatitude, point.deliveryLongitude])
}

function getPreviewCoordinates(
  routePreview: RoutePreview | null,
): ymaps.Coordinates[] {
  if (!routePreview || routePreview.routeId !== null || routePreview.points.length < 2) {
    return []
  }

  return routePreview.points.map((point) => [point.latitude, point.longitude])
}

function buildOrderBalloon(order: Order): string {
  const displayId = escapeHtml(getOrderDisplayId(order))
  const address = escapeHtml(order.deliveryAddress)
  const status = escapeHtml(getStatusLabel(order.status))
  const customer = escapeHtml(order.customerName ?? i18n.t('map.balloon.noCustomer'))
  const time = escapeHtml(
    formatDeliveryWindow(
      order.scheduledDate,
      order.timeWindowFrom,
      order.timeWindowTo,
    ),
  )

  return `
    <strong>${displayId}</strong>
    <br />${address}
    <br /><small>${status} · ${customer} · ${time}</small>
  `
}

function buildZoneBalloon(zone: Zone): string {
  const rate = zone.baseRate
    ? `${escapeHtml(zone.baseRate)} ₽`
    : i18n.t('map.balloon.noBaseRate')

  return `
    <strong>${escapeHtml(zone.name)}</strong>
    <br /><small>${rate}</small>
  `
}

function buildRouteBalloon(route: Route): string {
  const orderCount = route.routePoints.length
  const distance =
    route.totalDistanceMeters === null
      ? i18n.t('map.balloon.distanceUnknown')
      : `${Math.round(route.totalDistanceMeters / 100) / 10} км`

  return `
    <strong>${escapeHtml(i18n.t('map.balloon.routeVersion', { version: route.version }))}</strong>
    <br /><small>${escapeHtml(route.status)} · ${orderCount} · ${distance}</small>
  `
}

function buildCourierBalloon(courier: Courier): string {
  const name = `${courier.firstName} ${courier.lastName ?? ''}`.trim()
  const lastSeen = courier.lastSeenAt
    ? new Date(courier.lastSeenAt).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
    : i18n.t('map.balloon.noGpsTimestamp')

  return `
    <strong>${escapeHtml(name)}</strong>
    <br /><small>${escapeHtml(courier.status)} · ${escapeHtml(lastSeen)}</small>
  `
}

function hasModifierKeyFromYandexEvent(event: unknown): boolean {
  if (!isYandexEvent(event)) return false

  const domEvent = event.get('domEvent')
  if (hasModifierKey(domEvent)) return true

  if (isRecord(domEvent) && hasModifierKey(domEvent['originalEvent'])) {
    return true
  }

  return false
}

function getClientPointFromYandexEvent(event: unknown): ClientPoint | null {
  if (!isYandexEvent(event)) return null

  const domEvent = event.get('domEvent')
  return readClientPoint(domEvent) ?? readClientPointFromRecord(domEvent)
}

function readClientPointFromRecord(value: unknown): ClientPoint | null {
  if (!isRecord(value)) return null
  return readClientPoint(value['originalEvent'])
}

function readClientPoint(value: unknown): ClientPoint | null {
  if (!isRecord(value)) return null

  const clientX = value['clientX']
  const clientY = value['clientY']

  if (typeof clientX !== 'number' || typeof clientY !== 'number') {
    return null
  }

  return { clientX, clientY }
}

function isRouteDropTargetAtPoint(point: ClientPoint): boolean {
  const element = document.elementFromPoint(point.clientX, point.clientY)
  return Boolean(element?.closest(ROUTE_DROP_TARGET_SELECTOR))
}

function resetPlacemarkCoordinates(
  placemark: ymaps.Placemark,
  coords: ymaps.Coordinates,
): void {
  const geometry = placemark.geometry as
    | { setCoordinates?: (coordinates: ymaps.Coordinates) => void }
    | null
    | undefined

  geometry?.setCoordinates?.(coords)
}

function isYandexEvent(value: unknown): value is { get(key: string): unknown } {
  return isRecord(value) && typeof value['get'] === 'function'
}

function hasModifierKey(value: unknown): boolean {
  return (
    isRecord(value) &&
    (value['ctrlKey'] === true || value['metaKey'] === true)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[char] ?? char
  })
}
