import type { CourierStatus } from './types'

export function isActive(status: CourierStatus): boolean {
  return status === 'active'
}
