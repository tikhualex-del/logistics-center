'use client'

import { useCouriers } from '@/features/couriers/hooks'
import { useOrders } from '@/features/orders/hooks'
import { PageLoader } from '@/components/ui/loader'

export function CourierProgressPanel() {
  const { data: couriers, isLoading: couriersLoading } = useCouriers()
  const { data: orders } = useOrders()

  if (couriersLoading) return <PageLoader />

  const activeCouriers = (couriers ?? []).filter((c) => c.status === 'active')

  if (!activeCouriers.length) {
    return (
      <p className="text-sm text-gray-500">Нет активных курьеров</p>
    )
  }

  return (
    <div className="space-y-3">
      {activeCouriers.map((courier) => {
        const courierOrders = (orders ?? []).filter(
          (o) => o.courierId === courier.id && ['assigned', 'picked_up'].includes(o.status),
        )
        const delivered = (orders ?? []).filter(
          (o) => o.courierId === courier.id && o.status === 'delivered',
        ).length

        return (
          <div
            key={courier.id}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              {courier.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{courier.name}</p>
              <p className="text-xs text-gray-500">
                {courierOrders.length} в работе &middot; {delivered} доставлено
              </p>
            </div>
            <span className="text-xs text-gray-400">{courier.vehicleType ?? '—'}</span>
          </div>
        )
      })}
    </div>
  )
}
