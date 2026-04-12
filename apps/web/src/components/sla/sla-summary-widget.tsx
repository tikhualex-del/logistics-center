import type { SlaSummary } from '@/features/sla/types'
import { SlaStatusBadge } from './sla-status-badge'

interface Props {
  summary: SlaSummary
  title?: string
}

const DISPLAY_KEYS: (keyof Omit<SlaSummary, 'total'>)[] = [
  'on_track', 'at_risk', 'overdue', 'met', 'breached', 'no_deadline', 'exempt',
]

export function SlaSummaryWidget({ summary, title }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {title ? <p className="mb-3 text-sm font-medium text-gray-700">{title}</p> : null}
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-4 flex items-center gap-1 text-xs text-gray-500">
          Total: <span className="font-semibold text-gray-900">{summary.total}</span>
        </div>
        {DISPLAY_KEYS.map((key) => (
          summary[key] > 0 ? (
            <div key={key} className="flex flex-col items-center gap-1">
              <span className="text-lg font-bold text-gray-900">{summary[key]}</span>
              <SlaStatusBadge status={key} />
            </div>
          ) : null
        ))}
      </div>
    </div>
  )
}
