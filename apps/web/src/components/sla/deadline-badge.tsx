import { clsx } from 'clsx'

interface Props {
  deadline?: string | null
  slaStatus: string
}

export function DeadlineBadge({ deadline, slaStatus }: Props) {
  if (!deadline) return <span className="text-sm text-gray-400">No deadline</span>

  const isUrgent = ['at_risk', 'overdue', 'breached'].includes(slaStatus)

  return (
    <span className={clsx('text-sm', isUrgent ? 'font-semibold text-red-600' : 'text-gray-700')}>
      {new Date(deadline).toLocaleString()}
    </span>
  )
}
