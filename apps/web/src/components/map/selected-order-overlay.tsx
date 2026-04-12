'use client'

import type { Order } from '@/features/orders/types'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { SlaStatusBadge } from '@/components/sla/sla-status-badge'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

interface Props {
  order: Order
  onClose: () => void
}

export function SelectedOrderOverlay({ order, onClose }: Props) {
  return (
    <div className="absolute bottom-4 left-4 z-20 w-72 rounded-lg border border-gray-600 bg-gray-900/95 p-4 shadow-xl">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <OrderStatusBadge status={order.status} />
          <SlaStatusBadge status={order.slaStatus} />
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-700 hover:text-white"
          aria-label="Снять выбор"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Customer */}
      <p className="text-sm font-semibold text-white truncate">{order.customerName}</p>
      <p className="text-xs text-gray-400 truncate mt-0.5">{order.customerPhone}</p>

      {/* Addresses */}
      <div className="mt-2 space-y-1 text-xs text-gray-400">
        {order.pickupAddress && (
          <div className="flex gap-1.5">
            <span className="shrink-0 text-gray-600">Забор:</span>
            <span className="truncate">{order.pickupAddress}</span>
          </div>
        )}
        <div className="flex gap-1.5">
          <span className="shrink-0 text-gray-600">Доставка:</span>
          <span className="truncate">{order.deliveryAddress}</span>
        </div>
      </div>

      {/* Deadline */}
      <p className="mt-2 text-xs text-gray-500">
        {order.deadline
          ? `Дедлайн: ${new Date(order.deadline).toLocaleString('ru-RU', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            })}`
          : 'Без дедлайна'}
      </p>

      {/* Action link */}
      <Link
        href={ROUTES.ORDER(order.id)}
        className="mt-3 block text-center rounded-md border border-gray-600 py-1.5 text-xs font-medium text-blue-400 hover:bg-gray-800"
      >
        Открыть заказ →
      </Link>
    </div>
  )
}
