import { useMemo, useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPinned,
  Play,
  RefreshCw,
  Route as RouteIcon,
  SquareCheck,
  Trash2,
  XCircle,
} from 'lucide-react'
import type { Route as DeliveryRoute, RouteStatus } from '@/api'
import { Button } from '@/components/ui/button'
import {
  useDeleteRoute,
  usePermissions,
  useRoutes,
  useUpdateRoute,
} from '@/hooks'
import { cn, ROUTES } from '@/lib'
import { useUiStore } from '@/store'

const EMPTY_ROUTES: readonly DeliveryRoute[] = []
const NEXT_ROUTE_STATUSES: Record<RouteStatus, readonly RouteStatus[]> = {
  draft: ['planned', 'cancelled'],
  planned: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

const ROUTE_STATUS_STYLES: Record<RouteStatus, string> = {
  draft: 'bg-slate-500/10 text-slate-700 ring-slate-500/20',
  planned: 'bg-sky-500/10 text-sky-700 ring-sky-500/20',
  in_progress: 'bg-amber-500/10 text-amber-800 ring-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-700 ring-red-500/20',
}

const ROUTE_STATUS_LABELS: Record<RouteStatus, string> = {
  draft: 'Черновик',
  planned: 'Запланирован',
  in_progress: 'В работе',
  completed: 'Завершен',
  cancelled: 'Отменен',
}

export function RoutesManagement(): ReactElement {
  const selectedDate = useUiStore((state) => state.selectedDate)
  const routesQuery = useRoutes({ date: selectedDate })
  const updateRouteMutation = useUpdateRoute()
  const deleteRouteMutation = useDeleteRoute()
  const { can } = usePermissions()
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const routes = routesQuery.data ?? EMPTY_ROUTES
  const orderedRoutes = useMemo(
    () =>
      [...routes].sort((a, b) => {
        if (a.status !== b.status) return a.status.localeCompare(b.status)
        return a.routeDate.localeCompare(b.routeDate)
      }),
    [routes],
  )
  const selectedRoute =
    orderedRoutes.find((route) => route.id === selectedRouteId) ??
    orderedRoutes[0] ??
    null
  const canEditRoutes = can('edit:routes')

  function transitionRoute(route: DeliveryRoute, status: RouteStatus): void {
    updateRouteMutation.mutate({
      id: route.id,
      data: { status },
    })
  }

  function deleteRoute(route: DeliveryRoute): void {
    deleteRouteMutation.mutate(route.id, {
      onSuccess: () => setSelectedRouteId(null),
    })
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto bg-background p-4 md:p-6">
      <div className="flex flex-col gap-3 border-b border-border pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Маршруты
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            Управление маршрутами
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Административный список и детали без дублирования map-workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void routesQuery.refetch()}
          >
            <RefreshCw aria-hidden="true" />
            Обновить
          </Button>
          <Button asChild size="sm">
            <Link to={ROUTES.DISPATCHER}>
              <MapPinned aria-hidden="true" />
              Открыть карту
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">
              Маршруты на дату
            </h2>
            <p className="text-xs text-muted-foreground">
              {orderedRoutes.length} маршрутов
            </p>
          </div>
          <div className="grid gap-2 p-3 lg:grid-cols-2">
            {routesQuery.isLoading && <RouteSkeleton />}
            {!routesQuery.isLoading &&
              orderedRoutes.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setSelectedRouteId(route.id)}
                  className={cn(
                    'rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted/50',
                    selectedRoute?.id === route.id && 'bg-muted',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        Маршрут #{route.id.slice(0, 8)} · v{route.version}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {route.routePoints.length} заказов
                      </p>
                    </div>
                    <RouteStatusBadge status={route.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>{formatDistance(route.totalDistanceMeters)}</span>
                    <span>{formatDuration(route.totalDurationSeconds)}</span>
                  </div>
                </button>
              ))}
            {!routesQuery.isLoading && orderedRoutes.length === 0 && (
              <p className="rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
                На выбранную дату маршрутов нет.
              </p>
            )}
          </div>
        </section>

        <RouteDetailPanel
          route={selectedRoute}
          canEdit={canEditRoutes}
          isPending={updateRouteMutation.isPending || deleteRouteMutation.isPending}
          onTransition={transitionRoute}
          onDelete={deleteRoute}
        />
      </div>
    </section>
  )
}

function RouteDetailPanel({
  route,
  canEdit,
  isPending,
  onTransition,
  onDelete,
}: {
  route: DeliveryRoute | null
  canEdit: boolean
  isPending: boolean
  onTransition: (route: DeliveryRoute, status: RouteStatus) => void
  onDelete: (route: DeliveryRoute) => void
}): ReactElement {
  if (route === null) {
    return (
      <aside className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        Выберите маршрут, чтобы увидеть точки, статус и действия.
      </aside>
    )
  }

  const nextStatuses = NEXT_ROUTE_STATUSES[route.status]

  return (
    <aside className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Детали маршрута
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">
          Маршрут #{route.id.slice(0, 8)}
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <RouteStatusBadge status={route.status} />
        <span className="inline-flex h-7 items-center rounded-md bg-muted px-2 text-xs text-muted-foreground">
          {route.provider ?? 'provider неизвестен'}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Detail label="Заказов" value={String(route.routePoints.length)} />
        <Detail label="Дистанция" value={formatDistance(route.totalDistanceMeters)} />
        <Detail label="Время" value={formatDuration(route.totalDurationSeconds)} />
        <Detail label="Курьер" value={route.courierId ?? 'Не назначен'} />
      </dl>

      {canEdit && nextStatuses.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Действия
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => onTransition(route, status)}
              >
                {status === 'cancelled' ? (
                  <XCircle aria-hidden="true" />
                ) : status === 'completed' ? (
                  <SquareCheck aria-hidden="true" />
                ) : (
                  <Play aria-hidden="true" />
                )}
                {ROUTE_STATUS_LABELS[status]}
              </Button>
            ))}
            {route.status !== 'in_progress' && route.status !== 'completed' && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => onDelete(route)}
              >
                <Trash2 aria-hidden="true" />
                Удалить
              </Button>
            )}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Заказы маршрута
        </p>
        <div className="mt-2 space-y-2">
          {route.routePoints.map((point) => (
            <div
              key={point.id}
              className="rounded-lg border border-border bg-background p-3 text-sm"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                  {point.sequence}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {point.customerName ?? point.orderId.slice(0, 8)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {point.deliveryAddress}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {route.routePoints.length === 0 && (
            <p className="text-sm text-muted-foreground">Точек пока нет.</p>
          )}
        </div>
      </div>
    </aside>
  )
}

function RouteStatusBadge({ status }: { status: RouteStatus }): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-semibold ring-1',
        ROUTE_STATUS_STYLES[status],
      )}
    >
      <RouteIcon className="h-3.5 w-3.5" aria-hidden="true" />
      {ROUTE_STATUS_LABELS[status]}
    </span>
  )
}

function Detail({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  )
}

function RouteSkeleton(): ReactElement {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-lg border border-border bg-muted"
        />
      ))}
    </>
  )
}

function formatDistance(value: number | null): string {
  if (value === null) return 'дистанция неизвестна'
  return `${(value / 1000).toFixed(1)} км`
}

function formatDuration(value: number | null): string {
  if (value === null) return 'время неизвестно'
  return `${Math.max(1, Math.round(value / 60))} мин`
}
