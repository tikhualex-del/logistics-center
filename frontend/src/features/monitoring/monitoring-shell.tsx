import { useMemo, type ReactElement, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  AlertTriangle,
  PackageCheck,
  RefreshCw,
  Route as RouteIcon,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import type {
  Courier,
  Order,
  OrderStatus,
  Route as DeliveryRoute,
  RouteStatus,
} from '@/api'
import { Button } from '@/components/ui/button'
import { useCouriers, useOrders, useRoutes } from '@/hooks'
import { cn, ROUTES } from '@/lib'
import { useUiStore } from '@/store'

const ACTIVE_ROUTE_STATUSES = new Set<RouteStatus>(['planned', 'in_progress'])

const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  'confirmed',
  'assigned',
  'handed_over',
  'in_transit',
]

const ACTIVE_ORDER_STATUS_SET = new Set<OrderStatus>(ACTIVE_ORDER_STATUSES)

const FINAL_ORDER_STATUSES: readonly OrderStatus[] = [
  'delivered',
  'undelivered',
  'returned',
  'cancelled',
]

const FINAL_ORDER_STATUS_SET = new Set<OrderStatus>(FINAL_ORDER_STATUSES)

const RISK_WINDOW_MS = 30 * 60 * 1000
const EMPTY_ORDERS: readonly Order[] = []
const EMPTY_ROUTES: readonly DeliveryRoute[] = []
const EMPTY_COURIERS: readonly Courier[] = []

const ROUTE_STATUS_STYLES: Record<RouteStatus, string> = {
  draft: 'bg-slate-500/10 text-slate-700 ring-slate-500/20',
  planned: 'bg-sky-500/10 text-sky-700 ring-sky-500/20',
  in_progress: 'bg-amber-500/10 text-amber-800 ring-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-700 ring-red-500/20',
}

const COURIER_STATUS_STYLES: Record<
  Courier['status'],
  {
    dot: string
    label: string
  }
> = {
  available: {
    dot: 'bg-emerald-500',
    label: 'text-emerald-700',
  },
  busy: {
    dot: 'bg-amber-500',
    label: 'text-amber-800',
  },
  inactive: {
    dot: 'bg-slate-400',
    label: 'text-slate-600',
  },
  offline: {
    dot: 'bg-zinc-400',
    label: 'text-zinc-600',
  },
  suspended: {
    dot: 'bg-red-500',
    label: 'text-red-700',
  },
}

type StatTone = 'neutral' | 'success' | 'warning' | 'danger'

interface SummaryStat {
  key: string
  label: string
  value: number
  helper: string
  tone: StatTone
  Icon: LucideIcon
}

interface CourierProgress {
  courier: Courier
  activeOrders: number
  deliveredOrders: number
}

export function MonitoringShell(): ReactElement {
  const { t } = useTranslation()
  const selectedDate = useUiStore((state) => state.selectedDate)

  const ordersQuery = useOrders({ date: selectedDate })
  const routesQuery = useRoutes({ date: selectedDate })
  const couriersQuery = useCouriers()

  const orders = ordersQuery.data ?? EMPTY_ORDERS
  const routes = routesQuery.data ?? EMPTY_ROUTES
  const couriers = couriersQuery.data ?? EMPTY_COURIERS
  const activeRoutes = useMemo(() => getActiveRoutes(routes), [routes])
  const courierProgress = useMemo(
    () => getCourierProgress(couriers, orders),
    [couriers, orders],
  )
  const stats = useMemo(
    () =>
      getSummaryStats({
        orders,
        routes,
        selectedDate,
        labels: {
          activeRoutes: t('monitoring.stats.activeRoutes'),
          activeOrders: t('monitoring.stats.activeOrders'),
          delivered: t('monitoring.stats.delivered'),
          atRisk: t('monitoring.stats.atRisk'),
          activeRoutesHint: t('monitoring.stats.activeRoutesHint'),
          activeOrdersHint: t('monitoring.stats.activeOrdersHint'),
          deliveredHint: t('monitoring.stats.deliveredHint'),
          atRiskHint: t('monitoring.stats.atRiskHint', {
            count: countOnlineCouriers(couriers),
          }),
        },
      }),
    [couriers, orders, routes, selectedDate, t],
  )

  const isLoading =
    ordersQuery.isLoading || routesQuery.isLoading || couriersQuery.isLoading
  const hasError =
    ordersQuery.isError || routesQuery.isError || couriersQuery.isError

  function handleRefresh(): void {
    void Promise.all([
      ordersQuery.refetch(),
      routesQuery.refetch(),
      couriersQuery.refetch(),
    ])
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto bg-background p-4 md:p-6">
      <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {t('monitoring.section')}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-foreground">
            {t('monitoring.title')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t('monitoring.subtitle', { date: selectedDate })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.DISPATCHER}>{t('monitoring.openDispatcher')}</Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw aria-hidden="true" />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {hasError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t('monitoring.loadError')}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <SummaryCard key={stat.key} stat={stat} isLoading={isLoading} />
        ))}
      </div>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Panel
          title={t('monitoring.routes.title')}
          eyebrow={t('monitoring.routes.eyebrow', {
            count: activeRoutes.length,
          })}
        >
          {routesQuery.isLoading && <PanelSkeleton rows={3} />}
          {!routesQuery.isLoading && activeRoutes.length === 0 && (
            <EmptyState
              title={t('monitoring.routes.emptyTitle')}
              description={t('monitoring.routes.emptyDescription')}
            />
          )}
          {!routesQuery.isLoading && activeRoutes.length > 0 && (
            <div className="grid gap-3 lg:grid-cols-2">
              {activeRoutes.slice(0, 4).map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title={t('monitoring.couriers.title')}
          eyebrow={t('monitoring.couriers.eyebrow', {
            count: courierProgress.length,
          })}
        >
          {couriersQuery.isLoading && <PanelSkeleton rows={4} compact />}
          {!couriersQuery.isLoading && courierProgress.length === 0 && (
            <EmptyState
              title={t('monitoring.couriers.emptyTitle')}
              description={t('monitoring.couriers.emptyDescription')}
            />
          )}
          {!couriersQuery.isLoading && courierProgress.length > 0 && (
            <div className="space-y-2">
              {courierProgress.slice(0, 6).map((progress) => (
                <CourierRow key={progress.courier.id} progress={progress} />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </section>
  )
}

function SummaryCard({
  stat,
  isLoading,
}: {
  stat: SummaryStat
  isLoading: boolean
}): ReactElement {
  const toneClassName: Record<StatTone, string> = {
    neutral: 'bg-sky-500/10 text-sky-700',
    success: 'bg-emerald-500/10 text-emerald-700',
    warning: 'bg-amber-500/10 text-amber-800',
    danger: 'bg-red-500/10 text-red-700',
  }
  const Icon = stat.Icon

  return (
    <article className="min-h-[8.75rem] rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {stat.label}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
            {isLoading ? '-' : stat.value}
          </p>
        </div>
        <span
          className={cn(
            'grid h-9 w-9 place-items-center rounded-md',
            toneClassName[stat.tone],
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {stat.helper}
      </p>
    </article>
  )
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow: string
  children: ReactNode
}): ReactElement {
  return (
    <section className="min-h-[18rem] rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-base font-semibold text-foreground">
          {title}
        </h2>
      </div>
      <div className="p-3">{children}</div>
    </section>
  )
}

function RouteCard({ route }: { route: DeliveryRoute }): ReactElement {
  const { t } = useTranslation()
  const orderCount = route.routePoints.length
  const distanceKm =
    route.totalDistanceMeters === null
      ? null
      : route.totalDistanceMeters / 1000

  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {t('monitoring.routes.routeName', {
              id: route.id.slice(0, 8),
              version: route.version,
            })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('monitoring.routes.ordersCount', { count: orderCount })}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ring-1',
            ROUTE_STATUS_STYLES[route.status],
          )}
        >
          {t(`monitoring.routeStatus.${route.status}`)}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">
            {t('monitoring.routes.distance')}
          </dt>
          <dd className="mt-1 font-semibold text-foreground">
            {distanceKm === null
              ? t('common.unknown')
              : t('monitoring.routes.distanceKm', {
                  value: distanceKm.toFixed(1),
                })}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('monitoring.routes.duration')}
          </dt>
          <dd className="mt-1 font-semibold text-foreground">
            {formatDuration(route.totalDurationSeconds, t)}
          </dd>
        </div>
      </dl>
    </article>
  )
}

function CourierRow({ progress }: { progress: CourierProgress }): ReactElement {
  const { t } = useTranslation()
  const courier = progress.courier
  const statusStyle = COURIER_STATUS_STYLES[courier.status]
  const name = getCourierName(courier)

  return (
    <article className="flex min-h-[4.5rem] items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-sm font-semibold text-foreground">
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('monitoring.couriers.progress', {
            active: progress.activeOrders,
            delivered: progress.deliveredOrders,
          })}
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-xs">
        <span className={cn('h-2 w-2 rounded-full', statusStyle.dot)} />
        <span className={cn('font-medium', statusStyle.label)}>
          {courier.isOnline
            ? t('monitoring.couriers.online')
            : t('monitoring.couriers.offline')}
        </span>
      </span>
    </article>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}): ReactElement {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function PanelSkeleton({
  rows,
  compact = false,
}: {
  rows: number
  compact?: boolean
}): ReactElement {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className={cn(
            'animate-pulse rounded-lg border border-border bg-muted/60',
            compact ? 'h-[4.5rem]' : 'h-[8rem]',
          )}
        />
      ))}
    </div>
  )
}

function getSummaryStats({
  orders,
  routes,
  selectedDate,
  labels,
}: {
  orders: readonly Order[]
  routes: readonly DeliveryRoute[]
  selectedDate: string
  labels: {
    activeRoutes: string
    activeOrders: string
    delivered: string
    atRisk: string
    activeRoutesHint: string
    activeOrdersHint: string
    deliveredHint: string
    atRiskHint: string
  }
}): SummaryStat[] {
  const activeRoutes = routes.filter((route) => isActiveRoute(route.status))
  const activeOrders = orders.filter((order) => isActiveOrder(order.status))
  const deliveredOrders = orders.filter((order) => order.status === 'delivered')
  const atRiskOrders = orders.filter((order) =>
    isAtRiskOrder(order, selectedDate),
  )
  return [
    {
      key: 'active-routes',
      label: labels.activeRoutes,
      value: activeRoutes.length,
      helper: labels.activeRoutesHint,
      tone: 'neutral',
      Icon: RouteIcon,
    },
    {
      key: 'active-orders',
      label: labels.activeOrders,
      value: activeOrders.length,
      helper: labels.activeOrdersHint,
      tone: 'warning',
      Icon: Activity,
    },
    {
      key: 'delivered',
      label: labels.delivered,
      value: deliveredOrders.length,
      helper: labels.deliveredHint,
      tone: 'success',
      Icon: PackageCheck,
    },
    {
      key: 'at-risk',
      label: labels.atRisk,
      value: atRiskOrders.length,
      helper: labels.atRiskHint,
      tone: atRiskOrders.length > 0 ? 'danger' : 'success',
      Icon: atRiskOrders.length > 0 ? AlertTriangle : Truck,
    },
  ]
}

function getActiveRoutes(routes: readonly DeliveryRoute[]): DeliveryRoute[] {
  return routes
    .filter((route) => isActiveRoute(route.status))
    .toSorted((a, b) => a.routeDate.localeCompare(b.routeDate))
}

function getCourierProgress(
  couriers: readonly Courier[],
  orders: readonly Order[],
): CourierProgress[] {
  return couriers
    .filter((courier) => courier.isOnline || courier.status === 'busy')
    .map((courier) => {
      const courierOrders = orders.filter(
        (order) => order.assignedCourierId === courier.id,
      )

      return {
        courier,
        activeOrders: courierOrders.filter((order) =>
          isActiveOrder(order.status),
        ).length,
        deliveredOrders: courierOrders.filter(
          (order) => order.status === 'delivered',
        ).length,
      }
    })
    .toSorted((a, b) => {
      if (a.activeOrders !== b.activeOrders) {
        return b.activeOrders - a.activeOrders
      }

      return getCourierName(a.courier).localeCompare(getCourierName(b.courier))
    })
}

function countOnlineCouriers(couriers: readonly Courier[]): number {
  return couriers.filter((courier) => courier.isOnline).length
}

function isActiveRoute(status: RouteStatus): boolean {
  return ACTIVE_ROUTE_STATUSES.has(status)
}

function isActiveOrder(status: OrderStatus): boolean {
  return ACTIVE_ORDER_STATUS_SET.has(status)
}

function isFinalOrderStatus(status: OrderStatus): boolean {
  return FINAL_ORDER_STATUS_SET.has(status)
}

function isAtRiskOrder(order: Order, selectedDate: string): boolean {
  if (isFinalOrderStatus(order.status)) return false

  const deadline = getOrderDeadline(order.timeWindowTo, selectedDate)
  if (deadline === null) return false

  return deadline.getTime() - Date.now() <= RISK_WINDOW_MS
}

function getOrderDeadline(
  timeWindowTo: string | null,
  selectedDate: string,
): Date | null {
  if (!timeWindowTo) return null

  const exactTimestamp = Date.parse(timeWindowTo)
  if (Number.isFinite(exactTimestamp)) {
    return new Date(exactTimestamp)
  }

  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeWindowTo)
  if (!timeMatch) return null

  return new Date(`${selectedDate}T${timeMatch[1]}:${timeMatch[2]}:00`)
}

function getCourierName(courier: Courier): string {
  return [courier.firstName, courier.lastName].filter(Boolean).join(' ')
}

function formatDuration(
  seconds: number | null,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (seconds === null) return t('common.unknown')

  const minutes = Math.max(1, Math.round(seconds / 60))
  return t('monitoring.routes.durationMinutes', { value: minutes })
}
