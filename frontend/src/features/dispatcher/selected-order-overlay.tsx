import type { ReactElement } from 'react'
import { MapPin, X } from 'lucide-react'
import { useOrder } from '@/hooks'
import { DeadlineBadge, SlaStatusBadge, getOrderSlaStatus } from '@/features/sla'
import { getStatusLabel } from '@/lib/order-utils'
import { useUiStore } from '@/store'

export function SelectedOrderOverlay(): ReactElement | null {
  const selectedOrderId = useUiStore((state) => state.selectedOrderId)
  const clearOrderSelection = useUiStore((state) => state.clearOrderSelection)
  const selectedDate = useUiStore((state) => state.selectedDate)
  const orderQuery = useOrder(selectedOrderId)
  const order = orderQuery.data

  if (!selectedOrderId) return null

  return (
    <aside className="absolute bottom-4 right-4 z-20 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-slate-800 bg-slate-950 p-3 text-slate-100 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            Выбранный заказ
          </p>
          <h2 className="mt-1 truncate text-sm font-semibold">
            {order?.orderNumber ?? order?.externalId ?? selectedOrderId.slice(0, 8)}
          </h2>
        </div>
        <button
          type="button"
          onClick={clearOrderSelection}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-900 hover:text-white"
          aria-label="Закрыть карточку заказа"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {orderQuery.isLoading && (
        <div className="mt-3 h-20 animate-pulse rounded-lg bg-slate-900" />
      )}

      {orderQuery.isError && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          Не удалось загрузить детали заказа.
        </p>
      )}

      {order && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200">
              {getStatusLabel(order.status)}
            </span>
            <SlaStatusBadge status={getOrderSlaStatus(order, selectedDate)} />
          </div>
          <p className="flex items-start gap-2 text-sm text-slate-300">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
            <span>{order.deliveryAddress}</span>
          </p>
          <DeadlineBadge order={order} baseDate={selectedDate} />
        </div>
      )}
    </aside>
  )
}
