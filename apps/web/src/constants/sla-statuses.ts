// Canonical SLA status vocabulary — mirrors backend lib/sla.ts
// Two semantic groups unified into one field:
//   Active monitoring: no_deadline | on_track | at_risk | overdue
//   Terminal outcomes: met | breached | exempt | no_deadline
export const SLA_STATUSES = {
  NO_DEADLINE: 'no_deadline',
  ON_TRACK: 'on_track',
  AT_RISK: 'at_risk',
  OVERDUE: 'overdue',
  MET: 'met',
  BREACHED: 'breached',
  EXEMPT: 'exempt',
} as const

export type SlaStatus = (typeof SLA_STATUSES)[keyof typeof SLA_STATUSES]

export const SLA_STATUS_LABELS: Record<SlaStatus, string> = {
  no_deadline: 'Без дедлайна',
  on_track: 'По плану',
  at_risk: 'Под угрозой',
  overdue: 'Просрочен',
  met: 'Выполнен',
  breached: 'Нарушен',
  exempt: 'Исключён',
}
