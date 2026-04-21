export interface OutboundWebhookEnvelope {
  eventType: string;
  occurredAt: string;
  entityType: string;
  entityId: string | null;
  data: Record<string, unknown>;
}

export interface OutboundWebhookJobData {
  integrationEventId: string;
}
