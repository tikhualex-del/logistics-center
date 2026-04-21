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
  onSelect: (id: string) => void
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
  function handleClick(): void {
    onSelect(order.id)
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
      onSelect(order.id)
    }
  }

  const displayId = getOrderDisplayId(order)
  const timeSlot = formatDeliveryWindow(
    order.scheduledDate,
    order.timeWindowFrom,
    order.timeWindowTo,
  )
  const isAssigned = order.assignedCourierId !== null

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragStart={handleDragStart}
      aria-pressed={isSelected}
      aria-label={`Order ${displayId}, ${getStatusLabel(order.status)}, ${order.deliveryAddress}`}
      className={cn(
        'p-3 rounded-md border cursor-pointer transition-all select-none',
        'hover:shadow-sm active:scale-[0.99]',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:bg-accent',
      )}
    >
      {/* Row 1: status badge + order ID */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none shrink-0',
            getStatusColor(order.status),
          )}
        >
          {getStatusLabel(order.status)}
        </span>
        <span className="text-xs font-mono text-muted-foreground truncate text-right">
          {displayId}
        </span>
      </div>

      {/* Row 2: delivery address */}
      <p
        className="text-xs text-foreground mt-1.5 leading-tight truncate"
        title={order.deliveryAddress}
      >
        {order.deliveryAddress}
      </p>

      {/* Row 3: time slot + courier indicator */}
      <div className="flex items-center justify-between mt-1.5 gap-2">
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {timeSlot}
        </span>
        <span
          className={cn(
            'text-[10px] font-medium leading-none',
            isAssigned ? 'text-green-700' : 'text-muted-foreground',
          )}
        >
          {isAssigned ? 'Assigned' : 'Unassigned'}
        </span>
      </div>
    </div>
  )
}
