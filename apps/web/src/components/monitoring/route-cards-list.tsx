'use client'

import Link from 'next/link'
import { useRoutes } from '@/features/routes/hooks'
import { RouteStatusBadge } from '@/components/routes/route-status-badge'
import { SlaStatusBadge } from '@/components/sla/sla-status-badge'
import { PageLoader } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { ROUTES } from '@/constants/routes'

export function RouteCardsList() {
  const { data: routes, isLoading } = useRoutes()

  if (isLoading) return <PageLoader />

  const activeRoutes = (routes ?? []).filter((r) =>
    ['draft', 'assigned'].includes(r.status),
  )

  if (!activeRoutes.length) {
    return (
      <EmptyState
        title="Нет активных маршрутов"
        description="Создайте маршруты на карте и они появятся здесь"
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activeRoutes.map((route) => (
        <div
          key={route.id}
          className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-gray-900 truncate">{route.name}</p>
            <RouteStatusBadge status={route.status} />
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Курьер</span>
              <span className="font-medium text-gray-700">{route.courier?.name ?? 'Не назначен'}</span>
            </div>
            <div className="flex justify-between">
              <span>Заказов</span>
              <span className="font-medium text-gray-700">{route.orderCount}</span>
            </div>
          </div>

          {/* SLA mini-summary */}
          <div className="flex flex-wrap gap-1">
            {route.slaSummary.at_risk > 0 && (
              <SlaStatusBadge status="at_risk" />
            )}
            {route.slaSummary.overdue > 0 && (
              <SlaStatusBadge status="overdue" />
            )}
            {route.slaSummary.on_track > 0 && (
              <span className="text-xs text-gray-400">
                {route.slaSummary.on_track} по плану
              </span>
            )}
          </div>

          <Link
            href={ROUTES.ROUTE(route.id)}
            className="block text-center rounded-md border border-gray-200 py-1.5 text-xs font-medium text-blue-600 hover:bg-gray-50"
          >
            Открыть маршрут
          </Link>
        </div>
      ))}
    </div>
  )
}
