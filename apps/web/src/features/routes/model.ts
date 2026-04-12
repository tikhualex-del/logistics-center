import type { RouteStatus } from './types'

export const TERMINAL_ROUTE_STATUSES: RouteStatus[] = ['completed', 'cancelled']

export function isTerminalRoute(status: RouteStatus): boolean {
  return TERMINAL_ROUTE_STATUSES.includes(status)
}
