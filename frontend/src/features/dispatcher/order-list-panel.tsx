import { useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Route as RouteIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { QUERY_KEYS } from '@/api/query-keys'
import type { ApiError } from '@/api/http-client'
import type { Order, OrderStatus, Route } from '@/api'
import { useBuildRoutes, useOrders } from '@/hooks'
import { useUiStore } from '@/store'
import {
  orderMatchesSearch,
  orderMatchesTimeRange,
} from '@/lib/order-utils'
import { OrderCard } from './order-card'

const ROUTABLE_STATUSES: readonly OrderStatus[] = [
  'new',
  'confirmed',
  'assigned',
  'handed_over',
  'in_transit',
]

function IconChevron({ open }: { open: boolean }): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={open ? '' : 'rotate-180'}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function OrderListPanel({
  onRouteBuilt,
}: {
  onRouteBuilt?: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const {
    selectedDate,
    searchQuery,
    statusFilter,
    startTimeFilter,
    endTimeFilter,
    selectedOrderIds,
    clearOrderSelection,
    selectOrder,
    setRoutesLayer,
    setSelectedRouteId,
  } = useUiStore()
  const buildRouteMutation = useBuildRoutes()

  const { data, isLoading, isError, refetch } = useOrders({
    date: selectedDate,
    status: statusFilter ?? undefined,
  })

  const visibleOrders = useMemo(() => {
    const orders = data ?? []

    return orders.filter((order) => {
      const matchesSearch = orderMatchesSearch(order, searchQuery)
      const matchesTimeRange = orderMatchesTimeRange(
        order,
        startTimeFilter,
        endTimeFilter,
      )

      return matchesSearch && matchesTimeRange
    })
  }, [data, searchQuery, startTimeFilter, endTimeFilter])

  const selectedOrderIdSet = useMemo(
    () => new Set(selectedOrderIds),
    [selectedOrderIds],
  )
  const orderedVisibleOrders = useMemo(
    () => prioritizeSelectedOrders(visibleOrders, selectedOrderIds),
    [visibleOrders, selectedOrderIds],
  )
  const selectedCount = selectedOrderIds.length
  const buildableSelectedOrderIds = useMemo(
    () =>
      visibleOrders
        .filter(
          (order) =>
            selectedOrderIdSet.has(order.id) && isRoutableOrder(order),
        )
        .map((order) => order.id),
    [selectedOrderIdSet, visibleOrders],
  )
  const canBuildSelectedRoute =
    buildableSelectedOrderIds.length >= 2 &&
    !buildRouteMutation.isPending &&
    onRouteBuilt !== undefined
  const panelOffset = isOpen ? '20rem' : '0rem'

  function handleBuildSelectedRoute(): void {
    if (!canBuildSelectedRoute) return

    buildRouteMutation.mutate(
      {
        orderIds: buildableSelectedOrderIds,
        routeDate: `${selectedDate}T09:00:00.000Z`,
        mode: 'driving',
        optimizeWaypoints: true,
        returnToStart: false,
        metadata: {
          source: 'dispatcher-order-list-selected',
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
          onRouteBuilt?.()
        },
      },
    )
  }

  return (
    <div className="pointer-events-none absolute bottom-[22rem] right-1.5 top-[4.5rem] z-30">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={[
          'pointer-events-auto absolute top-1/2 z-10 flex h-24 w-10 -translate-y-1/2 items-center justify-center border border-violet-500/70 bg-slate-950 text-violet-100 shadow-lg shadow-violet-950/30 backdrop-blur transition-[right,background-color,color] duration-200 hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500',
          isOpen ? 'rounded-l-2xl border-r-0' : 'rounded-2xl',
        ].join(' ')}
        style={{ right: panelOffset }}
        aria-controls="dispatcher-order-list-panel"
        aria-expanded={isOpen}
        aria-label={isOpen ? t('common.close') : t('orders.title')}
        title={isOpen ? t('common.close') : t('orders.title')}
      >
        <IconChevron open={isOpen} />
      </button>

      <aside
        id="dispatcher-order-list-panel"
        className={[
          'pointer-events-auto absolute inset-y-0 right-0 flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl transition-transform duration-200 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+0.75rem)]',
        ].join(' ')}
        aria-hidden={!isOpen}
      >
        <div className="shrink-0 border-b border-slate-800 bg-slate-950 px-2.5 py-3">
          <div className="flex items-center justify-between gap-3 px-0.5">
            <span className="min-w-0 truncate text-xs font-bold text-slate-100">
              Выбрано: {selectedCount} {formatOrderCount(selectedCount)}
            </span>
            <button
              type="button"
              onClick={clearOrderSelection}
              disabled={selectedCount === 0}
              className="shrink-0 text-[11px] font-semibold text-violet-300 transition-colors hover:text-violet-100 disabled:cursor-not-allowed disabled:text-slate-600"
            >
              Очистить выбор
            </button>
          </div>

          <button
            type="button"
            onClick={handleBuildSelectedRoute}
            disabled={!canBuildSelectedRoute}
            className="mt-3 inline-flex h-10 w-full min-w-0 items-center overflow-hidden rounded-md border border-violet-400/30 bg-violet-600 text-xs font-bold text-white shadow-lg shadow-violet-950/30 transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
            title={
              buildableSelectedOrderIds.length < 2
                ? 'Выберите минимум 2 активных заказа'
                : 'Построить маршрут из выбранных заказов'
            }
          >
            <span className="grid h-full w-9 place-items-center border-r border-violet-300/20 bg-violet-500/30">
              <RouteIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 truncate px-3 text-center">
              {buildRouteMutation.isPending
                ? 'Строим маршрут...'
                : 'Построить маршрут из выбранных'}
            </span>
            <span className="grid h-full w-8 place-items-center border-l border-violet-400/20 bg-violet-950/30 text-base leading-none">
              +
            </span>
          </button>

          {buildRouteMutation.isError && (
            <p className="mt-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {getRouteBuildError(buildRouteMutation.error)}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading && <OrderListSkeleton />}

          {!isLoading && isError && (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-400">{t('orders.loadError')}</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-2 text-xs text-violet-300 underline underline-offset-2 hover:no-underline"
              >
                {t('common.retry')}
              </button>
            </div>
          )}

          {!isLoading && !isError && visibleOrders.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-slate-400">{t('orders.emptyForDate')}</p>
              {(statusFilter || startTimeFilter || endTimeFilter || searchQuery) && (
                <p className="mt-1 text-xs text-slate-500">
                  {t('orders.tryClearFilters')}
                </p>
              )}
            </div>
          )}

          {!isLoading && !isError && orderedVisibleOrders.length > 0 && (
            <div className="space-y-1 p-1.5">
              {orderedVisibleOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isSelected={selectedOrderIdSet.has(order.id)}
                  onSelect={selectOrder}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

function isRoutableOrder(order: Order): boolean {
  return ROUTABLE_STATUSES.includes(order.status)
}

function getRouteBuildError(error: unknown): string {
  if (isAxiosError<ApiError>(error)) {
    const message = error.response?.data?.message as unknown
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string' && message.length > 0) {
      return humanizeRouteBuildError(message)
    }
  }

  if (error instanceof Error && error.message) {
    return humanizeRouteBuildError(error.message)
  }

  return 'Не удалось построить маршрут.'
}

function humanizeRouteBuildError(message: string): string {
  if (
    message.includes('already assigned to active route') ||
    message.includes('already assigned to route')
  ) {
    return 'Один из выбранных заказов уже добавлен в активный маршрут. Снимите его с выбора или откройте существующий маршрут.'
  }

  return message
}

function formatOrderCount(count: number): string {
  const lastTwoDigits = count % 100
  const lastDigit = count % 10

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'заказов'
  if (lastDigit === 1) return 'заказ'
  if (lastDigit >= 2 && lastDigit <= 4) return 'заказа'
  return 'заказов'
}

function prioritizeSelectedOrders<T extends { id: string }>(
  orders: T[],
  selectedOrderIds: string[],
): T[] {
  if (selectedOrderIds.length === 0) return orders

  const selectedOrderIndex = new Map(
    selectedOrderIds.map((orderId, index) => [orderId, index]),
  )

  return [...orders].sort((a, b) => {
    const aIndex = selectedOrderIndex.get(a.id)
    const bIndex = selectedOrderIndex.get(b.id)

    if (aIndex === undefined && bIndex === undefined) return 0
    if (aIndex === undefined) return 1
    if (bIndex === undefined) return -1

    return aIndex - bIndex
  })
}

function OrderListSkeleton(): React.ReactElement {
  return (
    <div className="space-y-1 p-1.5">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-[4.35rem] animate-pulse rounded-md border border-slate-800 bg-slate-900/70"
        />
      ))}
    </div>
  )
}
