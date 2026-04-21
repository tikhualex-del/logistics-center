'use client'

import { useQuery } from '@tanstack/react-query'
import { monitoringApi } from './api'

export function useMonitoringSummary() {
  return useQuery({
    queryKey: ['monitoring', 'summary'],
    queryFn: () => monitoringApi.getSummary(),
    refetchInterval: 30_000,
  })
}
