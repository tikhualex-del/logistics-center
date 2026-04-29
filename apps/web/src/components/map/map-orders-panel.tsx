'use client'

import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { SlaStatusBadge } from '@/components/sla/sla-status-badge'
import type { Order } from '@/features/orders/types'
import type { MapOrderFilters } from '@/features/map/types'

// All filtering (status, slaStatus, search, date, timeSlot) is handled by
// useMapOrders() in MapShell — this panel is a pure display component.

interface Props {
  orders: Order[]
  isLoading: boolean
  filters: MapOrderFilters
  onFilterChange: (patch: Partial<MapOrderFilters>) => void
  selectedOrderId: string | null
  selectedOrderIds: string[]
  onSelectOrder: (id: string, multiSelect?: boolean) => void
}

export function MapOrdersPanel({
  orders,
  isLoading,
  filters,
  onFilterChange,
  selectedOrderId,
  selectedOrderIds,
  onSelectOrder,
}: Props) {
  const [expanded, setExpanded] = useState(true)

  const hasActiveFilters = filters.status || filters.slaStatus || filters.search || filters.date
  const selectedOrderIdSet = useMemo(
    () => new Set(selectedOrderIds),
    [selectedOrderIds],
  )
  const orderedOrders = useMemo(
    () => prioritizeSelectedOrders(orders, selectedOrderIds),
    [orders, selectedOrderIds],
  )

  return (
    <div
      className={clsx(
        'absolute right-3 top-20 bottom-3 z-10 flex w-80 flex-col rounded-2xl border border-gray-200/60 bg-gray-100/90 shadow-xl backdrop-blur-md transition-transform duration-200',
        expanded ? 'translate-x-0' : 'translate-x-[calc(100%+0.75rem)]',
      )}
    >
      {/* Collapse/expand toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="absolute -left-5 top-1/2 z-20 flex h-24 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-gray-400 bg-gray-300 text-gray-700 shadow-sm transition-colors hover:bg-gray-200"
        aria-label={expanded ? 'Свернуть панель' : 'Развернуть панель'}
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d={expanded ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
        </svg>
      </button>

      {expanded && (
        <>
          {/* Header + search */}
          {/* Header */}
          <div className="shrink-0 border-b border-gray-700 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Заказы</span>
              {!isLoading && (
                <span className="text-xs text-gray-500">{orders.length}</span>
              )}
            </div>
          </div>

          {/* Order list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-blue-400" />
              </div>
            ) : !orders.length ? (
              <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
                <p className="text-sm text-gray-500">Заказов нет</p>
                {hasActiveFilters && (
                  <p className="text-xs text-gray-600">Попробуйте изменить фильтры</p>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-800">
                {orderedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    selected={
                      order.id === selectedOrderId ||
                      selectedOrderIdSet.has(order.id)
                    }
                    onClick={(multiSelect) =>
                      onSelectOrder(order.id, multiSelect)
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Single order card ────────────────────────────────────────────────────────

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

interface OrderCardProps {
  order: Order
  selected: boolean
  onClick: (multiSelect?: boolean) => void
}

function OrderCard({ order, selected, onClick }: OrderCardProps) {
  function handleClick(event: React.MouseEvent<HTMLLIElement>): void {
    onClick(isMultiSelectEvent(event))
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLLIElement>): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick(isMultiSelectEvent(event))
    }
  }

  return (
    <li
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        'cursor-pointer px-3 py-3 transition-colors',
        selected
          ? 'bg-blue-950/60 ring-1 ring-inset ring-blue-500'
          : 'hover:bg-gray-800',
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <OrderStatusBadge status={order.status} />
        <SlaStatusBadge status={order.slaStatus} />
      </div>
      <p className="text-sm font-medium text-gray-100 truncate">{order.customerName}</p>
      <p className="mt-0.5 text-xs text-gray-400 truncate">{order.deliveryAddress}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className={clsx('text-xs', order.deadline ? 'text-gray-400' : 'text-gray-600')}>
          {order.deadline
            ? new Date(order.deadline).toLocaleString('ru-RU', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            })
            : 'Без дедлайна'}
        </span>
        <span className="text-xs text-gray-600 shrink-0">{order.source}</span>
      </div>
    </li>
  )
}

function isMultiSelectEvent(
  event: React.KeyboardEvent | React.MouseEvent,
): boolean {
  return event.ctrlKey || event.metaKey
}
