'use client'

import { useRoute } from '@/features/routes/hooks'
import { RouteStatusBadge } from './route-status-badge'
import { SlaSummaryBar } from '@/components/orders/sla-summary-bar'
import { PageLoader } from '@/components/ui/loader'

interface Props {
  routeId: string
}

export function RouteDetailCard({ routeId }: Props) {
  const { data: route, isLoading } = useRoute(routeId)

  if (isLoading) return <PageLoader />
  if (!route) return <p className="text-sm text-gray-500">Route not found.</p>

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{route.name}</h2>
        <RouteStatusBadge status={route.status} />
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Courier</dt>
          <dd className="font-medium">{route.courier?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Orders</dt>
          <dd className="font-medium">{route.orderCount}</dd>
        </div>
      </dl>
      <div>
        <p className="mb-2 text-sm text-gray-500">SLA Summary</p>
        <SlaSummaryBar summary={route.slaSummary} />
      </div>
    </div>
  )
}
