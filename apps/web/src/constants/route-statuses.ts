// Canonical route status vocabulary — mirrors backend
export const ROUTE_STATUSES = {
  DRAFT: 'draft',
  ASSIGNED: 'assigned',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type RouteStatus = (typeof ROUTE_STATUSES)[keyof typeof ROUTE_STATUSES]

export const ROUTE_STATUS_LABELS: Record<RouteStatus, string> = {
  draft: 'Draft',
  assigned: 'Assigned',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
