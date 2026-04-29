import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/api/query-keys'
import type { ApiError } from '@/api/http-client'
import type { Courier, Order, OrderStatus, Route, RoutePoint } from '@/api'
import {
  useBuildRoutes,
  useCouriers,
  useOrders,
  useRoutes,
  useUpdateRoute,
} from '@/hooks'
import {
  getOrderDisplayId,
  getStatusLabel,
} from '@/lib/order-utils'
import { cn } from '@/lib/utils'
import type { RoutePreviewPoint } from '@/store'
import { useUiStore } from '@/store'
import { isMapOrderDropEvent, MAP_ORDER_DROP_EVENT } from './route-dnd'
import { ADD_SELECTED_ORDERS_TO_ROUTE_EVENT } from './route-list-events'

const ROUTABLE_STATUSES: readonly OrderStatus[] = [
  'new',
  'confirmed',
  'assigned',
  'handed_over',
  'in_transit',
]
const MIN_MANUAL_ROUTE_ORDERS = 2

type RouteSideTab = 'actions' | 'info' | 'couriers'
type ManualDraftActionsState = {
  addableSelectedOrderCount: number
  canAddSelected: boolean
  canCancel: boolean
  canSave: boolean
  isSaving: boolean
  onAddSelected: () => void
  onCancel: () => void
  onSave: () => void
}
type RouteDetailActionsState = {
  addableSelectedOrderCount: number
  canAddSelected: boolean
  canReset: boolean
  canSave: boolean
  canSendToMonitoring: boolean
  hasPointChanges: boolean
  isSaving: boolean
  isSendingToMonitoring: boolean
  onAddSelected: () => void
  onReset: () => void
  onSave: () => void
  onSendToMonitoring: () => void
}

export function RouteWorkspacePanel({
  canBuildRoutes,
  canEditRoutes,
}: {
  canBuildRoutes: boolean
  canEditRoutes: boolean
}): React.ReactElement {
  const queryClient = useQueryClient()
  const {
    selectedDate,
    selectedOrderId,
    selectedOrderIds,
    selectedRouteId,
    statusFilter,
    setRoutesLayer,
    setSelectedRouteId,
  } = useUiStore()
  const [newDraftOrderIds, setNewDraftOrderIds] = useState<string[] | null>(null)
  const [manualDraftActions, setManualDraftActions] =
    useState<ManualDraftActionsState | null>(null)
  const [routeDetailActions, setRouteDetailActions] =
    useState<RouteDetailActionsState | null>(null)

  const {
    data: routes = [],
    isLoading: routesLoading,
    isError: routesError,
    refetch: refetchRoutes,
  } = useRoutes({ date: selectedDate })
  const { data: couriers = [] } = useCouriers()
  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useOrders({
    date: selectedDate,
    status: statusFilter ?? undefined,
  })
  const createRouteMutation = useBuildRoutes()
  const updateRouteMutation = useUpdateRoute()
  const createRoute = createRouteMutation.mutate
  const isCreatingRoute = createRouteMutation.isPending
  const createRouteError = createRouteMutation.error
  const updateRoute = updateRouteMutation.mutate
  const isUpdatingRoute = updateRouteMutation.isPending
  const updateRouteError = updateRouteMutation.error

  const couriersById = useMemo(
    () => new Map(couriers.map((courier) => [courier.id, courier])),
    [couriers],
  )
  const ordersById = useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders],
  )
  const selectedOrders = useMemo(
    () =>
      getSelectedOrders(
        ordersById,
        selectedOrderIds,
        selectedOrderId,
      ),
    [ordersById, selectedOrderId, selectedOrderIds],
  )
  const activeRouteOrderIds = useMemo(
    () => getActiveRouteOrderIds(routes),
    [routes],
  )
  const selectedAvailableOrderIds = useMemo(
    () =>
      selectedOrders
        .filter(
          (order) =>
            isRoutableOrder(order) && !activeRouteOrderIds.has(order.id),
        )
        .map((order) => order.id),
    [activeRouteOrderIds, selectedOrders],
  )
  const visibleRoutes = routes
  const selectedRoute =
    selectedRouteId === null
      ? null
      : routes.find((route) => route.id === selectedRouteId) ?? null
  const isNewDraftOpen = newDraftOrderIds !== null
  const canCreateFromSelection =
    canBuildRoutes &&
    selectedAvailableOrderIds.length >= MIN_MANUAL_ROUTE_ORDERS &&
    !isCreatingRoute
  const updateRoutesCache = useCallback((updatedRoute: Route): void => {
    queryClient.setQueryData<Route[]>(
      QUERY_KEYS.routes.list({ date: selectedDate }),
      (currentRoutes = []) => [
        updatedRoute,
        ...currentRoutes.filter((item) => item.id !== updatedRoute.id),
      ],
    )
  }, [queryClient, selectedDate])

  const handleStartNewDraft = useCallback((): void => {
    if (!canBuildRoutes) return

    setSelectedRouteId(null)
    setNewDraftOrderIds(selectedAvailableOrderIds)
  }, [
    canBuildRoutes,
    selectedAvailableOrderIds,
    setSelectedRouteId,
  ])

  const handleCreateManualRoute = useCallback((orderIds: string[]): void => {
    if (!canBuildRoutes || orderIds.length < MIN_MANUAL_ROUTE_ORDERS) return

    createRoute(
      {
        orderIds,
        routeDate: `${selectedDate}T09:00:00.000Z`,
        mode: 'driving',
        optimizeWaypoints: false,
        returnToStart: false,
        metadata: {
          source: 'dispatcher-manual-route',
        },
      },
      {
        onSuccess: (route) => {
          setRoutesLayer(true)
          setNewDraftOrderIds(null)
          setSelectedRouteId(route.id)
          updateRoutesCache(route)
        },
      },
    )
  }, [
    canBuildRoutes,
    createRoute,
    selectedDate,
    setRoutesLayer,
    setSelectedRouteId,
    updateRoutesCache,
  ])

  const handleCancelNewDraft = useCallback((): void => {
    setNewDraftOrderIds(null)
  }, [])

  const handleSendToMonitoring = useCallback((route: Route): void => {
    if (!canEditRoutes || route.status !== 'draft') return

    updateRoute(
      {
        id: route.id,
        data: {
          status: 'planned',
        },
      },
      {
        onSuccess: (updatedRoute) => {
          setSelectedRouteId(updatedRoute.id)
          updateRoutesCache(updatedRoute)
        },
      },
    )
  }, [
    canEditRoutes,
    setSelectedRouteId,
    updateRoute,
    updateRoutesCache,
  ])

  const handleSelectListedRoute = useCallback((id: string): void => {
    setNewDraftOrderIds(null)
    setSelectedRouteId(id)
  }, [setSelectedRouteId])

  const handleAddSelectedFromOrderList = useCallback((): void => {
    if (manualDraftActions?.canAddSelected) {
      manualDraftActions.onAddSelected()
      return
    }

    if (routeDetailActions?.canAddSelected) {
      routeDetailActions.onAddSelected()
      return
    }

    handleStartNewDraft()
  }, [
    handleStartNewDraft,
    manualDraftActions,
    routeDetailActions,
  ])

  useEffect(() => {
    window.addEventListener(
      ADD_SELECTED_ORDERS_TO_ROUTE_EVENT,
      handleAddSelectedFromOrderList,
    )
    return () => {
      window.removeEventListener(
        ADD_SELECTED_ORDERS_TO_ROUTE_EVENT,
        handleAddSelectedFromOrderList,
      )
    }
  }, [handleAddSelectedFromOrderList])

  useEffect(() => {
    function handleMapOrderDrop(event: Event): void {
      if (
        !isMapOrderDropEvent(event) ||
        !canBuildRoutes ||
        selectedRoute !== null ||
        newDraftOrderIds !== null
      ) {
        return
      }

      const order = ordersById.get(event.detail.orderId)
      if (
        !order ||
        !isRoutableOrder(order) ||
        activeRouteOrderIds.has(order.id)
      ) {
        return
      }

      setSelectedRouteId(null)
      setNewDraftOrderIds((currentOrderIds) => {
        if (currentOrderIds?.includes(order.id)) return currentOrderIds
        return [...(currentOrderIds ?? []), order.id]
      })
    }

    window.addEventListener(MAP_ORDER_DROP_EVENT, handleMapOrderDrop)
    return () => {
      window.removeEventListener(MAP_ORDER_DROP_EVENT, handleMapOrderDrop)
    }
  }, [
    activeRouteOrderIds,
    canBuildRoutes,
    newDraftOrderIds,
    ordersById,
    selectedRoute,
    setSelectedRouteId,
  ])

  if (routesLoading || ordersLoading) {
    return (
      <div className="grid h-full grid-cols-[15rem_minmax(0,1fr)_17rem] gap-px bg-slate-800/70">
        <RouteSkeleton />
        <RouteSkeleton />
        <RouteSkeleton />
      </div>
    )
  }

  if (routesError || ordersError) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            РњР°СЂС€СЂСѓС‚С‹ РІСЂРµРјРµРЅРЅРѕ РЅРµРґРѕСЃС‚СѓРїРЅС‹
          </p>
          <button
            type="button"
            onClick={() => {
              void refetchRoutes()
              void refetchOrders()
            }}
            className="mt-3 rounded-lg border border-violet-500/50 px-4 py-2 text-xs font-semibold text-violet-100 transition-colors hover:bg-slate-900"
          >
            РџРѕРІС‚РѕСЂРёС‚СЊ Р·Р°РіСЂСѓР·РєСѓ
          </button>
        </div>
      </div>
    )
  }

  return (
    <section className="grid h-full min-h-0 grid-cols-[15rem_minmax(0,1fr)] overflow-hidden bg-slate-950 text-slate-100">
      <RouteListColumn
        routes={visibleRoutes}
        selectedRouteId={selectedRoute?.id ?? null}
        couriersById={couriersById}
        onSelectRoute={handleSelectListedRoute}
      />

      <div className="min-w-0 border-l border-slate-800">
        {isNewDraftOpen ? (
          <ManualDraftColumn
            key="new-manual-route"
            orders={orders}
            blockedOrderIds={activeRouteOrderIds}
            initialOrderIds={newDraftOrderIds}
            routeDate={`${selectedDate}T09:00:00.000Z`}
            selectedOrderIds={selectedAvailableOrderIds}
            isSaving={isCreatingRoute}
            saveError={createRouteError}
            canEdit={canBuildRoutes}
            onCancel={handleCancelNewDraft}
            onSave={handleCreateManualRoute}
            onActionsChange={setManualDraftActions}
          />
        ) : selectedRoute ? (
          <RouteDetailColumn
            key={`${selectedRoute.id}:${selectedRoute.version}`}
            route={selectedRoute}
            orders={orders}
            routes={routes}
            selectedDate={selectedDate}
            selectedOrderIds={selectedOrderIds}
            fallbackSelectedOrderId={selectedOrderId}
            canEditRoutes={canEditRoutes}
            couriers={couriers}
            isSendingToMonitoring={isUpdatingRoute}
            sendToMonitoringError={updateRouteError}
            onSelectRoute={setSelectedRouteId}
            onRouteUpdated={updateRoutesCache}
            onSendToMonitoring={handleSendToMonitoring}
            onActionsChange={setRouteDetailActions}
          />
        ) : (
          <EmptyRouteDetail
            canCreateRoute={canBuildRoutes}
            canCreateFromSelection={canCreateFromSelection}
            selectedAvailableCount={selectedAvailableOrderIds.length}
            onStartNewDraft={handleStartNewDraft}
          />
        )}
      </div>
    </section>
  )
}

function RouteListColumn({
  routes,
  selectedRouteId,
  couriersById,
  onSelectRoute,
}: {
  routes: Route[]
  selectedRouteId: string | null
  couriersById: Map<string, Courier>
  onSelectRoute: (id: string) => void
}): React.ReactElement {
  return (
    <aside className="flex min-h-0 flex-col border-r border-slate-900 p-3">
      <h3 className="text-sm font-bold">РњР°СЂС€СЂСѓС‚С‹</h3>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {routes.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4 text-xs text-slate-400">
            РњР°СЂС€СЂСѓС‚РѕРІ РїРѕРєР° РЅРµС‚.
          </p>
        ) : (
          routes.map((route) => (
            <button
              key={route.id}
              type="button"
              onClick={() => onSelectRoute(route.id)}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-left transition-colors',
                selectedRouteId === route.id
                  ? 'border-violet-500 bg-violet-600/15 shadow-[0_0_0_1px_rgba(139,92,246,0.12)]'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      getRouteStatusDotClass(route.status),
                    )}
                  />
                  <span className="truncate text-xs font-bold">
                    {formatRouteTitle(route)}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] text-slate-400">
                  {formatRouteDistance(route)}
                </span>
              </span>
              <span className="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                <span>{route.routePoints.length} С‚РѕС‡РµРє</span>
                <span className={getRouteStatusTextClass(route.status)}>
                  {humanizeStatus(route.status)}
                </span>
              </span>
              <span className="mt-1 block truncate text-[10px] text-slate-500">
                {formatAssignedCourier(route, couriersById)}
              </span>
            </button>
          ))
        )}
      </div>
      <button
        type="button"
        className="mt-3 h-9 rounded-md border border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-300 transition-colors hover:border-violet-500/60 hover:text-white"
      >
        + РќРѕРІС‹Р№ РјР°СЂС€СЂСѓС‚
      </button>
    </aside>
  )
}

function ManualDraftColumn({
  orders,
  blockedOrderIds,
  initialOrderIds,
  routeDate,
  selectedOrderIds,
  isSaving,
  saveError,
  canEdit,
  onCancel,
  onSave,
  onActionsChange,
}: {
  orders: Order[]
  blockedOrderIds: Set<string>
  initialOrderIds: string[]
  routeDate: string
  selectedOrderIds: string[]
  isSaving: boolean
  saveError: unknown
  canEdit: boolean
  onCancel: () => void
  onSave: (orderIds: string[]) => void
  onActionsChange: (actions: ManualDraftActionsState | null) => void
}): React.ReactElement {
  const setRoutePreview = useUiStore((state) => state.setRoutePreview)
  const clearRoutePreview = useUiStore((state) => state.clearRoutePreview)
  const [draftOrderIds, setDraftOrderIds] = useState<string[]>(() => initialOrderIds)
  const [localMessage, setLocalMessage] = useState<string | null>(null)
  const ordersById = useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders],
  )
  const routePreviewPoints = useMemo(
    () => getRoutePreviewPoints(draftOrderIds, ordersById, new Map()),
    [draftOrderIds, ordersById],
  )
  const canSave =
    canEdit &&
    draftOrderIds.length >= MIN_MANUAL_ROUTE_ORDERS &&
    !isSaving
  const addableSelectedOrderIds = useMemo(
    () =>
      selectedOrderIds.filter(
        (orderId) =>
          !draftOrderIds.includes(orderId) && !blockedOrderIds.has(orderId),
      ),
    [blockedOrderIds, draftOrderIds, selectedOrderIds],
  )

  useMapOrderDrop((orderId) => {
    if (!canEdit || blockedOrderIds.has(orderId)) return

    const order = ordersById.get(orderId)
    if (!order || !isRoutableOrder(order)) return

    setDraftOrderIds((currentOrderIds) => {
      if (currentOrderIds.includes(order.id)) return currentOrderIds
      return [...currentOrderIds, order.id]
    })
    setLocalMessage('Р—Р°РєР°Р· СЃ РєР°СЂС‚С‹ РґРѕР±Р°РІР»РµРЅ РІ С‡РµСЂРЅРѕРІРёРє.')
  })

  const handleAddSelected = useCallback((): void => {
    if (!canEdit || addableSelectedOrderIds.length === 0) return

    setDraftOrderIds((currentOrderIds) => [
      ...currentOrderIds,
      ...addableSelectedOrderIds,
    ])
    setLocalMessage('Р’С‹Р±СЂР°РЅРЅС‹Рµ Р·Р°РєР°Р·С‹ РґРѕР±Р°РІР»РµРЅС‹ РІ С‡РµСЂРЅРѕРІРёРє.')
  }, [addableSelectedOrderIds, canEdit])

  function handleDragOver(event: React.DragEvent<HTMLElement>): void {
    if (!canEdit) return

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function handleDropAtEnd(event: React.DragEvent<HTMLElement>): void {
    event.preventDefault()
    if (!canEdit) return

    const payload = readDraggedOrder(event)
    if (!payload.orderId || blockedOrderIds.has(payload.orderId)) return

    setDraftOrderIds((currentOrderIds) =>
      applyDraggedOrder(currentOrderIds, payload, null),
    )
    setLocalMessage('РўРѕС‡РєР° РґРѕР±Р°РІР»РµРЅР° РІ С‡РµСЂРЅРѕРІРёРє.')
  }

  function handleDropOnPoint(
    event: React.DragEvent<HTMLElement>,
    targetOrderId: string,
  ): void {
    event.preventDefault()
    if (!canEdit) return

    const payload = readDraggedOrder(event)
    if (!payload.orderId || blockedOrderIds.has(payload.orderId)) return

    setDraftOrderIds((currentOrderIds) =>
      applyDraggedOrder(currentOrderIds, payload, targetOrderId),
    )
    setLocalMessage('РџРѕСЂСЏРґРѕРє С‚РѕС‡РµРє РёР·РјРµРЅС‘РЅ.')
  }

  function handleDragStart(
    event: React.DragEvent<HTMLDivElement>,
    orderId: string,
  ): void {
    event.dataTransfer.setData('routeOrderId', orderId)
    event.dataTransfer.setData('application/x-route-order-id', orderId)
    event.dataTransfer.setData('orderId', orderId)
    event.dataTransfer.effectAllowed = 'move'
  }

  function handleRemovePoint(orderId: string): void {
    if (!canEdit) return

    setDraftOrderIds((currentOrderIds) =>
      currentOrderIds.filter((currentOrderId) => currentOrderId !== orderId),
    )
    setLocalMessage('РўРѕС‡РєР° СѓРґР°Р»РµРЅР° РёР· С‡РµСЂРЅРѕРІРёРєР°.')
  }

  const handleSaveDraft = useCallback((): void => {
    onSave(draftOrderIds)
  }, [draftOrderIds, onSave])

  const actions = useMemo<ManualDraftActionsState>(
    () => ({
      addableSelectedOrderCount: addableSelectedOrderIds.length,
      canAddSelected: canEdit && addableSelectedOrderIds.length > 0,
      canCancel: !isSaving,
      canSave,
      isSaving,
      onAddSelected: handleAddSelected,
      onCancel,
      onSave: handleSaveDraft,
    }),
    [
      addableSelectedOrderIds.length,
      canEdit,
      canSave,
      handleAddSelected,
      handleSaveDraft,
      isSaving,
      onCancel,
    ],
  )

  useEffect(() => {
    onActionsChange(actions)
  }, [actions, onActionsChange])

  useEffect(() => {
    if (routePreviewPoints.length >= MIN_MANUAL_ROUTE_ORDERS) {
      setRoutePreview({
        routeId: null,
        orderIds: draftOrderIds,
        routeDate,
        courierId: null,
        points: routePreviewPoints,
      })
      return
    }

    clearRoutePreview()
  }, [
    clearRoutePreview,
    draftOrderIds,
    routeDate,
    routePreviewPoints,
    setRoutePreview,
  ])

  useEffect(() => {
    return () => {
      clearRoutePreview()
      onActionsChange(null)
    }
  }, [clearRoutePreview, onActionsChange])

  return (
    <section className="flex h-full min-h-0 flex-col p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3 whitespace-nowrap">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" />
            <h3 className="truncate text-sm font-bold">РќРѕРІС‹Р№ С‡РµСЂРЅРѕРІРёРє</h3>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-[11px] text-slate-400">
            <span>{draftOrderIds.length} С‚РѕС‡РµРє</span>
          </div>
        </div>
      </div>

      {(localMessage || (saveError !== null && saveError !== undefined)) && (
        <div className="mt-1 min-h-4 text-[11px]">
          {localMessage && !saveError && (
            <span className="block truncate text-blue-300">{localMessage}</span>
          )}
          {saveError !== null && saveError !== undefined && (
            <span className="block truncate text-red-300">
              {getRouteMutationError(saveError)}
            </span>
          )}
        </div>
      )}

      <RoutePointEditor
        draftOrderIds={draftOrderIds}
        ordersById={ordersById}
        routePointsByOrderId={new Map()}
        editable={canEdit}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDropAtEnd={handleDropAtEnd}
        onDropOnPoint={handleDropOnPoint}
        onRemovePoint={handleRemovePoint}
      />

      {draftOrderIds.length < MIN_MANUAL_ROUTE_ORDERS && (
        <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          Р”Р»СЏ СЃРѕС…СЂР°РЅРµРЅРёСЏ РјР°СЂС€СЂСѓС‚Р° РЅСѓР¶РЅРѕ РјРёРЅРёРјСѓРј 2 С‚РѕС‡РєРё.
        </p>
      )}
    </section>
  )
}

function ManualDraftActions({
  addableSelectedOrderCount,
  canAddSelected,
  canCancel,
  canSave,
  isSaving,
  onAddSelected,
  onCancel,
  onSave,
}: {
  addableSelectedOrderCount: number
  canAddSelected: boolean
  canCancel: boolean
  canSave: boolean
  isSaving: boolean
  onAddSelected: () => void
  onCancel: () => void
  onSave: () => void
}): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-900/70 p-1">
      {addableSelectedOrderCount > 0 && (
        <button
          type="button"
          onClick={onAddSelected}
          disabled={!canAddSelected}
          className="h-9 min-w-[7rem] flex-1 rounded-lg border border-slate-800 px-3 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          title="Р”РѕР±Р°РІРёС‚СЊ РІС‹Р±СЂР°РЅРЅС‹Рµ Р·Р°РєР°Р·С‹ РІ С‡РµСЂРЅРѕРІРёРє"
        >
          Р”РѕР±Р°РІРёС‚СЊ ({addableSelectedOrderCount})
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        disabled={!canCancel}
        className="h-9 min-w-[7rem] flex-1 rounded-lg border border-slate-800 px-3 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        РћС‚РјРµРЅР°
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!canSave}
        className={cn(
          'h-9 min-w-[7rem] flex-1 rounded-lg px-3 text-xs font-semibold transition-colors',
          canSave
            ? 'bg-violet-600 text-white hover:bg-violet-500'
            : 'cursor-not-allowed bg-slate-800 text-slate-500',
        )}
      >
        {isSaving ? 'РЎРѕС…СЂР°РЅРµРЅРёРµ...' : 'РЎРѕС…СЂР°РЅРёС‚СЊ'}
      </button>
    </div>
  )
}

function RouteDetailColumn({
  route,
  orders,
  routes,
  selectedDate,
  selectedOrderIds,
  fallbackSelectedOrderId,
  canEditRoutes,
  couriers,
  isSendingToMonitoring,
  sendToMonitoringError,
  onSelectRoute,
  onRouteUpdated,
  onSendToMonitoring,
  onActionsChange,
}: {
  route: Route
  orders: Order[]
  routes: Route[]
  selectedDate: string
  selectedOrderIds: string[]
  fallbackSelectedOrderId: string | null
  canEditRoutes: boolean
  couriers: Courier[]
  isSendingToMonitoring: boolean
  sendToMonitoringError: unknown
  onSelectRoute: (id: string | null) => void
  onRouteUpdated: (route: Route) => void
  onSendToMonitoring: (route: Route) => void
  onActionsChange: (actions: RouteDetailActionsState | null) => void
}): React.ReactElement {
  const queryClient = useQueryClient()
  const setRoutePreview = useUiStore((state) => state.setRoutePreview)
  const clearRoutePreview = useUiStore((state) => state.clearRoutePreview)
  const updateRouteMutation = useUpdateRoute()
  const updateRoute = updateRouteMutation.mutate
  const isUpdatingRoute = updateRouteMutation.isPending
  const hasUpdateRouteError = updateRouteMutation.isError
  const updateRouteError = updateRouteMutation.error
  const initialOrderIds = useMemo(() => getRouteOrderIds(route), [route])
  const initialCourierId = route.courierId ?? ''
  const [draftOrderIds, setDraftOrderIds] = useState<string[]>(() => initialOrderIds)
  const [draftCourierId, setDraftCourierId] = useState<string>(() => initialCourierId)
  const [localMessage, setLocalMessage] = useState<string | null>(null)
  const isEditable = canEditRoutes && route.status === 'draft'
  const hasPointChanges = !areOrderIdsEqual(initialOrderIds, draftOrderIds)
  const hasCourierChanges = draftCourierId !== initialCourierId
  const hasChanges = hasPointChanges || hasCourierChanges
  const canSave =
    isEditable &&
    hasChanges &&
    draftOrderIds.length >= MIN_MANUAL_ROUTE_ORDERS &&
    !isUpdatingRoute
  const canSendToMonitoring =
    canEditRoutes &&
    route.status === 'draft' &&
    !hasChanges &&
    draftOrderIds.length >= MIN_MANUAL_ROUTE_ORDERS &&
    !isSendingToMonitoring
  const ordersById = useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders],
  )
  const routePointsByOrderId = useMemo(
    () => new Map(route.routePoints.map((point) => [point.orderId, point])),
    [route.routePoints],
  )
  const blockedOrderIds = useMemo(
    () => getActiveRouteOrderIds(routes.filter((item) => item.id !== route.id)),
    [routes, route.id],
  )
  const addableSelectedOrderIds = useMemo(
    () =>
      getSelectedOrderIdsForAdding(
        selectedOrderIds,
        fallbackSelectedOrderId,
        ordersById,
        draftOrderIds,
        blockedOrderIds,
      ),
    [
      selectedOrderIds,
      fallbackSelectedOrderId,
      ordersById,
      draftOrderIds,
      blockedOrderIds,
    ],
  )
  const routePreviewPoints = useMemo(
    () => getRoutePreviewPoints(draftOrderIds, ordersById, routePointsByOrderId),
    [draftOrderIds, ordersById, routePointsByOrderId],
  )

  useMapOrderDrop((orderId) => {
    if (!isEditable || blockedOrderIds.has(orderId)) return

    const order = ordersById.get(orderId)
    if (!order || !isRoutableOrder(order)) return

    setDraftOrderIds((currentOrderIds) => {
      if (currentOrderIds.includes(order.id)) return currentOrderIds
      return [...currentOrderIds, order.id]
    })
    setLocalMessage('Р—Р°РєР°Р· СЃ РєР°СЂС‚С‹ РґРѕР±Р°РІР»РµРЅ РІ РјР°СЂС€СЂСѓС‚ Р»РѕРєР°Р»СЊРЅРѕ.')
  })

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
    if (!payload.orderId || blockedOrderIds.has(payload.orderId)) return

    setDraftOrderIds((currentOrderIds) =>
      applyDraggedOrder(currentOrderIds, payload, targetOrderId),
    )
    setLocalMessage('РџРѕСЂСЏРґРѕРє С‚РѕС‡РµРє РёР·РјРµРЅС‘РЅ Р»РѕРєР°Р»СЊРЅРѕ.')
  }

  function handleDropAtEnd(event: React.DragEvent<HTMLElement>): void {
    event.preventDefault()
    if (!isEditable) return

    const payload = readDraggedOrder(event)
    if (!payload.orderId || blockedOrderIds.has(payload.orderId)) return

    setDraftOrderIds((currentOrderIds) =>
      applyDraggedOrder(currentOrderIds, payload, null),
    )
    setLocalMessage('РўРѕС‡РєР° РґРѕР±Р°РІР»РµРЅР° РІ РјР°СЂС€СЂСѓС‚ Р»РѕРєР°Р»СЊРЅРѕ.')
  }

  const handleAddSelected = useCallback((): void => {
    if (!isEditable || addableSelectedOrderIds.length === 0) return

    setDraftOrderIds((currentOrderIds) => [
      ...currentOrderIds,
      ...addableSelectedOrderIds,
    ])
    setLocalMessage('Р’С‹Р±СЂР°РЅРЅС‹Рµ Р·Р°РєР°Р·С‹ РґРѕР±Р°РІР»РµРЅС‹ РІ РјР°СЂС€СЂСѓС‚ Р»РѕРєР°Р»СЊРЅРѕ.')
  }, [addableSelectedOrderIds, isEditable])

  function handleRemovePoint(orderId: string): void {
    if (!isEditable) return

    setDraftOrderIds((currentOrderIds) =>
      currentOrderIds.filter((currentOrderId) => currentOrderId !== orderId),
    )
    setLocalMessage('РўРѕС‡РєР° СѓРґР°Р»РµРЅР° Р»РѕРєР°Р»СЊРЅРѕ.')
  }

  const handleReset = useCallback((): void => {
    setDraftOrderIds(initialOrderIds)
    setDraftCourierId(initialCourierId)
    setLocalMessage(null)
  }, [initialCourierId, initialOrderIds])

  const handleSave = useCallback((): void => {
    if (!canSave) return

    updateRoute(
      {
        id: route.id,
        data: {
          ...(hasPointChanges ? { orderIds: draftOrderIds } : {}),
          ...(hasCourierChanges
            ? { courierId: draftCourierId.length > 0 ? draftCourierId : null }
            : {}),
          optimizeWaypoints: false,
        },
      },
      {
        onSuccess: (updatedRoute) => {
          onSelectRoute(updatedRoute.id)
          setLocalMessage(null)
          onRouteUpdated(updatedRoute)
          queryClient.setQueryData(
            QUERY_KEYS.routes.detail(updatedRoute.id),
            updatedRoute,
          )
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
  }, [
    canSave,
    draftOrderIds,
    draftCourierId,
    hasCourierChanges,
    hasPointChanges,
    initialCourierId,
    onRouteUpdated,
    onSelectRoute,
    queryClient,
    route.id,
    selectedDate,
    updateRoute,
  ])

  const handleSendRouteToMonitoring = useCallback((): void => {
    onSendToMonitoring(route)
  }, [onSendToMonitoring, route])

  const actions = useMemo<RouteDetailActionsState>(
    () => ({
      addableSelectedOrderCount: addableSelectedOrderIds.length,
      canAddSelected: isEditable && addableSelectedOrderIds.length > 0,
      canReset: hasChanges && !isUpdatingRoute,
      canSave,
      canSendToMonitoring,
      hasPointChanges: hasChanges,
      isSaving: isUpdatingRoute,
      isSendingToMonitoring,
      onAddSelected: handleAddSelected,
      onReset: handleReset,
      onSave: handleSave,
      onSendToMonitoring: handleSendRouteToMonitoring,
    }),
    [
      addableSelectedOrderIds.length,
      canSave,
      canSendToMonitoring,
      handleAddSelected,
      handleReset,
      handleSave,
      handleSendRouteToMonitoring,
      hasChanges,
      isEditable,
      isSendingToMonitoring,
      isUpdatingRoute,
    ],
  )

  useEffect(() => {
    onActionsChange(actions)
  }, [actions, onActionsChange])

  useEffect(() => {
    if (isEditable && hasPointChanges && routePreviewPoints.length >= 2) {
      setRoutePreview({
        routeId: route.id,
        orderIds: draftOrderIds,
        routeDate: route.routeDate,
        courierId: route.courierId ?? null,
        points: routePreviewPoints,
      })
      return
    }

    clearRoutePreview()
  }, [
    clearRoutePreview,
    draftOrderIds,
    hasPointChanges,
    isEditable,
    route.id,
    route.routeDate,
    route.courierId,
    routePreviewPoints,
    setRoutePreview,
  ])

  useEffect(() => {
    return () => {
      onActionsChange(null)
      clearRoutePreview()
    }
  }, [clearRoutePreview, onActionsChange])

  return (
    <section className="flex h-full min-h-0 flex-col px-4 py-3">
      <div className="grid grid-cols-[minmax(13rem,1fr)_repeat(3,7rem)_12rem] items-start gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-100">
              {formatRouteTitle(route)}
            </h3>
            <span className="shrink-0 rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-300">
              {humanizeStatus(route.status)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Вы редактируете маршрут. Кликните заказ на карте или в списке, чтобы добавить его в маршрут.
          </p>
          {(localMessage || hasUpdateRouteError || sendToMonitoringError !== null && sendToMonitoringError !== undefined) && (
            <p className="mt-1 truncate text-[11px] text-blue-300">
              {hasUpdateRouteError
                ? getRouteMutationError(updateRouteError)
                : sendToMonitoringError !== null && sendToMonitoringError !== undefined
                  ? getRouteMutationError(sendToMonitoringError)
                  : localMessage}
            </p>
          )}
        </div>

        <RouteMetric label="Точки" value={String(draftOrderIds.length)} />
        <RouteMetric label="Расстояние" value={formatRouteDistance(route)} />
        <RouteMetric label="Время" value={formatRouteDuration(route)} />

        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-semibold text-slate-500">
            Курьер
          </span>
          <select
            value={draftCourierId}
            onChange={(event) => setDraftCourierId(event.target.value)}
            disabled={!isEditable}
            className="h-8 w-full rounded-md border border-slate-700 bg-slate-950 px-2 text-xs font-semibold text-slate-100 outline-none transition-colors focus:border-violet-500 disabled:cursor-not-allowed disabled:text-slate-500"
          >
            <option value="">Не назначен</option>
            {couriers.map((courier) => (
              <option key={courier.id} value={courier.id}>
                {formatCourierName(courier)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!isEditable && (
        <p className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-[11px] text-slate-400">
          Маршрут уже передан в работу. Редактирование точек доступно только в черновике.
        </p>
      )}

      <RoutePointEditor
        draftOrderIds={draftOrderIds}
        ordersById={ordersById}
        routePointsByOrderId={routePointsByOrderId}
        editable={isEditable}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDropAtEnd={handleDropAtEnd}
        onDropOnPoint={handleDropOnPoint}
        onRemovePoint={handleRemovePoint}
      />

      <div className="mt-3 flex shrink-0 items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAddSelected}
          disabled={!isEditable || addableSelectedOrderIds.length === 0}
          className="h-9 rounded-md border border-slate-800 bg-slate-900 px-4 text-xs font-semibold text-slate-200 transition-colors hover:border-violet-500/60 hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-600"
        >
          + Добавить точку
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges || isUpdatingRoute}
            className="h-9 min-w-24 rounded-md bg-slate-800 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-500"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              'h-9 min-w-28 rounded-md px-4 text-xs font-semibold transition-colors',
              canSave
                ? 'bg-violet-700 text-white hover:bg-violet-600'
                : 'cursor-not-allowed bg-slate-800 text-slate-500',
            )}
          >
            {isUpdatingRoute ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={handleSendRouteToMonitoring}
            disabled={!canSendToMonitoring}
            className={cn(
              'h-9 min-w-44 rounded-md px-5 text-xs font-semibold transition-colors',
              canSendToMonitoring
                ? 'bg-violet-600 text-white hover:bg-violet-500'
                : 'cursor-not-allowed bg-slate-800 text-slate-500',
            )}
          >
            {isSendingToMonitoring ? 'Передача...' : 'Передать в мониторинг'}
          </button>
        </div>
      </div>
    </section>
  )
}
function RouteMetric({
  label,
  value,
}: {
  label: string
  value: string
}): React.ReactElement {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] font-semibold text-slate-500">
        {label}
      </span>
      <span className="mt-1 block truncate text-xs font-bold text-slate-100">
        {value}
      </span>
    </div>
  )
}

function RouteDetailActions({
  addableSelectedOrderCount,
  canAddSelected,
  canReset,
  canSave,
  canSendToMonitoring,
  hasPointChanges,
  isSaving,
  isSendingToMonitoring,
  onAddSelected,
  onReset,
  onSave,
  onSendToMonitoring,
  showSendToMonitoring = true,
}: RouteDetailActionsState & {
  showSendToMonitoring?: boolean
}): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900/70 p-1">
      {addableSelectedOrderCount > 0 && (
        <button
          type="button"
          onClick={onAddSelected}
          disabled={!canAddSelected}
          className="col-span-2 h-9 w-full rounded-lg border border-slate-800 px-3 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          title="Р”РѕР±Р°РІРёС‚СЊ РІС‹Р±СЂР°РЅРЅС‹Рµ Р·Р°РєР°Р·С‹ РІ РјР°СЂС€СЂСѓС‚"
        >
          Р”РѕР±Р°РІРёС‚СЊ ({addableSelectedOrderCount})
        </button>
      )}
      <button
        type="button"
        onClick={onReset}
        disabled={!canReset}
        className="h-9 w-full rounded-lg border border-slate-800 px-3 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        title="РЎР±СЂРѕСЃРёС‚СЊ РЅРµСЃРѕС…СЂР°РЅРµРЅРЅС‹Рµ РёР·РјРµРЅРµРЅРёСЏ РјР°СЂС€СЂСѓС‚Р°"
      >
        РЎР±СЂРѕСЃРёС‚СЊ
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!canSave}
        className={cn(
          'h-9 w-full rounded-lg px-3 text-xs font-semibold transition-colors',
          canSave
            ? 'bg-blue-600 text-white hover:bg-blue-500'
            : 'cursor-not-allowed bg-slate-800 text-slate-500',
        )}
      >
        {isSaving ? 'РЎРѕС…СЂР°РЅРµРЅРёРµ...' : 'РЎРѕС…СЂР°РЅРёС‚СЊ'}
      </button>
      {showSendToMonitoring && (
        <button
          type="button"
          onClick={onSendToMonitoring}
          disabled={!canSendToMonitoring}
          className={cn(
            'col-span-2 h-9 w-full rounded-lg px-3 text-xs font-semibold transition-colors',
            canSendToMonitoring
              ? 'bg-violet-600 text-white hover:bg-violet-500'
              : 'cursor-not-allowed bg-slate-800 text-slate-500',
          )}
          title={
            hasPointChanges
              ? 'РЎРЅР°С‡Р°Р»Р° СЃРѕС…СЂР°РЅРёС‚Рµ РёР·РјРµРЅРµРЅРёСЏ РјР°СЂС€СЂСѓС‚Р°'
              : 'РџРµСЂРµРґР°С‚СЊ РјР°СЂС€СЂСѓС‚ РІ СЂРµР¶РёРј РјРѕРЅРёС‚РѕСЂРёРЅРіР°'
          }
        >
          {isSendingToMonitoring ? 'РџРµСЂРµРґР°С‡Р°...' : 'Р’ РјРѕРЅРёС‚РѕСЂРёРЅРі'}
        </button>
      )}
    </div>
  )
}

function RoutePointEditor({
  draftOrderIds,
  ordersById,
  routePointsByOrderId,
  editable,
  onDragStart,
  onDragOver,
  onDropAtEnd,
  onDropOnPoint,
  onRemovePoint,
}: {
  draftOrderIds: string[]
  ordersById: Map<string, Order>
  routePointsByOrderId: Map<string, RoutePoint>
  editable: boolean
  onDragStart: (event: React.DragEvent<HTMLDivElement>, orderId: string) => void
  onDragOver: (event: React.DragEvent<HTMLElement>) => void
  onDropAtEnd: (event: React.DragEvent<HTMLElement>) => void
  onDropOnPoint: (
    event: React.DragEvent<HTMLElement>,
    targetOrderId: string,
  ) => void
  onRemovePoint: (orderId: string) => void
}): React.ReactElement {
  return (
    <div
      data-route-drop-target="true"
      onDragOver={onDragOver}
      onDrop={onDropAtEnd}
      className={cn(
        'mt-2 flex min-h-0 flex-1 flex-col rounded-xl border p-2',
        editable
          ? 'border-dashed border-violet-500/40 bg-violet-500/5'
          : 'border-slate-800 bg-slate-900/40',
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold text-slate-300">
          РўРѕС‡РєРё РјР°СЂС€СЂСѓС‚Р°
        </span>
        <span className="text-[11px] tabular-nums text-slate-500">
          {draftOrderIds.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2">
        {draftOrderIds.length === 0 ? (
          <p className="rounded-lg bg-slate-900 px-3 py-5 text-center text-xs text-slate-500">
            РџРµСЂРµС‚Р°С‰РёС‚Рµ Р·Р°РєР°Р· СЃСЋРґР° РёР»Рё РЅР°Р¶РјРёС‚Рµ В«Р”РѕР±Р°РІРёС‚СЊ РІС‹Р±СЂР°РЅРЅС‹РµВ».
          </p>
        ) : (
          <div className="relative flex min-w-max items-start gap-4 px-2 pt-5">
            <div className="pointer-events-none absolute left-10 right-10 top-9 border-t border-dashed border-slate-600" />
            {draftOrderIds.map((orderId, index) => {
              const summary = getPointSummary(
                orderId,
                ordersById,
                routePointsByOrderId,
              )
              const accentClass = getRoutePointAccentClass(index)

              return (
                <div
                  key={orderId}
                  draggable={editable}
                  onDragStart={(event) => onDragStart(event, orderId)}
                  onDragOver={onDragOver}
                  onDrop={(event) => onDropOnPoint(event, orderId)}
                  className={cn(
                    'group relative w-28 shrink-0 text-center text-xs',
                    editable ? 'cursor-grab active:cursor-grabbing' : 'opacity-80',
                  )}
                >
                  <span
                    className={cn(
                      'relative z-10 mx-auto grid h-9 w-9 place-items-center rounded-full border-2 bg-slate-950 text-sm font-semibold shadow-lg',
                      accentClass,
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="mt-[-0.35rem] flex h-24 w-full flex-col rounded-lg border border-slate-700 bg-slate-900/90 px-2 pb-2 pt-6 shadow-lg transition-colors group-hover:border-violet-500/60">
                    <span className="truncate font-semibold text-slate-300">
                      {summary.displayId}
                    </span>
                    <span
                      className="mt-1 line-clamp-2 min-h-[2rem] text-[11px] font-semibold leading-tight text-slate-100"
                      title={summary.address}
                    >
                      {summary.address}
                    </span>
                    <span className="mt-auto truncate text-[11px] tabular-nums text-slate-400">
                      {summary.plannedEta}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemovePoint(orderId)}
                    disabled={!editable}
                    className="absolute right-1 top-11 grid h-5 w-5 place-items-center rounded-md text-slate-500 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-300 disabled:pointer-events-none group-hover:opacity-100"
                    aria-label={`РЈРґР°Р»РёС‚СЊ ${summary.displayId} РёР· РјР°СЂС€СЂСѓС‚Р°`}
                  >
                    Г—
                  </button>
                </div>
              )
            })}
            {editable && (
              <div
                onDragOver={onDragOver}
                onDrop={onDropAtEnd}
                className="relative w-28 shrink-0 text-center text-xs"
              >
                <span className="relative z-10 mx-auto grid h-9 w-9 place-items-center rounded-full border-2 border-slate-600 bg-slate-950 text-xl font-semibold text-slate-300 shadow-lg">
                  +
                </span>
                <div className="mt-[-0.35rem] flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-950/80 px-2 pb-2 pt-6 text-slate-400 transition-colors hover:border-violet-500/60 hover:text-slate-200">
                  <span className="text-2xl leading-none">+</span>
                  <span className="mt-1 text-[11px] font-semibold">Р”РѕР±Р°РІРёС‚СЊ</span>
                  <span className="text-[11px]">С‚РѕС‡РєСѓ</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyRouteDetail({
  canCreateRoute,
  canCreateFromSelection,
  selectedAvailableCount,
  onStartNewDraft,
}: {
  canCreateRoute: boolean
  canCreateFromSelection: boolean
  selectedAvailableCount: number
  onStartNewDraft: () => void
}): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center">
      <div>
        <p className="text-sm font-semibold text-slate-100">
          Р’С‹Р±РµСЂРёС‚Рµ РјР°СЂС€СЂСѓС‚ РёР»Рё СЃРѕР·РґР°Р№С‚Рµ РЅРѕРІС‹Р№
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Р СѓС‡РЅРѕР№ РјР°СЂС€СЂСѓС‚ СЃРѕР·РґР°С‘С‚СЃСЏ РёР· Р·Р°РєР°Р·РѕРІ, РІС‹Р±СЂР°РЅРЅС‹С… РЅР° РєР°СЂС‚Рµ РёР»Рё РІ СЃРїРёСЃРєРµ СЃРїСЂР°РІР°.
        </p>
        {canCreateRoute && (
          <button
            type="button"
            onClick={onStartNewDraft}
            disabled={!canCreateFromSelection}
            className={cn(
              'mt-4 h-9 rounded-lg px-4 text-xs font-semibold transition-colors',
              canCreateFromSelection
                ? 'bg-violet-600 text-white hover:bg-violet-500'
                : 'cursor-not-allowed bg-slate-800 text-slate-500',
            )}
          >
            РЎРѕР·РґР°С‚СЊ РёР· РІС‹Р±СЂР°РЅРЅС‹С… ({selectedAvailableCount})
          </button>
        )}
      </div>
    </div>
  )
}

function RouteSidePanel({
  activeTab,
  onTabChange,
  selectedRoute,
  manualDraftActions,
  routeDetailActions,
  couriers,
  canDeleteRoute,
  isDeleting,
  onDeleteRoute,
}: {
  activeTab: RouteSideTab
  onTabChange: (tab: RouteSideTab) => void
  selectedRoute: Route | null
  manualDraftActions: ManualDraftActionsState | null
  routeDetailActions: RouteDetailActionsState | null
  couriers: Courier[]
  canDeleteRoute: boolean
  isDeleting: boolean
  onDeleteRoute: () => void
}): React.ReactElement {
  return (
    <aside className="flex min-h-0 flex-col p-3">
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-900 p-1">
        {[
          ['actions', 'Р”РµР№СЃС‚РІРёСЏ'],
          ['info', 'РРЅС„Рѕ'],
          ['couriers', 'РљСѓСЂСЊРµСЂС‹'],
        ].map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab as RouteSideTab)}
            className={cn(
              'h-7 rounded-md text-[10px] font-semibold transition-colors',
              activeTab === tab
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
        {activeTab === 'actions' && (
          <RouteActionsTab
            selectedRoute={selectedRoute}
            manualDraftActions={manualDraftActions}
            routeDetailActions={routeDetailActions}
            canDeleteRoute={canDeleteRoute}
            isDeleting={isDeleting}
            onDeleteRoute={onDeleteRoute}
          />
        )}
        {activeTab === 'info' && <RouteInfoTab route={selectedRoute} />}
        {activeTab === 'couriers' && (
          <RouteCouriersTab route={selectedRoute} couriers={couriers} />
        )}
      </div>
    </aside>
  )
}

function RouteActionsTab({
  selectedRoute,
  manualDraftActions,
  routeDetailActions,
  canDeleteRoute,
  isDeleting,
  onDeleteRoute,
}: {
  selectedRoute: Route | null
  manualDraftActions: ManualDraftActionsState | null
  routeDetailActions: RouteDetailActionsState | null
  canDeleteRoute: boolean
  isDeleting: boolean
  onDeleteRoute: () => void
}): React.ReactElement {
  const routeDisplayMode = useUiStore((state) => state.routeDisplayMode)
  const setRouteDisplayMode = useUiStore((state) => state.setRouteDisplayMode)

  let content: React.ReactNode

  if (manualDraftActions) {
    content = <ManualDraftActions {...manualDraftActions} />
  } else if (routeDetailActions) {
    content = (
      <>
        <RouteDetailActions {...routeDetailActions} showSendToMonitoring={false} />
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900/70 p-1">
          <button
            type="button"
            onClick={routeDetailActions.onSendToMonitoring}
            disabled={!routeDetailActions.canSendToMonitoring}
            className={cn(
              'h-9 w-full rounded-lg px-3 text-xs font-semibold transition-colors',
              routeDetailActions.canSendToMonitoring
                ? 'bg-violet-600 text-white hover:bg-violet-500'
                : 'cursor-not-allowed bg-slate-800 text-slate-500',
            )}
            title={
              routeDetailActions.hasPointChanges
                ? 'РЎРЅР°С‡Р°Р»Р° СЃРѕС…СЂР°РЅРёС‚Рµ РёР·РјРµРЅРµРЅРёСЏ РјР°СЂС€СЂСѓС‚Р°'
                : 'РџРµСЂРµРґР°С‚СЊ РјР°СЂС€СЂСѓС‚ РІ СЂРµР¶РёРј РјРѕРЅРёС‚РѕСЂРёРЅРіР°'
            }
          >
            {routeDetailActions.isSendingToMonitoring
              ? 'РџРµСЂРµРґР°С‡Р°...'
              : 'Р’ РјРѕРЅРёС‚РѕСЂРёРЅРі'}
          </button>
          <button
            type="button"
            onClick={onDeleteRoute}
            disabled={!canDeleteRoute}
            className={cn(
              'h-9 w-full rounded-lg text-xs font-semibold transition-colors',
              canDeleteRoute
                ? 'bg-red-500/10 text-red-300 hover:bg-red-500/15'
                : 'cursor-not-allowed bg-slate-900 text-slate-600',
            )}
          >
            {isDeleting ? 'РЈРґР°Р»РµРЅРёРµ...' : 'РЈРґР°Р»РёС‚СЊ РјР°СЂС€СЂСѓС‚'}
          </button>
        </div>
      </>
    )
  } else if (!selectedRoute) {
    content = (
      <p className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-500">
        РњР°СЂС€СЂСѓС‚ РЅРµ РІС‹Р±СЂР°РЅ.
      </p>
    )
  } else {
    content = (
      <button
        type="button"
        onClick={onDeleteRoute}
        disabled={!canDeleteRoute}
        className={cn(
          'h-9 w-full rounded-lg text-xs font-semibold transition-colors',
          canDeleteRoute
            ? 'bg-red-500/10 text-red-300 hover:bg-red-500/15'
            : 'cursor-not-allowed bg-slate-900 text-slate-600',
        )}
      >
        {isDeleting ? 'РЈРґР°Р»РµРЅРёРµ...' : 'РЈРґР°Р»РёС‚СЊ РјР°СЂС€СЂСѓС‚'}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block rounded-lg bg-slate-900 px-3 py-2">
        <span className="mb-2 block text-[11px] font-semibold text-slate-400">
          РћС‚РѕР±СЂР°Р¶РµРЅРёРµ РјР°СЂС€СЂСѓС‚Р°
        </span>
        <select
          value={routeDisplayMode}
          onChange={(event) =>
            setRouteDisplayMode(event.target.value as 'roads' | 'lines')
          }
          className="h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs font-semibold text-slate-100 outline-none transition-colors focus:border-violet-500"
        >
          <option value="roads">РџРѕ РґРѕСЂРѕРіР°Рј</option>
          <option value="lines">Р›РёРЅРёСЏРјРё</option>
        </select>
      </label>
      {content}
    </div>
  )
}

function RouteInfoTab({ route }: { route: Route | null }): React.ReactElement {
  if (!route) {
    return (
      <p className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-500">
        РњР°СЂС€СЂСѓС‚ РЅРµ РІС‹Р±СЂР°РЅ.
      </p>
    )
  }

  return (
    <dl className="space-y-2 text-xs">
      <InfoRow label="РЎРѕР·РґР°РЅ" value={formatDateTime(route.createdAt)} />
      <InfoRow label="РћР±РЅРѕРІР»С‘РЅ" value={formatDateTime(route.updatedAt)} />
      <InfoRow label="Р”Р°С‚Р°" value={formatDateTime(route.routeDate)} />
      <InfoRow label="РўРёРї" value={route.provider ?? 'СЂСѓС‡РЅРѕР№'} />
      <InfoRow label="РЎС‚Р°С‚СѓСЃ" value={humanizeStatus(route.status)} />
      <InfoRow label="Р”РёСЃС‚Р°РЅС†РёСЏ" value={formatRouteDistance(route)} />
      <InfoRow label="Р’СЂРµРјСЏ" value={formatRouteDuration(route)} />
    </dl>
  )
}

function RouteCouriersTab({
  route,
  couriers,
}: {
  route: Route | null
  couriers: Courier[]
}): React.ReactElement {
  return (
    <div className="space-y-2">
      {couriers.slice(0, 8).map((courier) => {
        const isAssigned = route?.courierId === courier.id
        return (
          <div
            key={courier.id}
            className={cn(
              'rounded-lg border px-3 py-2 text-xs',
              isAssigned
                ? 'border-violet-500/60 bg-violet-500/10'
                : 'border-slate-800 bg-slate-900/60',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate font-semibold text-slate-100">
                {formatCourierName(courier)}
              </span>
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  courier.status === 'available' ? 'bg-green-400' : 'bg-amber-400',
                )}
              />
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-500">
              <span>{humanizeStatus(courier.status)}</span>
              {isAssigned && <span className="text-violet-300">РЅР°Р·РЅР°С‡РµРЅ</span>}
            </div>
          </div>
        )
      })}
      {couriers.length === 0 && (
        <p className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-500">
          РљСѓСЂСЊРµСЂС‹ РїРѕРєР° РЅРµ Р·Р°РіСЂСѓР¶РµРЅС‹.
        </p>
      )}
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate text-right font-semibold text-slate-200">{value}</dd>
    </div>
  )
}

function RouteSkeleton(): React.ReactElement {
  return (
    <div className="space-y-3 bg-slate-950 p-3">
      <div className="h-4 w-24 animate-pulse rounded-full bg-slate-800" />
      <div className="h-8 animate-pulse rounded-lg bg-slate-800" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-900" />
    </div>
  )
}

function useMapOrderDrop(onDrop: (orderId: string) => void): void {
  useEffect(() => {
    function handleMapOrderDrop(event: Event): void {
      if (!isMapOrderDropEvent(event)) return
      onDrop(event.detail.orderId)
    }

    window.addEventListener(MAP_ORDER_DROP_EVENT, handleMapOrderDrop)
    return () => {
      window.removeEventListener(MAP_ORDER_DROP_EVENT, handleMapOrderDrop)
    }
  }, [onDrop])
}

function isRoutableOrder(order: Order): boolean {
  return ROUTABLE_STATUSES.includes(order.status)
}

function getSelectedOrders(
  ordersById: Map<string, Order>,
  selectedOrderIds: string[],
  fallbackSelectedOrderId: string | null,
): Order[] {
  const selectedIds =
    selectedOrderIds.length > 0
      ? selectedOrderIds
      : fallbackSelectedOrderId
        ? [fallbackSelectedOrderId]
        : []

  return selectedIds
    .map((orderId) => ordersById.get(orderId))
    .filter((order): order is Order => order !== undefined)
}

function getSelectedOrderIdsForAdding(
  selectedOrderIds: string[],
  fallbackSelectedOrderId: string | null,
  ordersById: Map<string, Order>,
  currentOrderIds: string[],
  blockedOrderIds: Set<string>,
): string[] {
  return getSelectedOrders(ordersById, selectedOrderIds, fallbackSelectedOrderId)
    .filter(
      (order) =>
        isRoutableOrder(order) &&
        !currentOrderIds.includes(order.id) &&
        !blockedOrderIds.has(order.id),
    )
    .map((order) => order.id)
}

function getActiveRouteOrderIds(routes: Route[]): Set<string> {
  return new Set(
    routes
      .filter((route) =>
        ['draft', 'planned', 'in_progress'].includes(route.status),
      )
      .flatMap((route) => route.routePoints.map((point) => point.orderId)),
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
  plannedEta: string
} {
  const order = ordersById.get(orderId)
  const routePoint = routePointsByOrderId.get(orderId)

  if (order) {
    return {
      displayId: getOrderDisplayId(order),
      address: order.deliveryAddress,
      status: getStatusLabel(order.status),
      plannedEta: formatTime(routePoint?.plannedEta ?? null),
    }
  }

  return {
    displayId: `#${orderId.slice(-8).toUpperCase()}`,
    address: routePoint?.deliveryAddress ?? 'РђРґСЂРµСЃ РЅРµРёР·РІРµСЃС‚РµРЅ',
    status: routePoint ? humanizeStatus(routePoint.orderStatus) : 'РќРµРёР·РІРµСЃС‚РЅРѕ',
    plannedEta: formatTime(routePoint?.plannedEta ?? null),
  }
}

function getRoutePreviewPoints(
  orderIds: string[],
  ordersById: Map<string, Order>,
  routePointsByOrderId: Map<string, RoutePoint>,
): RoutePreviewPoint[] {
  return orderIds
    .map((orderId) => {
      const routePoint = routePointsByOrderId.get(orderId)
      if (
        routePoint &&
        routePoint.deliveryLatitude !== null &&
        routePoint.deliveryLongitude !== null
      ) {
        return {
          orderId,
          latitude: routePoint.deliveryLatitude,
          longitude: routePoint.deliveryLongitude,
        }
      }

      const order = ordersById.get(orderId)
      if (
        order &&
        order.deliveryLatitude !== null &&
        order.deliveryLongitude !== null
      ) {
        return {
          orderId,
          latitude: order.deliveryLatitude,
          longitude: order.deliveryLongitude,
        }
      }

      return null
    })
    .filter((point): point is RoutePreviewPoint => point !== null)
}

function formatRouteTitle(route: Route): string {
  return `Route #${route.id.slice(-6).toUpperCase()} В· v${route.version}`
}

function formatRouteDistance(route: Route): string {
  if (route.totalDistanceMeters === null) return 'вЂ” РєРј'

  return `${Math.round(route.totalDistanceMeters / 100) / 10} РєРј`
}

function formatRouteDuration(route: Route): string {
  if (route.totalDurationSeconds === null) return 'вЂ” РјРёРЅ'

  return `${Math.round(route.totalDurationSeconds / 60)} РјРёРЅ`
}

function formatRouteWindow(route: Route): string {
  const sortedPoints = [...route.routePoints].sort((a, b) => a.sequence - b.sequence)
  const firstEta = sortedPoints.find((point) => point.plannedEta !== null)?.plannedEta ?? null
  const lastEta =
    [...sortedPoints].reverse().find((point) => point.plannedEta !== null)?.plannedEta ??
    null

  if (!firstEta && !lastEta) return 'Р±РµР· ETA'

  return `${formatTime(firstEta)}-${formatTime(lastEta)}`
}

function formatAssignedCourier(
  route: Route,
  couriersById: Map<string, Courier>,
): string {
  if (!route.courierId) return 'РљСѓСЂСЊРµСЂ РЅРµ РЅР°Р·РЅР°С‡РµРЅ'

  const courier = couriersById.get(route.courierId)
  return courier ? formatCourierName(courier) : 'РљСѓСЂСЊРµСЂ РЅР°Р·РЅР°С‡РµРЅ'
}

function formatCourierName(courier: Courier): string {
  return `${courier.firstName} ${courier.lastName ?? ''}`.trim()
}

function formatDateTime(value: string | null): string {
  if (!value) return 'вЂ”'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'вЂ”'

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(value: string | null): string {
  if (!value) return 'вЂ”'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'вЂ”'

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function humanizeStatus(status: string): string {
  switch (status) {
    case 'draft':
      return 'Р§РµСЂРЅРѕРІРёРє'
    case 'planned':
      return 'Р’ РјРѕРЅРёС‚РѕСЂРёРЅРіРµ'
    case 'in_progress':
      return 'Р’ СЂР°Р±РѕС‚Рµ'
    case 'completed':
      return 'Р—Р°РІРµСЂС€С‘РЅ'
    case 'cancelled':
      return 'РћС‚РјРµРЅС‘РЅ'
    default:
      return status.replaceAll('_', ' ')
  }
}

function getRouteStatusDotClass(status: Route['status']): string {
  switch (status) {
    case 'draft':
      return 'bg-blue-500'
    case 'planned':
      return 'bg-violet-400'
    case 'in_progress':
      return 'bg-amber-400'
    case 'completed':
      return 'bg-green-400'
    case 'cancelled':
      return 'bg-red-500'
  }
}

function getRouteStatusTextClass(status: Route['status']): string {
  switch (status) {
    case 'completed':
      return 'text-green-300'
    case 'planned':
      return 'text-violet-300'
    case 'in_progress':
      return 'text-amber-300'
    case 'cancelled':
      return 'text-red-300'
    default:
      return 'text-slate-400'
  }
}

function getRoutePointAccentClass(index: number): string {
  const accentClasses = [
    'border-violet-500 text-violet-300 shadow-violet-950/40',
    'border-blue-500 text-blue-300 shadow-blue-950/40',
    'border-green-500 text-green-300 shadow-green-950/40',
    'border-orange-500 text-orange-300 shadow-orange-950/40',
    'border-cyan-500 text-cyan-300 shadow-cyan-950/40',
    'border-purple-500 text-purple-300 shadow-purple-950/40',
    'border-yellow-400 text-yellow-300 shadow-yellow-950/40',
    'border-rose-500 text-rose-300 shadow-rose-950/40',
    'border-slate-600 text-slate-300 shadow-slate-950/40',
  ]

  return accentClasses[index % accentClasses.length]
}

function getRouteMutationError(error: unknown): string {
  if (isAxiosError<ApiError>(error)) {
    const message = error.response?.data?.message as unknown
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string' && message.length > 0) return message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ РјР°СЂС€СЂСѓС‚.'
}

void RouteSidePanel
void formatRouteWindow
