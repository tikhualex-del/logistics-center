import { apiClient } from '@/lib/api/client'
import type { Integration, CreateIntegrationInput, IntegrationLog } from './types'

export const integrationsApi = {
  list: (): Promise<Integration[]> =>
    apiClient.get('/integrations'),

  get: (id: string): Promise<Integration> =>
    apiClient.get(`/integrations/${id}`),

  create: (input: CreateIntegrationInput): Promise<Integration> =>
    apiClient.post('/integrations', input),

  getLogs: (id: string): Promise<IntegrationLog[]> =>
    apiClient.get(`/integrations/${id}/logs`),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/integrations/${id}`),
}
