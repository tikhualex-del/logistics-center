import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { MonitoringShell } from '@/components/monitoring/monitoring-shell'

export const metadata: Metadata = { title: 'Мониторинг' }

export default function MonitoringPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Мониторинг"
        description="Контроль исполнения маршрутов и доставок"
      />
      <MonitoringShell />
    </div>
  )
}
