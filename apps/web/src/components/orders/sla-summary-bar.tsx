import type { SlaSummary } from '@/features/sla/types'
import { SlaStatusBadge } from '@/components/sla/sla-status-badge'

interface Props {
  summary: SlaSummary
}

export function SlaSummaryBar({ summary }: Props) {
  const entries = Object.entries(summary).filter(([key]) => key !== 'total') as [string, number][]

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([status, count]) => (
        count > 0 ? (
          <div key={status} className="flex items-center gap-1">
            <SlaStatusBadge status={status} />
            <span className="text-xs text-gray-500">{count}</span>
          </div>
        ) : null
      ))}
    </div>
  )
}
