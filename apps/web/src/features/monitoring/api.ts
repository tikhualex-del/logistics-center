import { apiClient } from '@/lib/api/client'
import type { MonitoringSummary } from './types'

export const monitoringApi = {
  getSummary: (): Promise<MonitoringSummary> =>
    apiClient.get('/monitoring/summary'),
}
