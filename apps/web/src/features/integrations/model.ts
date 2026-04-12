import type { IntegrationStatus } from './types'

export function isHealthy(status: IntegrationStatus): boolean {
  return status === 'active'
}
