import httpClient from './http-client'
import type { ApiResponse } from './http-client'

export const SUPPORTED_WEBHOOK_EVENTS = [
  'order.status-changed',
  'route.built',
  'route.updated',
  'route.cancelled',
] as const

export type SupportedWebhookEvent = (typeof SUPPORTED_WEBHOOK_EVENTS)[number]

export interface WebhookRegistration {
  id: string
  companyId: string
  name: string
  provider: string
  isActive: boolean
  outboundWebhookUrl: string | null
  hasWebhookSecret: boolean
  hasInboundSecret: boolean
  eventTypes: string[]
  settings: Record<string, unknown> | null
  createdByUserId: string | null
  createdAt: string
  updatedAt: string
}

export interface UpsertWebhookRegistrationDto {
  name: string
  provider: string
  outboundWebhookUrl: string
  webhookSecret?: string
  inboundSecret?: string
  eventTypes?: string[]
  isActive?: boolean
  settings?: Record<string, unknown>
}

export async function getWebhooks(): Promise<WebhookRegistration[]> {
  const response = await httpClient.get<ApiResponse<WebhookRegistration[]>>(
    '/integrations/webhooks',
  )
  return response.data.data
}

export async function createWebhook(
  data: UpsertWebhookRegistrationDto,
): Promise<WebhookRegistration> {
  const response = await httpClient.post<ApiResponse<WebhookRegistration>>(
    '/integrations/webhooks',
    data,
  )
  return response.data.data
}

export async function updateWebhook(
  id: string,
  data: Partial<UpsertWebhookRegistrationDto>,
): Promise<WebhookRegistration> {
  const response = await httpClient.patch<ApiResponse<WebhookRegistration>>(
    `/integrations/webhooks/${id}`,
    data,
  )
  return response.data.data
}
