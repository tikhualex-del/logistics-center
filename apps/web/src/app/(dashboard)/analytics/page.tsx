import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'

export const metadata: Metadata = { title: 'Аналитика' }

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl space-y-6">
      <PageHeader
        title="Аналитика"
        description="Отчёты и метрики по доставкам"
      />
      <div className="rounded-lg border-2 border-dashed border-gray-200 py-24 text-center">
        <p className="text-base font-medium text-gray-400">Аналитика</p>
        <p className="mt-1 text-sm text-gray-400">Раздел будет реализован позже</p>
      </div>
    </div>
  )
}
