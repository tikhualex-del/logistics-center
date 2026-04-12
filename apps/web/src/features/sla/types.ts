export type SlaStatus =
  | 'no_deadline'
  | 'on_track'
  | 'at_risk'
  | 'overdue'
  | 'met'
  | 'breached'
  | 'exempt'

export interface SlaSummary {
  total: number
  no_deadline: number
  on_track: number
  at_risk: number
  overdue: number
  met: number
  breached: number
  exempt: number
}
