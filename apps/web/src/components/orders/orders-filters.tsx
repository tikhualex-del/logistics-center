'use client'

import { Select } from '@/components/ui/select'
import { ORDER_STATUS_LABELS } from '@/constants/order-statuses'

interface Props {
  status: string
  onStatusChange: (v: string) => void
  slaStatus: string
  onSlaStatusChange: (v: string) => void
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

const SLA_OPTIONS = [
  { value: '', label: 'All SLA' },
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'met', label: 'Met' },
  { value: 'breached', label: 'Breached' },
  { value: 'no_deadline', label: 'No Deadline' },
  { value: 'exempt', label: 'Exempt' },
]

export function OrdersFilters({ status, onStatusChange, slaStatus, onSlaStatusChange }: Props) {
  return (
    <div className="flex gap-3">
      <Select
        options={STATUS_OPTIONS}
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        aria-label="Filter by status"
      />
      <Select
        options={SLA_OPTIONS}
        value={slaStatus}
        onChange={(e) => onSlaStatusChange(e.target.value)}
        aria-label="Filter by SLA"
      />
    </div>
  )
}
