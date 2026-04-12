import type { OrderStatus } from '@/constants/order-statuses'
import type { RouteStatus } from '@/constants/route-statuses'
import type { SlaStatus }   from '@/constants/sla-statuses'

// Tailwind className strings for status badges
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  new:       'bg-gray-100 text-gray-700',
  assigned:  'bg-blue-100 text-blue-700',
  picked_up: 'bg-amber-100 text-amber-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  failed:    'bg-red-100 text-red-700',
}

export const ROUTE_STATUS_COLORS: Record<RouteStatus, string> = {
  draft:     'bg-gray-100 text-gray-700',
  assigned:  'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export const SLA_STATUS_COLORS: Record<SlaStatus, string> = {
  no_deadline: 'bg-gray-100 text-gray-500',
  on_track:    'bg-green-100 text-green-700',
  at_risk:     'bg-amber-100 text-amber-700',
  overdue:     'bg-red-100 text-red-700',
  met:         'bg-green-100 text-green-700',
  breached:    'bg-red-100 text-red-700',
  exempt:      'bg-gray-100 text-gray-500',
}

export const USER_STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  invited:   'bg-blue-100 text-blue-700',
  suspended: 'bg-amber-100 text-amber-700',
  removed:   'bg-gray-100 text-gray-500',
}

export const COURIER_STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
}

export const INTEGRATION_STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  error:    'bg-red-100 text-red-700',
}

const FALLBACK = 'bg-gray-100 text-gray-500'

export function orderStatusColor(status: string): string {
  return ORDER_STATUS_COLORS[status as OrderStatus] ?? FALLBACK
}

export function routeStatusColor(status: string): string {
  return ROUTE_STATUS_COLORS[status as RouteStatus] ?? FALLBACK
}

export function slaStatusColor(status: string): string {
  return SLA_STATUS_COLORS[status as SlaStatus] ?? FALLBACK
}

export function userStatusColor(status: string): string {
  return USER_STATUS_COLORS[status] ?? FALLBACK
}

export function courierStatusColor(status: string): string {
  return COURIER_STATUS_COLORS[status] ?? FALLBACK
}

export function integrationStatusColor(status: string): string {
  return INTEGRATION_STATUS_COLORS[status] ?? FALLBACK
}
