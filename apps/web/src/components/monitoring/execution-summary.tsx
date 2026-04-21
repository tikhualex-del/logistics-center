'use client'

import { useMonitoringSummary } from '@/features/monitoring/hooks'

export function ExecutionSummary() {
  const { data: summary, isLoading } = useMonitoringSummary()

  const stats = [
    { label: 'Маршрутов активно', value: summary?.activeRoutes ?? '—' },
    { label: 'Заказов в работе', value: summary?.activeOrders ?? '—' },
    { label: 'Доставлено сегодня', value: summary?.deliveredToday ?? '—' },
    { label: 'Под угрозой SLA', value: summary?.atRiskOrders ?? '—', warn: (summary?.atRiskOrders ?? 0) > 0 },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <p className="text-xs text-gray-500">{stat.label}</p>
          <p className={`mt-1 text-2xl font-bold ${stat.warn ? 'text-red-600' : 'text-gray-900'}`}>
            {isLoading ? '—' : stat.value}
          </p>
        </div>
      ))}
    </div>
  )
}
