import { useEffect, useRef } from 'react'
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

type MapObject =
  | ymaps.GeoObject
  | ymaps.Placemark
  | ymaps.Polygon
  | ymaps.Polyline

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
  _selectedOrderId: string | null,
  onSelectOrder: (id: string) => void,
): void {
  // Store callback in a ref to avoid re-running the effect when it changes
  const onSelectRef = useRef(onSelectOrder)

  useEffect(() => {
    onSelectRef.current = onSelectOrder
  }, [onSelectOrder])

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
        const placemark = new window.ymaps.Placemark(
          coords,
          {
            hintContent: getOrderDisplayId(order),
            balloonContent: buildOrderBalloon(order),
            iconContent: String(order.orderNumber ?? getOrderDisplayId(order)),
          },
          {
            preset: 'islands#redStretchyIcon',
          },
        )

        placemark.events.add('click', () => {
          onSelectRef.current(order.id)
          void map.setCenter(coords, Math.max(map.getZoom(), 12))
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
    // selectedOrderId intentionally excluded — it does not affect marker creation.
    // onSelectOrder stored in ref to keep deps stable.
  }, [map, orders])
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
  selectedRouteId: string | null,
  onSelectRoute: (id: string) => void,
): void {
  useEffect(() => {
    if (!map || !visible) return

    const polylines: ymaps.Polyline[] = []

    routes.forEach((route) => {
      const coordinates = getRouteCoordinates(route)
      if (coordinates.length < 2) return

      const isSelected = route.id === selectedRouteId
      const polyline = new window.ymaps.Polyline(
        coordinates,
        {
          hintContent: `Route ${route.version}`,
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
      polylines.push(polyline)
    })

    return () => {
      polylines.forEach((polyline) => {
        try {
          map.geoObjects.remove(polyline)
        } catch {
          // ignore Yandex Maps cleanup race conditions
        }
      })
    }
  }, [map, onSelectRoute, routes, selectedRouteId, visible])
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

function getRouteCoordinates(route: Route): ymaps.Coordinates[] {
  if (route.polyline.length > 1) {
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

function buildOrderBalloon(order: Order): string {
  const displayId = escapeHtml(getOrderDisplayId(order))
  const address = escapeHtml(order.deliveryAddress)
  const status = escapeHtml(getStatusLabel(order.status))
  const customer = escapeHtml(order.customerName ?? 'No customer')
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
  const rate = zone.baseRate ? `${escapeHtml(zone.baseRate)} RUB` : 'No base rate'

  return `
    <strong>${escapeHtml(zone.name)}</strong>
    <br /><small>${rate}</small>
  `
}

function buildRouteBalloon(route: Route): string {
  const orderCount = route.routePoints.length
  const distance =
    route.totalDistanceMeters === null
      ? 'distance unknown'
      : `${Math.round(route.totalDistanceMeters / 100) / 10} km`

  return `
    <strong>Route v${route.version}</strong>
    <br /><small>${escapeHtml(route.status)} · ${orderCount} orders · ${distance}</small>
  `
}

function buildCourierBalloon(courier: Courier): string {
  const name = `${courier.firstName} ${courier.lastName ?? ''}`.trim()
  const lastSeen = courier.lastSeenAt
    ? new Date(courier.lastSeenAt).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'no GPS timestamp'

  return `
    <strong>${escapeHtml(name)}</strong>
    <br /><small>${escapeHtml(courier.status)} · ${escapeHtml(lastSeen)}</small>
  `
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
