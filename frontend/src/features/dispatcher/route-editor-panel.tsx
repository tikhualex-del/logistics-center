import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/api/query-keys'
import type { ApiError } from '@/api/http-client'
import type { Courier, Order, Route, RoutePoint } from '@/api'
import {
  useCouriers,
  useDeleteRoute,
  useOrders,
  useRoutes,
  useUpdateRoute,
} from '@/hooks'
import { getOrderDisplayId, getStatusLabel } from '@/lib/order-utils'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store'

const EDITABLE_ROUTE_STATUSES = ['draft', 'planned'] as const

export function RouteEditorPanel(): React.ReactElement {
  const { t } = useTranslation()
  const selectedDate = useUiStore((state) => state.selectedDate)
  const selectedRouteId = useUiStore((state) => state.selectedRouteId)
  const setSelectedRouteId = useUiStore((state) => state.setSelectedRouteId)

  const {
    data: routes = [],
    isLoading,
    isError,
    refetch,
  } = useRoutes({ date: selectedDate })
  const { data: orders = [] } = useOrders({ date: selectedDate })
  const { data: couriers = [] } = useCouriers()

  const selectedRoute =
    selectedRouteId === null
      ? null
      : routes.find((route) => route.id === selectedRouteId) ?? null

  if (isLoading) {
    return (
      <RouteEditorShell>
        <div className="space-y-2">
          <div className="h-3 w-32 rounded-full bg-muted animate-pulse" />
          <div className="h-20 rounded-xl bg-muted animate-pulse" />
        </div>
      </RouteEditorShell>
    )
  }

  if (isError) {
    return (
      <RouteEditorShell>
        <p className="text-xs font-semibold text-foreground">{t('routes.editor.unavailable')}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
        >
          {t('routes.editor.reloadRoutes')}
        </button>
      </RouteEditorShell>
    )
  }

  if (!selectedRoute) {
    return (
      <RoutePicker
        routes={routes}
        couriers={couriers}
        selectedDate={selectedDate}
        onSelectRoute={setSelectedRouteId}
      />
    )
  }

  return (
    <RouteEditorForm
      key={`${selectedRoute.id}:${selectedRoute.version}`}
      route={selectedRoute}
      routes={routes}
      orders={orders}
      selectedDate={selectedDate}
      onSelectRoute={setSelectedRouteId}
    />
  )
}

function RoutePicker({
  routes,
  couriers,
  selectedDate,
  onSelectRoute,
}: {
  routes: Route[]
  couriers: Courier[]
  selectedDate: string
  onSelectRoute: (id: string) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const couriersById = new Map(couriers.map((courier) => [courier.id, courier]))

  return (
    <RouteEditorShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t('routes.editor.title')}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {t('routes.editor.selectRoute')}
          </p>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">
          {selectedDate}
        </span>
      </div>

      {routes.length === 0 ? (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-[11px] text-muted-foreground">
          {t('routes.editor.emptyHint')}
        </p>
      ) : (
        <div className="mt-3 space-y-1.5">
          {routes.map((route) => (
            <button
              key={route.id}
              type="button"
              onClick={() => onSelectRoute(route.id)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-accent"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {formatRouteTitle(route)}
                </span>
                <RouteStatusBadge route={route} />
              </span>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                {t('routes.editor.ordersCount', { count: route.routePoints.length })} · {formatRouteDistance(route)}
                {' · '}
                {formatAssignedCourier(route, couriersById)}
              </span>
            </button>
          ))}
        </div>
      )}
    </RouteEditorShell>
  )
}

function RouteEditorForm({
  route,
  routes,
  orders,
  selectedDate,
  onSelectRoute,
}: {
  route: Route
  routes: Route[]
  orders: Order[]
  selectedDate: string
  onSelectRoute: (id: string | null) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const updateRouteMutation = useUpdateRoute()
  const deleteRouteMutation = useDeleteRoute()
  const initialOrderIds = getRouteOrderIds(route)
  const initialCourierId = route.courierId ?? ''
  const [draftOrderIds, setDraftOrderIds] = useState<string[]>(() => initialOrderIds)
  const [localMessage, setLocalMessage] = useState<string | null>(null)
  const isEditable = isEditableRoute(route)
  const hasPointChanges = !areOrderIdsEqual(initialOrderIds, draftOrderIds)
  const hasChanges = hasPointChanges
  const isRouteMutationPending =
    updateRouteMutation.isPending || deleteRouteMutation.isPending
  const canSave =
    isEditable &&
    hasChanges &&
    draftOrderIds.length > 0 &&
    !isRouteMutationPending
  const canDelete = isEditable && !isRouteMutationPending

  const ordersById = new Map(orders.map((order) => [order.id, order]))
  const routePointsByOrderId = new Map(
    route.routePoints.map((point) => [point.orderId, point]),
  )

  function handleDragStart(
    event: React.DragEvent<HTMLDivElement>,
    orderId: string,
  ): void {
    event.dataTransfer.setData('routeOrderId', orderId)
    event.dataTransfer.setData('application/x-route-order-id', orderId)
    event.dataTransfer.setData('orderId', orderId)
    event.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(event: React.DragEvent<HTMLElement>): void {
    if (!isEditable) return

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function handleDropOnPoint(
    event: React.DragEvent<HTMLElement>,
    targetOrderId: string,
  ): void {
    event.preventDefault()
    if (!isEditable) return

    const payload = readDraggedOrder(event)
    if (!payload.orderId) return

    setDraftOrderIds((currentOrderIds) =>
      applyDraggedOrder(currentOrderIds, payload, targetOrderId),
    )
    setLocalMessage(t('routes.editor.pointsChanged'))
  }

  function handleDropAtEnd(event: React.DragEvent<HTMLElement>): void {
    event.preventDefault()
    if (!isEditable) return

    const payload = readDraggedOrder(event)
    if (!payload.orderId) return

    setDraftOrderIds((currentOrderIds) =>
      applyDraggedOrder(currentOrderIds, payload, null),
    )
    setLocalMessage(t('routes.editor.pointsChanged'))
  }

  function handleRemovePoint(orderId: string): void {
    if (!isEditable) return

    setDraftOrderIds((currentOrderIds) =>
      currentOrderIds.filter((currentOrderId) => currentOrderId !== orderId),
    )
    setLocalMessage(t('routes.editor.pointRemoved'))
  }

  function handleReset(): void {
    setDraftOrderIds(initialOrderIds)
    setLocalMessage(null)
  }

  function handleSave(): void {
    if (!canSave) return

    updateRouteMutation.mutate(
      {
        id: route.id,
        data: {
          ...(hasPointChanges ? { orderIds: draftOrderIds } : {}),
          courierId: initialCourierId.length > 0 ? initialCourierId : null,
          optimizeWaypoints: false,
        },
      },
      {
        onSuccess: (updatedRoute) => {
          onSelectRoute(updatedRoute.id)
          queryClient.setQueryData<Route[]>(
            QUERY_KEYS.routes.list({ date: selectedDate }),
            (currentRoutes = []) => [
              updatedRoute,
              ...currentRoutes.filter((item) => item.id !== updatedRoute.id),
            ],
          )
        },
      },
    )
  }

  function handleDeleteRoute(): void {
    if (!canDelete) return

    const shouldDelete = window.confirm(t('routes.editor.deleteRouteConfirm'))
    if (!shouldDelete) return

    deleteRouteMutation.mutate(route.id, {
      onSuccess: (deletedRoute) => {
        onSelectRoute(null)
        queryClient.setQueryData<Route[]>(
          QUERY_KEYS.routes.list({ date: selectedDate }),
          (currentRoutes = []) =>
            currentRoutes.filter((item) => item.id !== deletedRoute.id),
        )
      },
    })
  }

  return (
    <RouteEditorShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t('routes.editor.title')}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {formatRouteTitle(route)}
          </p>
        </div>
        <RouteStatusBadge route={route} />
      </div>

      {routes.length > 1 && (
        <label className="mt-3 block">
          <span className="sr-only">{t('routes.editor.selectRouteLabel')}</span>
          <select
            value={route.id}
            onChange={(event) => onSelectRoute(event.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {routes.map((routeOption) => (
              <option key={routeOption.id} value={routeOption.id}>
                {formatRouteTitle(routeOption)} · {t('routes.editor.ordersCount', { count: routeOption.routePoints.length })}
              </option>
            ))}
          </select>
        </label>
      )}

      {!isEditable && (
        <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700">
          {t('routes.editor.onlyDraftEditable')}
        </p>
      )}

      <div
        onDragOver={handleDragOver}
        onDrop={handleDropAtEnd}
        className={cn(
          'mt-3 rounded-xl border border-dashed p-2 transition-colors',
          isEditable
            ? 'border-primary/30 bg-primary/5'
            : 'border-border bg-muted/40',
        )}
      >
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            {t('routes.editor.dragHint')}
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {draftOrderIds.length}
          </span>
        </div>

        <div className="max-h-[42vh] space-y-1.5 overflow-y-auto pr-1">
          {draftOrderIds.length === 0 ? (
            <p className="rounded-lg bg-background px-3 py-4 text-center text-[11px] text-muted-foreground">
              {t('routes.editor.dropHere')}
            </p>
          ) : (
            draftOrderIds.map((orderId, index) => {
              const summary = getPointSummary(
                orderId,
                ordersById,
                routePointsByOrderId,
              )

              return (
                <div
                  key={orderId}
                  draggable={isEditable}
                  onDragStart={(event) => handleDragStart(event, orderId)}
                  onDragOver={handleDragOver}
                  onDrop={(event) => handleDropOnPoint(event, orderId)}
                  className={cn(
                    'group rounded-lg border border-border bg-card px-3 py-2 shadow-sm transition-all',
                    isEditable
                      ? 'cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md'
                      : 'opacity-80',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-foreground">
                          {summary.displayId}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {summary.status}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {summary.address}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(orderId)}
                      disabled={!isEditable}
                      className="shrink-0 rounded-md px-1.5 py-1 text-[11px] font-semibold text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none group-hover:opacity-100"
                      aria-label={t('routes.editor.removeFromRoute', { id: summary.displayId })}
                    >
                      {t('routes.editor.remove')}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {draftOrderIds.length === 0 && (
        <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
          {t('routes.editor.mustHaveOrder')}
        </p>
      )}

      {localMessage && !updateRouteMutation.isError && !deleteRouteMutation.isError && (
        <p className="mt-2 rounded-md bg-blue-500/10 px-2 py-1.5 text-[11px] text-blue-700">
          {localMessage}
        </p>
      )}

      {updateRouteMutation.isError && (
        <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
          {getRouteMutationError(
            updateRouteMutation.error,
            t('routes.editor.updateFailed'),
          )}
        </p>
      )}

      {deleteRouteMutation.isError && (
        <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
          {getRouteMutationError(
            deleteRouteMutation.error,
            t('routes.editor.deleteFailed'),
          )}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasChanges || isRouteMutationPending}
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('common.reset')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            'rounded-lg px-3 py-2 text-xs font-semibold transition-all',
            canSave
              ? 'bg-primary text-primary-foreground shadow-sm hover:translate-y-[-1px] hover:shadow-md'
              : 'cursor-not-allowed bg-muted text-muted-foreground',
          )}
        >
          {updateRouteMutation.isPending ? t('common.saving') : t('routes.editor.save')}
        </button>
      </div>
      <button
        type="button"
        onClick={handleDeleteRoute}
        disabled={!canDelete}
        className="mt-2 w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleteRouteMutation.isPending
          ? t('routes.editor.deletingRoute')
          : t('routes.editor.deleteRoute')}
      </button>
    </RouteEditorShell>
  )
}

function RouteEditorShell({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return <section className="p-3">{children}</section>
}

function RouteStatusBadge({ route }: { route: Route }): React.ReactElement {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-1 text-[10px] font-semibold leading-none',
        isEditableRoute(route)
          ? 'bg-blue-500/10 text-blue-700'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {humanizeStatus(route.status)}
    </span>
  )
}

function isEditableRoute(route: Route): boolean {
  return EDITABLE_ROUTE_STATUSES.includes(
    route.status as (typeof EDITABLE_ROUTE_STATUSES)[number],
  )
}

function getRouteOrderIds(route: Route): string[] {
  return [...route.routePoints]
    .sort((a, b) => a.sequence - b.sequence)
    .map((point) => point.orderId)
}

function areOrderIdsEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function readDraggedOrder(event: React.DragEvent<HTMLElement>): {
  orderId: string | null
  isRoutePoint: boolean
} {
  const routeOrderId =
    event.dataTransfer.getData('application/x-route-order-id') ||
    event.dataTransfer.getData('routeOrderId')
  const orderId =
    routeOrderId ||
    event.dataTransfer.getData('application/x-order-id') ||
    event.dataTransfer.getData('orderId') ||
    event.dataTransfer.getData('text/plain')

  return {
    orderId: orderId || null,
    isRoutePoint: routeOrderId.length > 0,
  }
}

function applyDraggedOrder(
  currentOrderIds: string[],
  payload: { orderId: string | null; isRoutePoint: boolean },
  targetOrderId: string | null,
): string[] {
  if (!payload.orderId) return currentOrderIds

  const withoutDragged = payload.isRoutePoint
    ? currentOrderIds.filter((orderId) => orderId !== payload.orderId)
    : currentOrderIds

  if (!payload.isRoutePoint && currentOrderIds.includes(payload.orderId)) {
    return currentOrderIds
  }

  const targetIndex =
    targetOrderId === null
      ? withoutDragged.length
      : withoutDragged.findIndex((orderId) => orderId === targetOrderId)
  const safeTargetIndex = targetIndex === -1 ? withoutDragged.length : targetIndex

  return [
    ...withoutDragged.slice(0, safeTargetIndex),
    payload.orderId,
    ...withoutDragged.slice(safeTargetIndex),
  ]
}

function getPointSummary(
  orderId: string,
  ordersById: Map<string, Order>,
  routePointsByOrderId: Map<string, RoutePoint>,
): {
  displayId: string
  address: string
  status: string
} {
  const order = ordersById.get(orderId)
  if (order) {
    return {
      displayId: getOrderDisplayId(order),
      address: order.deliveryAddress,
      status: getStatusLabel(order.status),
    }
  }

  const routePoint = routePointsByOrderId.get(orderId)
  return {
    displayId: `#${orderId.slice(-8).toUpperCase()}`,
    address: routePoint?.deliveryAddress ?? 'Unknown address',
    status: routePoint ? humanizeStatus(routePoint.orderStatus) : 'Unknown',
  }
}

function formatRouteTitle(route: Route): string {
  return `Route #${route.id.slice(-6).toUpperCase()} · v${route.version}`
}

function formatRouteDistance(route: Route): string {
  if (route.totalDistanceMeters === null) return 'distance unknown'

  return `${Math.round(route.totalDistanceMeters / 100) / 10} km`
}

function formatAssignedCourier(
  route: Route,
  couriersById: Map<string, Courier>,
): string {
  if (!route.courierId) return 'unassigned'

  const courier = couriersById.get(route.courierId)
  return courier ? formatCourierName(courier) : 'assigned courier'
}

function formatCourierName(courier: Courier): string {
  return `${courier.firstName} ${courier.lastName ?? ''}`.trim()
}

function humanizeStatus(status: string): string {
  return status.replaceAll('_', ' ')
}

function getRouteMutationError(error: unknown, fallbackMessage: string): string {
  if (isAxiosError<ApiError>(error)) {
    const message = error.response?.data?.message as unknown
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string' && message.length > 0) return message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}
