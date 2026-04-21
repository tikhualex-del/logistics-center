export const WEBHOOK_DELIVERY_QUEUE = 'webhook-delivery';
export const WEBHOOK_DELIVERY_JOB = 'deliver-webhook';

export const WEBHOOK_RETRY_DELAYS_MS = [
  30_000,
  2 * 60_000,
  10 * 60_000,
  30 * 60_000,
  2 * 60 * 60_000,
] as const;

export const SUPPORTED_OUTBOUND_WEBHOOK_EVENTS = [
  'order.status-changed',
  'route.built',
  'route.updated',
  'route.cancelled',
] as const;

export type SupportedOutboundWebhookEvent =
  (typeof SUPPORTED_OUTBOUND_WEBHOOK_EVENTS)[number];
