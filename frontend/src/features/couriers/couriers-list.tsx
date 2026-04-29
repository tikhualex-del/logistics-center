import { useDeferredValue } from 'react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  Clock3,
  MapPin,
  PackageCheck,
  Power,
  RefreshCw,
  UserRound,
  X,
} from 'lucide-react'
import type { Courier, CourierStatus, Order } from '@/api'
import { Button } from '@/components/ui/button'
import i18n from '@/i18n'
import { useCourier, useCouriers, useOrders, useUpdateCourierStatus } from '@/hooks'
import { cn } from '@/lib/utils'
import { getStatusLabel } from '@/lib/order-utils'
import { useUiStore } from '@/store'

const COURIER_STATUS_STYLES: Record<
  CourierStatus,
  {
    badgeClassName: string
    dotClassName: string
  }
> = {
  available: {
    badgeClassName: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
    dotClassName: 'bg-emerald-500',
  },
  busy: {
    badgeClassName: 'bg-amber-500/10 text-amber-700 ring-amber-500/20',
    dotClassName: 'bg-amber-500',
  },
  inactive: {
    badgeClassName: 'bg-slate-500/10 text-slate-600 ring-slate-500/20',
    dotClassName: 'bg-slate-400',
  },
  offline: {
    badgeClassName: 'bg-zinc-500/10 text-zinc-600 ring-zinc-500/20',
    dotClassName: 'bg-zinc-400',
  },
  suspended: {
    badgeClassName: 'bg-red-500/10 text-red-700 ring-red-500/20',
    dotClassName: 'bg-red-500',
  },
}

export function CouriersList(): ReactElement {
  const { t } = useTranslation()
  const selectedDate = useUiStore((state) => state.selectedDate)
  const searchQuery = useUiStore((state) => state.searchQuery)
  const selectedCourierId = useUiStore((state) => state.selectedCourierId)
  const setSelectedCourierId = useUiStore((state) => state.setSelectedCourierId)
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const couriersQuery = useCouriers()
  const courierDetailQuery = useCourier(selectedCourierId)
  const ordersQuery = useOrders({ date: selectedDate })
  const updateCourierStatusMutation = useUpdateCourierStatus()
  const couriers = couriersQuery.data ?? []
  const orders = ordersQuery.data ?? []
  const assignedOrdersByCourier = countAssignedOrdersByCourier(orders)
  const normalizedSearch = deferredSearchQuery.trim().toLowerCase()
  const visibleCouriers = couriers.filter((courier) =>
    courierMatchesSearch(courier, normalizedSearch),
  )
  const selectedCourierFromList =
    couriers.find((courier) => courier.id === selectedCourierId) ?? null
  const detailCourier = courierDetailQuery.data ?? selectedCourierFromList
  const selectedCourierOrders =
    selectedCourierId === null
      ? []
      : orders.filter((order) => order.assignedCourierId === selectedCourierId)
  const stats = getCourierStats(couriers)

  function handleSelectCourier(courierId: string): void {
    setSelectedCourierId(selectedCourierId === courierId ? null : courierId)
  }

  function handleCloseCourierDetail(): void {
    setSelectedCourierId(null)
  }

  function handleToggleCourierStatus(courier: Courier): void {
    updateCourierStatusMutation.mutate({
      id: courier.id,
      data: { status: courier.isOnline ? 'offline' : 'online' },
    })
  }

  if (couriersQuery.isLoading) {
    return (
      <CouriersPageShell selectedDate={selectedDate}>
        <CourierStatsGrid stats={stats} isLoading />
        <CouriersSkeleton />
      </CouriersPageShell>
    )
  }

  if (couriersQuery.isError) {
    return (
      <CouriersPageShell selectedDate={selectedDate}>
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-6">
          <p className="text-sm font-semibold text-destructive">
            {t('couriers.loadError')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('couriers.loadErrorHint')}
          </p>
          <button
            type="button"
            onClick={() => void couriersQuery.refetch()}
            className="mt-4 rounded-lg border border-destructive/30 bg-background px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            {t('couriers.retry')}
          </button>
        </div>
      </CouriersPageShell>
    )
  }

  return (
    <CouriersPageShell selectedDate={selectedDate}>
      <CourierStatsGrid stats={stats} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {t('couriers.rosterTitle')}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('couriers.rosterSubtitle')}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {ordersQuery.isFetching && (
                <span className="rounded-full bg-muted px-2 py-1">
                  {t('couriers.ordersUpdating')}
                </span>
              )}
              {ordersQuery.isError && (
                <button
                  type="button"
                  onClick={() => void ordersQuery.refetch()}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-medium text-amber-700 transition-colors hover:bg-amber-500/15"
                >
                  {t('couriers.ordersRetry')}
                </button>
              )}
              <span className="tabular-nums">
                {t('couriers.visibleOfTotal', {
                  visible: visibleCouriers.length,
                  total: couriers.length,
                })}
              </span>
            </div>
          </div>

          {visibleCouriers.length === 0 ? (
            <CouriersEmptyState hasSearch={normalizedSearch.length > 0} />
          ) : (
            <div className="overflow-x-auto">
              <div
                className="hidden min-w-[900px] grid-cols-[minmax(240px,1.5fr)_minmax(150px,0.9fr)_120px_minmax(220px,1.1fr)_140px] gap-4 border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground md:grid"
                role="row"
              >
                <span>{t('couriers.columns.courier')}</span>
                <span>{t('couriers.columns.status')}</span>
                <span className="text-right">{t('couriers.columns.orders')}</span>
                <span>{t('couriers.columns.location')}</span>
                <span>{t('couriers.columns.lastSeen')}</span>
              </div>
              <div className="min-w-0 divide-y divide-border md:min-w-[900px]">
                {visibleCouriers.map((courier) => (
                  <CourierRow
                    key={courier.id}
                    courier={courier}
                    assignedOrders={
                      ordersQuery.isError
                        ? null
                        : assignedOrdersByCourier.get(courier.id) ?? 0
                    }
                    isSelected={selectedCourierId === courier.id}
                    onSelect={handleSelectCourier}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {selectedCourierId !== null && (
          <CourierDetailCard
            courier={detailCourier}
            orders={selectedCourierOrders}
            isLoading={courierDetailQuery.isLoading}
            isRefreshing={courierDetailQuery.isFetching}
            isOrdersError={ordersQuery.isError}
            isUpdatingStatus={updateCourierStatusMutation.isPending}
            updateError={updateCourierStatusMutation.error}
            onClose={handleCloseCourierDetail}
            onRefresh={() => void courierDetailQuery.refetch()}
            onRetryOrders={() => void ordersQuery.refetch()}
            onToggleStatus={handleToggleCourierStatus}
          />
        )}
      </div>
    </CouriersPageShell>
  )
}

function CouriersPageShell({
  selectedDate,
  children,
}: {
  selectedDate: string
  children: React.ReactNode
}): ReactElement {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/30">
      <header className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t('couriers.section')}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {t('couriers.pageTitle')}
            </h1>
          </div>
          <div className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
            {t('couriers.selectedDate')}{' '}
            <span className="font-semibold text-foreground">{selectedDate}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">{children}</div>
      </main>
    </div>
  )
}

function CourierStatsGrid({
  stats,
  isLoading = false,
}: {
  stats: CourierStats
  isLoading?: boolean
}): ReactElement {
  const { t } = useTranslation()
  const cards = [
    {
      label: t('couriers.stats.total'),
      value: stats.total,
      accentClassName: 'bg-slate-900',
    },
    {
      label: t('couriers.stats.online'),
      value: stats.online,
      accentClassName: 'bg-emerald-500',
    },
    {
      label: t('couriers.stats.busy'),
      value: stats.busy,
      accentClassName: 'bg-amber-500',
    },
    {
      label: t('couriers.stats.withGps'),
      value: stats.withLocation,
      accentClassName: 'bg-sky-500',
    },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              {card.label}
            </span>
            <span
              className={cn('h-2.5 w-2.5 rounded-full', card.accentClassName)}
              aria-hidden="true"
            />
          </div>
          {isLoading ? (
            <div className="mt-4 h-8 w-16 animate-pulse rounded-lg bg-muted" />
          ) : (
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {card.value}
            </p>
          )}
        </div>
      ))}
    </section>
  )
}

function CourierRow({
  courier,
  assignedOrders,
  isSelected,
  onSelect,
}: {
  courier: Courier
  assignedOrders: number | null
  isSelected: boolean
  onSelect: (id: string) => void
}): ReactElement {
  const { t } = useTranslation()
  const courierName = formatCourierName(courier)
  const location = formatCourierLocation(courier)

  return (
    <button
      type="button"
      onClick={() => onSelect(courier.id)}
      className={cn(
        'grid w-full gap-3 px-4 py-3 text-left transition-all hover:bg-accent/70',
        'md:grid-cols-[minmax(240px,1.5fr)_minmax(150px,0.9fr)_120px_minmax(220px,1.1fr)_140px] md:items-center md:gap-4',
        isSelected && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
      )}
      aria-pressed={isSelected}
      aria-label={t('couriers.selectCourier', { name: courierName })}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold',
            courier.isOnline
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {getCourierInitials(courier)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">
            {courierName}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {courier.email}
            {courier.phone ? ` - ${courier.phone}` : ''}
          </span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <OnlineBadge isOnline={courier.isOnline} />
        <CourierStatusBadge status={courier.status} />
        {!courier.isActive && (
          <span className="rounded-full bg-destructive/10 px-2 py-1 text-[11px] font-semibold text-destructive">
            {t('couriers.disabled')}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <span className="text-xs font-medium text-muted-foreground md:hidden">
          {t('couriers.columns.orders')}
        </span>
        <span className="rounded-full border border-border bg-background px-3 py-1 text-sm font-semibold text-foreground tabular-nums">
          {assignedOrders === null ? '-' : assignedOrders}
        </span>
      </div>

      <div className="min-w-0">
        <span className="text-xs font-medium text-muted-foreground md:hidden">
          {t('couriers.columns.location')}
        </span>
        <p
          className={cn(
            'mt-1 truncate text-xs md:mt-0',
            location.hasGps ? 'text-foreground' : 'text-muted-foreground',
          )}
          title={location.title}
        >
          {location.label}
        </p>
      </div>

      <div>
        <span className="text-xs font-medium text-muted-foreground md:hidden">
          {t('couriers.columns.lastSeen')}
        </span>
        <p className="mt-1 text-xs text-muted-foreground md:mt-0">
          {formatLastSeen(courier.lastSeenAt)}
        </p>
      </div>
    </button>
  )
}

function CourierDetailCard({
  courier,
  orders,
  isLoading,
  isRefreshing,
  isOrdersError,
  isUpdatingStatus,
  updateError,
  onClose,
  onRefresh,
  onRetryOrders,
  onToggleStatus,
}: {
  courier: Courier | null
  orders: Order[]
  isLoading: boolean
  isRefreshing: boolean
  isOrdersError: boolean
  isUpdatingStatus: boolean
  updateError: Error | null
  onClose: () => void
  onRefresh: () => void
  onRetryOrders: () => void
  onToggleStatus: (courier: Courier) => void
}): ReactElement {
  const { t } = useTranslation()

  if (isLoading && courier === null) {
    return <CourierDetailSkeleton onClose={onClose} />
  }

  if (courier === null) {
    return (
      <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {t('couriers.detail.title')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('couriers.detail.missing')}
            </p>
          </div>
          <IconButton label={t('couriers.detail.close')} onClick={onClose}>
            <X />
          </IconButton>
        </div>
      </aside>
    )
  }

  const courierName = formatCourierName(courier)
  const location = formatCourierLocation(courier)
  const detailStats = getCourierDetailStats(orders)
  const canToggleStatus =
    courier.isActive &&
    courier.status !== 'inactive' &&
    courier.status !== 'suspended'

  return (
    <aside className="rounded-2xl border border-border bg-card shadow-sm xl:sticky xl:top-4 xl:self-start">
      <div className="border-b border-border p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-semibold',
                  courier.isOnline
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {getCourierInitials(courier)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-foreground">
                  {courierName}
                </h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {courier.email}
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <IconButton
              label={t('couriers.detail.refresh')}
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn(isRefreshing && 'animate-spin')} />
            </IconButton>
            <IconButton label={t('couriers.detail.close')} onClick={onClose}>
              <X />
            </IconButton>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <OnlineBadge isOnline={courier.isOnline} />
          <CourierStatusBadge status={courier.status} />
          {!courier.isActive && (
            <span className="rounded-full bg-destructive/10 px-2 py-1 text-[11px] font-semibold text-destructive">
              {t('couriers.disabled')}
            </span>
          )}
        </div>

        <Button
          type="button"
          onClick={() => onToggleStatus(courier)}
          disabled={!canToggleStatus || isUpdatingStatus}
          className={cn(
            'mt-5 w-full',
            courier.isOnline
              ? 'bg-zinc-900 text-white hover:bg-zinc-800'
              : 'bg-emerald-600 text-white hover:bg-emerald-700',
          )}
        >
          <Power />
          {isUpdatingStatus
            ? t('couriers.actions.updating')
            : courier.isOnline
              ? t('couriers.actions.setOffline')
              : t('couriers.actions.setOnline')}
        </Button>
        {!canToggleStatus && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t('couriers.actions.toggleUnavailable')}
          </p>
        )}
        {updateError !== null && (
          <p className="mt-2 text-xs font-medium text-destructive">
            {updateError.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 p-5">
        <CourierDetailMetric
          icon={<PackageCheck />}
          label={t('couriers.detail.assigned')}
          value={isOrdersError ? '-' : detailStats.totalOrders}
        />
        <CourierDetailMetric
          icon={<Activity />}
          label={t('couriers.detail.completed')}
          value={isOrdersError ? '-' : detailStats.completedOrders}
        />
        <CourierDetailMetric
          icon={<Clock3 />}
          label={t('couriers.detail.active')}
          value={isOrdersError ? '-' : detailStats.activeOrders}
        />
        <CourierDetailMetric
          icon={<UserRound />}
          label={t('couriers.detail.profile')}
          value={
            courier.isActive
              ? t('couriers.detail.profileActive')
              : t('couriers.detail.profileDisabled')
          }
        />
      </div>

      <div className="space-y-4 border-t border-border p-5">
        <CourierDetailField
          icon={<MapPin />}
          label={t('couriers.detail.gpsPosition')}
          value={location.label}
          title={location.title}
        />
        <CourierDetailField
          icon={<Clock3 />}
          label={t('couriers.detail.lastSeen')}
          value={formatLastSeen(courier.lastSeenAt)}
        />
        <CourierDetailField
          icon={<UserRound />}
          label={t('couriers.detail.phone')}
          value={courier.phone ?? t('couriers.detail.noPhone')}
        />
      </div>

      <div className="border-t border-border p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t('couriers.detail.ordersToday')}
          </h3>
          {isOrdersError && (
            <button
              type="button"
              onClick={onRetryOrders}
              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/15"
            >
              {t('couriers.detail.retryOrders')}
            </button>
          )}
        </div>
        {isOrdersError ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t('couriers.detail.ordersLoadError')}
          </p>
        ) : orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t('couriers.detail.noOrders')}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {orders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {formatOrderNumber(order)}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {order.deliveryAddress}
                </p>
              </div>
            ))}
            {orders.length > 4 && (
              <p className="text-xs text-muted-foreground">
                {t('couriers.detail.moreOrders', { count: orders.length - 4 })}
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

function CourierDetailMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}): ReactElement {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:h-4 [&_svg]:w-4" aria-hidden="true">
          {icon}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      <p className="mt-2 text-lg font-semibold text-foreground tabular-nums">
        {value}
      </p>
    </div>
  )
}

function CourierDetailField({
  icon,
  label,
  value,
  title,
}: {
  icon: React.ReactNode
  label: string
  value: string
  title?: string
}): ReactElement {
  return (
    <div className="flex min-w-0 gap-3">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:h-4 [&_svg]:w-4"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground" title={title}>
          {value}
        </p>
      </div>
    </div>
  )
}

function IconButton({
  label,
  children,
  onClick,
  disabled = false,
}: {
  label: string
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}): ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4"
    >
      {children}
    </button>
  )
}

function CourierDetailSkeleton({ onClose }: { onClose: () => void }): ReactElement {
  const { t } = useTranslation()
  return (
    <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-44 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <IconButton label={t('couriers.detail.close')} onClick={onClose}>
          <X />
        </IconButton>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </aside>
  )
}

function OnlineBadge({ isOnline }: { isOnline: boolean }): ReactElement {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset',
        isOnline
          ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20'
          : 'bg-zinc-500/10 text-zinc-600 ring-zinc-500/20',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isOnline ? 'bg-emerald-500' : 'bg-zinc-400',
        )}
        aria-hidden="true"
      />
      {isOnline ? t('couriers.status.online') : t('couriers.status.offline')}
    </span>
  )
}

function CourierStatusBadge({
  status,
}: {
  status: CourierStatus
}): ReactElement {
  const { t } = useTranslation()
  const statusStyle = COURIER_STATUS_STYLES[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset',
        statusStyle.badgeClassName,
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', statusStyle.dotClassName)}
        aria-hidden="true"
      />
      {t(`couriers.status.${status}`)}
    </span>
  )
}

function CouriersSkeleton(): ReactElement {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-72 max-w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="grid gap-3 px-4 py-3 md:grid-cols-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
              <div className="space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-44 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted md:justify-self-end" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </section>
  )
}

function CouriersEmptyState({ hasSearch }: { hasSearch: boolean }): ReactElement {
  const { t } = useTranslation()
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <span className="text-lg font-semibold text-muted-foreground">0</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">
        {hasSearch ? t('couriers.emptyFilters') : t('couriers.emptyRoster')}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasSearch
          ? t('couriers.emptyFiltersHint')
          : t('couriers.emptyRosterHint')}
      </p>
    </div>
  )
}

interface CourierStats {
  total: number
  online: number
  busy: number
  withLocation: number
}

interface CourierDetailStats {
  totalOrders: number
  activeOrders: number
  completedOrders: number
}

function getCourierStats(couriers: Courier[]): CourierStats {
  return {
    total: couriers.length,
    online: couriers.filter((courier) => courier.isOnline).length,
    busy: couriers.filter((courier) => courier.status === 'busy').length,
    withLocation: couriers.filter(hasCourierLocation).length,
  }
}

function getCourierDetailStats(orders: Order[]): CourierDetailStats {
  return {
    totalOrders: orders.length,
    activeOrders: orders.filter((order) =>
      ['assigned', 'handed_over', 'in_transit'].includes(order.status),
    ).length,
    completedOrders: orders.filter((order) => order.status === 'delivered').length,
  }
}

function countAssignedOrdersByCourier(orders: Order[]): Map<string, number> {
  const counts = new Map<string, number>()

  for (const order of orders) {
    if (!order.assignedCourierId) continue

    counts.set(
      order.assignedCourierId,
      (counts.get(order.assignedCourierId) ?? 0) + 1,
    )
  }

  return counts
}

function courierMatchesSearch(courier: Courier, normalizedSearch: string): boolean {
  if (normalizedSearch.length === 0) return true

  return [
    formatCourierName(courier),
    courier.email,
    courier.phone ?? '',
    courier.status,
    courier.isOnline ? 'online' : 'offline',
  ]
    .join(' ')
    .toLowerCase()
    .includes(normalizedSearch)
}

function formatCourierName(courier: Courier): string {
  const fullName = `${courier.firstName} ${courier.lastName ?? ''}`.trim()
  return fullName.length > 0 ? fullName : courier.email
}

function getCourierInitials(courier: Courier): string {
  const first = courier.firstName.trim().charAt(0)
  const last = courier.lastName?.trim().charAt(0) ?? ''
  const initials = `${first}${last}`.trim()

  if (initials.length > 0) return initials.toUpperCase()

  return courier.email.slice(0, 2).toUpperCase()
}

function formatCourierLocation(courier: Courier): {
  label: string
  title: string
  hasGps: boolean
} {
  if (!hasCourierLocation(courier)) {
    return {
      label: i18n.t('couriers.noGps'),
      title: i18n.t('couriers.noGpsTitle'),
      hasGps: false,
    }
  }

  const latitude = courier.latitude.toFixed(5)
  const longitude = courier.longitude.toFixed(5)

  return {
    label: `${latitude}, ${longitude}`,
    title: i18n.t('couriers.gpsTitle', { lat: latitude, lng: longitude }),
    hasGps: true,
  }
}

function hasCourierLocation(courier: Courier): courier is Courier & {
  latitude: number
  longitude: number
} {
  return courier.latitude !== null && courier.longitude !== null
}

function formatLastSeen(value: string | null): string {
  if (!value) return i18n.t('common.never')

  const seenAt = new Date(value)
  const timestamp = seenAt.getTime()

  if (Number.isNaN(timestamp)) return i18n.t('couriers.unknownLastSeen')

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000))

  if (diffMinutes < 1) return i18n.t('common.justNow')
  if (diffMinutes < 60) return i18n.t('common.minutesAgo', { count: diffMinutes })

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return i18n.t('common.hoursAgo', { count: diffHours })

  return seenAt.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatOrderNumber(order: Order): string {
  return (
    order.orderNumber ??
    order.externalId ??
    i18n.t('couriers.orderFallback', { id: order.id.slice(0, 8) })
  )
}
