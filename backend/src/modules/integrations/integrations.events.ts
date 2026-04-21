export interface IntegrationWebhookFailedEvent {
  integrationEventId: string;
  companyId: string;
  integrationId: string;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  attempts: number;
  error: string;
}
