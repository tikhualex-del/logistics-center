import { useEffect } from 'react'
import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query'
import {
  disconnectSocket,
  getSocket,
  WS_EVENTS,
  type AlertNotificationPayload,
  type CourierLocationUpdatedPayload,
  type OrderStatusChangedPayload,
} from '@/api/socket-client'
import { QUERY_KEYS } from '@/api/query-keys'
import type { Courier, Order, OrderStatus } from '@/api'
import { useSocket } from '@/hooks'
import { useAuthStore, useUiStore } from '@/store'

const COURIER_STATUSES = [
  'inactive',
  'available',
  'busy',
  'offline',
  'suspended',
] as const

const ORDER_STATUSES = [
  'new',
  'confirmed',
  'assigned',
  'handed_over',
  'in_transit',
  'delivered',
  'undelivered',
  'returned',
  'cancelled',
] as const

const ALERT_NOTIFICATION_TYPES = [
  'new-order',
  'order-status-change',
  'route-change',
] as const

const ALERT_ENTITY_TYPES = ['order', 'route'] as const

/**
 * Mounts dispatcher realtime subscriptions.
 *
 * Dispatcher realtime scope:
 * - connect authenticated socket;
 * - keep route/order caches fresh;
 * - apply courier GPS payloads directly to cache so map markers move live.
 */
export function useDispatcherRealtime(): void {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return

    const socket = getSocket()
    if (!socket.connected) {
      socket.connect()
    }

    return () => {
      disconnectSocket()
    }
  }, [isAuthenticated])

  useSocket<unknown>(WS_EVENTS.ORDER_STATUS_CHANGED, (payload) => {
    if (!isOrderStatusChangedPayload(payload)) {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.all })
      return
    }

    updateOrderListCaches(queryClient, payload)
    updateOrderDetailCache(queryClient, payload)
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.all })
  })

  useSocket<unknown>(WS_EVENTS.ROUTE_UPDATED, () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.routes.all })
  })

  useSocket<unknown>(
    WS_EVENTS.COURIER_LOCATION_UPDATED,
    (payload) => {
      if (!isCourierLocationPayload(payload)) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.couriers.all })
        return
      }

      const didUpdateList = updateCourierListCache(queryClient, payload)
      updateCourierDetailCache(queryClient, payload)

      if (!didUpdateList) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.couriers.all })
      }
    },
  )

  useSocket<unknown>(WS_EVENTS.ALERT_NEW, (payload) => {
    const { incrementAlertCount, pushAlertToast } = useUiStore.getState()
    incrementAlertCount()

    if (isAlertNotificationPayload(payload)) {
      pushAlertToast(payload)
    }
  })
}

function updateCourierListCache(
  queryClient: QueryClient,
  payload: CourierLocationUpdatedPayload,
): boolean {
  const listKey = QUERY_KEYS.couriers.list()
  const currentCouriers = queryClient.getQueryData<Courier[]>(listKey)
  if (!currentCouriers) return false

  let didUpdate = false
  const nextCouriers = currentCouriers.map((courier) => {
    if (courier.id !== payload.courierId) return courier

    didUpdate = true
    return applyCourierLocation(courier, payload)
  })

  if (didUpdate) {
    queryClient.setQueryData(listKey, nextCouriers)
  }

  return didUpdate
}

function updateCourierDetailCache(
  queryClient: QueryClient,
  payload: CourierLocationUpdatedPayload,
): void {
  queryClient.setQueryData<Courier | undefined>(
    QUERY_KEYS.couriers.detail(payload.courierId),
    (currentCourier) =>
      currentCourier ? applyCourierLocation(currentCourier, payload) : currentCourier,
  )
}

function updateOrderListCaches(
  queryClient: QueryClient,
  payload: OrderStatusChangedPayload,
): void {
  const cachedLists = queryClient.getQueriesData<Order[]>({
    queryKey: QUERY_KEYS.orders.all,
  })

  cachedLists.forEach(([queryKey, currentOrders]) => {
    if (!Array.isArray(currentOrders)) return

    const filters = readOrderListFilters(queryKey)
    if (!filters) return

    let didTouchOrder = false
    const nextOrders = currentOrders
      .map((order) => {
        if (order.id !== payload.orderId) return order

        didTouchOrder = true
        return applyOrderStatusChange(order, payload)
      })
      .filter((order) => {
        if (!filters.status) return true
        return order.status === filters.status
      })

    if (didTouchOrder) {
      queryClient.setQueryData(queryKey, nextOrders)
    }
  })
}

function updateOrderDetailCache(
  queryClient: QueryClient,
  payload: OrderStatusChangedPayload,
): void {
  queryClient.setQueryData<Order | undefined>(
    QUERY_KEYS.orders.detail(payload.orderId),
    (currentOrder) =>
      currentOrder ? applyOrderStatusChange(currentOrder, payload) : currentOrder,
  )
}

function applyOrderStatusChange(
  order: Order,
  payload: OrderStatusChangedPayload,
): Order {
  return {
    ...order,
    status: payload.toStatus,
    orderNumber: payload.orderNumber,
    externalId: payload.externalId,
    deliveryAddress: payload.deliveryAddress,
    updatedAt: payload.timestamp,
  }
}

function readOrderListFilters(
  queryKey: QueryKey,
): { status?: OrderStatus } | null {
  if (queryKey[0] !== 'orders' || queryKey[1] !== 'list') return null

  const rawFilters = queryKey[2]
  if (typeof rawFilters !== 'object' || rawFilters === null) return {}

  const status = (rawFilters as Record<string, unknown>).status
  return isOrderStatus(status) ? { status } : {}
}

function applyCourierLocation(
  courier: Courier,
  payload: CourierLocationUpdatedPayload,
): Courier {
  return {
    ...courier,
    status: payload.status,
    isOnline: payload.status === 'available' || payload.status === 'busy',
    firstName: payload.firstName,
    lastName: payload.lastName,
    latitude: payload.latitude,
    longitude: payload.longitude,
    lastSeenAt: payload.lastSeenAt ?? payload.timestamp,
  }
}

function isCourierLocationPayload(
  value: unknown,
): value is CourierLocationUpdatedPayload {
  if (typeof value !== 'object' || value === null) return false

  const payload = value as Record<string, unknown>

  return (
    typeof payload.courierId === 'string' &&
    typeof payload.latitude === 'number' &&
    typeof payload.longitude === 'number' &&
    typeof payload.timestamp === 'string' &&
    typeof payload.firstName === 'string' &&
    (typeof payload.lastName === 'string' || payload.lastName === null) &&
    (typeof payload.lastSeenAt === 'string' || payload.lastSeenAt === null) &&
    typeof payload.status === 'string' &&
    COURIER_STATUSES.includes(
      payload.status as (typeof COURIER_STATUSES)[number],
    )
  )
}

function isOrderStatusChangedPayload(
  value: unknown,
): value is OrderStatusChangedPayload {
  if (typeof value !== 'object' || value === null) return false

  const payload = value as Record<string, unknown>

  return (
    typeof payload.orderId === 'string' &&
    typeof payload.timestamp === 'string' &&
    (typeof payload.orderNumber === 'string' || payload.orderNumber === null) &&
    (typeof payload.externalId === 'string' || payload.externalId === null) &&
    (typeof payload.reason === 'string' || payload.reason === null) &&
    typeof payload.deliveryAddress === 'string' &&
    isOrderStatus(payload.fromStatus) &&
    isOrderStatus(payload.toStatus)
  )
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === 'string' &&
    ORDER_STATUSES.includes(value as (typeof ORDER_STATUSES)[number])
  )
}

function isAlertNotificationPayload(
  value: unknown,
): value is AlertNotificationPayload {
  if (typeof value !== 'object' || value === null) return false

  const payload = value as Record<string, unknown>

  return (
    typeof payload.id === 'string' &&
    typeof payload.companyId === 'string' &&
    typeof payload.entityId === 'string' &&
    typeof payload.title === 'string' &&
    typeof payload.message === 'string' &&
    typeof payload.createdAt === 'string' &&
    typeof payload.data === 'object' &&
    payload.data !== null &&
    !Array.isArray(payload.data) &&
    typeof payload.type === 'string' &&
    ALERT_NOTIFICATION_TYPES.includes(
      payload.type as (typeof ALERT_NOTIFICATION_TYPES)[number],
    ) &&
    typeof payload.entityType === 'string' &&
    ALERT_ENTITY_TYPES.includes(
      payload.entityType as (typeof ALERT_ENTITY_TYPES)[number],
    )
  )
}
