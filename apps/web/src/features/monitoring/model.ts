import type { MonitoringSummary } from './types'

export function hasIssues(summary: MonitoringSummary): boolean {
  return summary.atRiskOrders > 0
}
