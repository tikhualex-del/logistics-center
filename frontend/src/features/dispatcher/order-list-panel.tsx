import { useOrders } from '@/hooks'
import { useUiStore } from '@/store'
import {
  getOrderTimeSlotFilter,
  orderMatchesSearch,
} from '@/lib/order-utils'
import { OrderCard } from './order-card'

/**
 * OrderListPanel — scrollable right panel with orders for the selected date.
 *
 * Per CLAUDE.md Section 21: the right panel shows orders; click highlights on map.
 *
 * Data flow:
 *   selectedDate + statusFilter + searchQuery (from ui.store)
 *   → useOrders({ date, status, search }) (TanStack Query)
 *   → list of OrderCard components
 *   → click → setSelectedOrderId (ui.store)
 *
 * Width: fixed w-80 (320px) — defined in parent dispatcher.tsx.
 * Overflow: handled by this component (overflow-y-auto on the list area).
 */
export function OrderListPanel(): React.ReactElement {
  const {
    selectedDate,
    searchQuery,
    statusFilter,
    timeSlotFilter,
    selectedOrderId,
    setSelectedOrderId,
  } = useUiStore()

  const { data, isLoading, isError, refetch } = useOrders({
    date: selectedDate,
    status: statusFilter ?? undefined,
  })

  const orders = data ?? []
  const visibleOrders = orders.filter((order) => {
    const matchesSearch = orderMatchesSearch(order, searchQuery)
    const matchesSlot =
      timeSlotFilter === null || getOrderTimeSlotFilter(order) === timeSlotFilter

    return matchesSearch && matchesSlot
  })
  const total = visibleOrders.length

  return (
    <aside className="w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Orders</h2>
          {!isLoading && !isError && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {total}
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Click to highlight on map &bull; Drag to assign courier
        </p>
      </div>

      {/* List area — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && <OrderListSkeleton />}

        {!isLoading && isError && (
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Failed to load orders.</p>
            <button
              onClick={() => void refetch()}
              className="mt-2 text-xs text-primary underline underline-offset-2 hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && visibleOrders.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No orders for this date.</p>
            {(statusFilter || timeSlotFilter || searchQuery) && (
              <p className="text-xs text-muted-foreground mt-1">
                Try clearing the filters.
              </p>
            )}
          </div>
        )}

        {!isLoading && !isError && visibleOrders.length > 0 && (
          <div className="p-2 space-y-1">
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrderId === order.id}
                onSelect={setSelectedOrderId}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

/** Skeleton placeholder while orders are loading */
function OrderListSkeleton(): React.ReactElement {
  return (
    <div className="p-2 space-y-1">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="p-3 rounded-md border border-border animate-pulse"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="h-3 w-16 rounded-full bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
          <div className="h-3 w-full rounded bg-muted mt-2" />
          <div className="flex justify-between mt-2">
            <div className="h-3 w-10 rounded bg-muted" />
            <div className="h-3 w-14 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
