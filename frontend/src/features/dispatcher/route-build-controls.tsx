import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import i18n from '@/i18n'
import { QUERY_KEYS } from '@/api/query-keys'
import type { ApiError } from '@/api/http-client'
import type { Order, OrderStatus, Route } from '@/api'
import { useBuildRoutes, useOrders } from '@/hooks'
import {
  getOrderDisplayId,
  orderMatchesSearch,
  orderMatchesTimeRange,
} from '@/lib/order-utils'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store'

const ROUTABLE_STATUSES: readonly OrderStatus[] = [
  'new',
  'confirmed',
  'assigned',
  'handed_over',
  'in_transit',
]

export function RouteBuildControls(): React.ReactElement {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const {
    selectedDate,
    selectedOrderId,
    searchQuery,
    statusFilter,
    startTimeFilter,
    endTimeFilter,
    setRoutesLayer,
    setSelectedRouteId,
  } = useUiStore()

  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
  } = useOrders({
    date: selectedDate,
    status: statusFilter ?? undefined,
  })
  const buildRouteMutation = useBuildRoutes()

  const routeOrders = prioritizeSelectedOrder(
    orders.filter((order) => {
      const matchesSearch = orderMatchesSearch(order, searchQuery)
      const matchesTimeRange = orderMatchesTimeRange(
        order,
        startTimeFilter,
        endTimeFilter,
      )

      return matchesSearch && matchesTimeRange && isRoutableOrder(order)
    }),
    selectedOrderId,
  )
  const orderIds = routeOrders.map((order) => order.id)
  const selectedOrder = routeOrders.find((order) => order.id === selectedOrderId)
  const canBuildRoute = orderIds.length >= 2 && !buildRouteMutation.isPending

  function handleBuildRoute(): void {
    if (!canBuildRoute) return

    buildRouteMutation.mutate(
      {
        orderIds,
        routeDate: `${selectedDate}T09:00:00.000Z`,
        mode: 'driving',
        optimizeWaypoints: true,
        returnToStart: false,
        metadata: {
          source: 'dispatcher-map',
          selectedOrderId,
        },
      },
      {
        onSuccess: (route) => {
          setRoutesLayer(true)
          setSelectedRouteId(route.id)
          queryClient.setQueryData<Route[]>(
            QUERY_KEYS.routes.list({ date: selectedDate }),
            (currentRoutes = []) => [
              route,
              ...currentRoutes.filter((item) => item.id !== route.id),
            ],
          )
        },
      },
    )
  }

  if (isLoading) {
    return (
      <RouteBuildShell>
        <div className="space-y-2">
          <div className="h-3 w-28 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-full rounded-lg bg-muted animate-pulse" />
        </div>
      </RouteBuildShell>
    )
  }

  if (isError) {
    return (
      <RouteBuildShell>
        <p className="text-xs font-medium text-foreground">{t('routes.unavailable')}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
        >
          {t('routes.reloadOrders')}
        </button>
      </RouteBuildShell>
    )
  }

  return (
    <RouteBuildShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t('routes.builderTitle')}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {t('routes.ordersReady', { count: orderIds.length })}
          </p>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">
          {t('routes.auto')}
        </span>
      </div>

      <button
        type="button"
        onClick={handleBuildRoute}
        disabled={!canBuildRoute}
        className={cn(
          'mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          canBuildRoute
            ? 'bg-primary text-primary-foreground shadow-sm hover:translate-y-[-1px] hover:shadow-md'
            : 'cursor-not-allowed bg-muted text-muted-foreground',
        )}
      >
        {buildRouteMutation.isPending ? t('routes.building') : t('routes.build')}
      </button>

      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        {t('routes.autoHint')}
        {selectedOrder
          ? ` ${t('routes.startsWith', { id: getOrderDisplayId(selectedOrder) })}`
          : ''}
      </p>

      {orderIds.length < 2 && (
        <p className="mt-2 rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-700">
          {t('routes.minOrders')}
        </p>
      )}

      {buildRouteMutation.isSuccess && (
        <p className="mt-2 rounded-md bg-green-500/10 px-2 py-1.5 text-[11px] text-green-700">
          {t('routes.builtSuccess')}
        </p>
      )}

      {buildRouteMutation.isError && (
        <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
          {getRouteBuildError(buildRouteMutation.error)}
        </p>
      )}
    </RouteBuildShell>
  )
}

function RouteBuildShell({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return <section className="p-3">{children}</section>
}

function isRoutableOrder(order: Order): boolean {
  return ROUTABLE_STATUSES.includes(order.status)
}

function prioritizeSelectedOrder(
  orders: Order[],
  selectedOrderId: string | null,
): Order[] {
  if (!selectedOrderId) return orders

  const selectedOrder = orders.find((order) => order.id === selectedOrderId)
  if (!selectedOrder) return orders

  return [
    selectedOrder,
    ...orders.filter((order) => order.id !== selectedOrderId),
  ]
}

function getRouteBuildError(error: unknown): string {
  if (isAxiosError<ApiError>(error)) {
    const message = error.response?.data?.message as unknown
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string' && message.length > 0) return message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return i18n.t('routes.buildFailed')
}
