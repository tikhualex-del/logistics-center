'use client'

import { useCourier } from '@/features/couriers/hooks'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loader'
import { courierStatusColor } from '@/lib/utils/status-colors'

interface Props {
  courierId: string
}

export function CourierDetailCard({ courierId }: Props) {
  const { data: courier, isLoading } = useCourier(courierId)

  if (isLoading) return <PageLoader />
  if (!courier) return <p className="text-sm text-gray-500">Courier not found.</p>

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{courier.name}</h2>
        <Badge className={courierStatusColor(courier.status)}>{courier.status}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Phone</dt>
          <dd className="font-medium">{courier.phone ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Vehicle</dt>
          <dd className="font-medium">{courier.vehicleType ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">License Plate</dt>
          <dd className="font-medium">{courier.licensePlate ?? '—'}</dd>
        </div>
      </dl>
    </div>
  )
}
