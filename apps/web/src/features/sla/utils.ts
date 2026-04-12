import type { SlaSummary } from './types'

export function emptySummary(): SlaSummary {
  return {
    total: 0,
    no_deadline: 0,
    on_track: 0,
    at_risk: 0,
    overdue: 0,
    met: 0,
    breached: 0,
    exempt: 0,
  }
}

export function sumSummaries(a: SlaSummary, b: SlaSummary): SlaSummary {
  return {
    total: a.total + b.total,
    no_deadline: a.no_deadline + b.no_deadline,
    on_track: a.on_track + b.on_track,
    at_risk: a.at_risk + b.at_risk,
    overdue: a.overdue + b.overdue,
    met: a.met + b.met,
    breached: a.breached + b.breached,
    exempt: a.exempt + b.exempt,
  }
}
