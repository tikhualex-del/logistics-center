import type { SlaStatus } from './types'

export const ACTIVE_SLA_STATUSES: SlaStatus[] = ['on_track', 'at_risk', 'overdue']
export const TERMINAL_SLA_STATUSES: SlaStatus[] = ['met', 'breached', 'exempt']

export const SLA_STATUS_LABELS: Record<SlaStatus, string> = {
  no_deadline: 'No Deadline',
  on_track: 'On Track',
  at_risk: 'At Risk',
  overdue: 'Overdue',
  met: 'Met',
  breached: 'Breached',
  exempt: 'Exempt',
}

export function isBad(status: SlaStatus): boolean {
  return ['at_risk', 'overdue', 'breached'].includes(status)
}
