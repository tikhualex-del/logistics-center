import { useTranslation } from 'react-i18next'
import { Check, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatDeliveryWindow,
  getOrderDisplayId,
  getStatusColor,
  getStatusLabel,
} from '@/lib/order-utils'
import type { Order } from '@/api/orders.api'

interface OrderCardProps {
  order: Order
  isSelected: boolean
  onSelect: (id: string, multiSelect?: boolean) => void
}

/**
 * OrderCard — single order item in the dispatcher right panel list.
 *
 * Displays:
 *   [Status badge]  [Order ID]
 *   [Address — truncated]
 *   [Time slot]  [Courier status]
 *
 * Click → highlights on map (sets selectedOrderId in UI store).
 *
 * Drag & drop (HTML5 native):
 *   draggable="true" + onDragStart stores orderId in dataTransfer.
 *   This is the drag SOURCE for courier assignment (7.2c drop target).
 */
export function OrderCard({ order, isSelected, onSelect }: OrderCardProps): React.ReactElement {
  const { t } = useTranslation()
  function handleClick(): void {
    onSelect(order.id, true)
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>): void {
    e.dataTransfer.setData('orderId', order.id)
    e.dataTransfer.setData('application/x-order-id', order.id)
    e.dataTransfer.setData('text/plain', order.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(order.id, true)
    }
  }

  const displayId = getOrderDisplayId(order)
  const timeSlot = formatDeliveryWindow(
    order.scheduledDate,
    order.timeWindowFrom,
    order.timeWindowTo,
  ).replace('-', ' - ')
  const isAssigned = order.assignedCourierId !== null
  const serviceDuration = getServiceDurationMinutes(order)

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragStart={handleDragStart}
      aria-pressed={isSelected}
      aria-label={`${displayId}, ${getStatusLabel(order.status)}, ${order.deliveryAddress}`}
      className={cn(
        'group grid grid-cols-[1rem_minmax(0,1fr)] gap-2 rounded-md border px-1.5 py-2.5 cursor-pointer transition-all select-none',
        'active:scale-[0.99]',
        isSelected
          ? 'border-violet-500/35 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.1)]'
          : 'border-slate-800 bg-slate-950/55 hover:border-slate-700 hover:bg-slate-900/70',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors',
          isSelected
            ? 'border-violet-500 bg-violet-600 text-white'
            : 'border-slate-700 bg-slate-950 text-transparent group-hover:border-slate-600',
        )}
        aria-hidden="true"
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'shrink-0 rounded-md px-2 py-1 text-[10px] font-bold leading-none',
                getStatusColor(order.status),
                isSelected && 'ring-1 ring-violet-400/20',
              )}
            >
              {getStatusLabel(order.status)}
            </span>
            <span className="truncate text-xs font-bold text-slate-100">
              {displayId}
            </span>
          </div>
          <span className="shrink-0 text-xs text-slate-300 tabular-nums">
            {timeSlot}
          </span>
        </div>

        <div className="mt-2 flex items-end justify-between gap-3">
          <p
            className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium leading-tight text-slate-300"
            title={order.deliveryAddress}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-100" strokeWidth={2.3} />
            <span className="truncate">{order.deliveryAddress}</span>
          </p>
          <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
            {serviceDuration} мин
          </span>
        </div>

        {isAssigned && (
          <span
            className={cn(
              'mt-2 inline-flex text-[10px] font-medium leading-none',
              isAssigned ? 'text-green-300' : 'text-slate-500',
            )}
          >
            {t('orders.assigned')}
          </span>
        )}
      </div>
    </div>
  )
}

function getServiceDurationMinutes(order: Order): number {
  const metadataDuration = getMetadataDurationMinutes(order.metadata)
  if (metadataDuration !== null) return metadataDuration

  return 60
}

function getMetadataDurationMinutes(
  metadata: Record<string, unknown> | null,
): number | null {
  if (!metadata) return null

  const value =
    metadata.serviceDurationMinutes ??
    metadata.deliveryDurationMinutes ??
    metadata.durationMinutes

  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(1, Math.round(value))
    : null
}
