export type WebNotificationType =
  | 'new-order'
  | 'order-status-change'
  | 'route-change';

export interface WebNotificationEnvelope {
  id: string;
  type: WebNotificationType;
  companyId: string;
  entityType: 'order' | 'route';
  entityId: string;
  title: string;
  message: string;
  createdAt: string;
  data: Record<string, unknown>;
}
