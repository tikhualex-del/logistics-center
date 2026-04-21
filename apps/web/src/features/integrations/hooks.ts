'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { integrationsApi } from './api'
import type { CreateIntegrationInput } from './types'

const INTEGRATIONS_KEY = 'integrations'

export function useIntegrations() {
  return useQuery({
    queryKey: [INTEGRATIONS_KEY],
    queryFn: () => integrationsApi.list(),
  })
}

export function useIntegration(id: string) {
  return useQuery({
    queryKey: [INTEGRATIONS_KEY, id],
    queryFn: () => integrationsApi.get(id),
    enabled: !!id,
  })
}

export function useIntegrationLogs(id: string) {
  return useQuery({
    queryKey: [INTEGRATIONS_KEY, id, 'logs'],
    queryFn: () => integrationsApi.getLogs(id),
    enabled: !!id,
  })
}

export function useCreateIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateIntegrationInput) => integrationsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [INTEGRATIONS_KEY] }),
  })
}
