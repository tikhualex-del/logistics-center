'use client'

import { useOrder } from '@/features/orders/hooks'
import { OrderStatusBadge } from './order-status-badge'
import { SlaStatusBadge } from '@/components/sla/sla-status-badge'
import { PageLoader } from '@/components/ui/loader'

interface Props {
  orderId: string
}

export function OrderDetailCard({ orderId }: Props) {
  const { data: order, isLoading } = useOrder(orderId)

  if (isLoading) return <PageLoader />
  if (!order) return <p className="text-sm text-gray-500">Order not found.</p>

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <OrderStatusBadge status={order.status} />
        <SlaStatusBadge status={order.slaStatus} />
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Клиент</dt>
          <dd className="font-medium">{order.customerName}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Телефон</dt>
          <dd className="font-medium">{order.customerPhone || '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">Адрес доставки</dt>
          <dd className="font-medium">{order.deliveryAddress}</dd>
        </div>
        {order.pickupAddress ? (
          <div className="col-span-2">
            <dt className="text-gray-500">Адрес забора</dt>
            <dd className="font-medium">{order.pickupAddress}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-gray-500">Дедлайн</dt>
          <dd className="font-medium">{order.deadline ? new Date(order.deadline).toLocaleString() : '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Источник</dt>
          <dd className="font-medium">{order.source}</dd>
        </div>
        {order.notes ? (
          <div className="col-span-2">
            <dt className="text-gray-500">Заметки</dt>
            <dd className="font-medium">{order.notes}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
