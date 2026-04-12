export type IntegrationStatus = 'active' | 'inactive' | 'error'
export type IntegrationType = 'webhook' | 'api'

export interface Integration {
  id: string
  name: string
  type: IntegrationType
  status: IntegrationStatus
  endpoint?: string | null
  eventCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateIntegrationInput {
  name: string
  type: IntegrationType
  endpoint?: string
}

export interface IntegrationLog {
  id: string
  event: string
  success: boolean
  responseStatus?: number | null
  createdAt: string
}
