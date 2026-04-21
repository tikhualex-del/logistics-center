import type { WebNotificationEnvelope } from '../notifications/notifications.types';

export interface CourierLocationRealtimePayload {
  companyId: string;
  entityId: string;
  timestamp: string;
  courierId: string;
  latitude: number;
  longitude: number;
  lastSeenAt: string | null;
  status: string;
  firstName: string;
  lastName: string | null;
}

export interface OrderStatusChangedRealtimePayload {
  companyId: string;
  entityId: string;
  timestamp: string;
  orderId: string;
  orderNumber: string | null;
  externalId: string | null;
  fromStatus: string;
  toStatus: string;
  reason: string | null;
  deliveryAddress: string;
}

export interface RouteUpdatedRealtimePayload {
  companyId: string;
  entityId: string;
  timestamp: string;
  routeId: string;
  action: 'built' | 'updated' | 'cancelled';
  status: string;
  version: number;
  routeDate: string;
  courierId: string | null;
  orderCount: number;
}

export type RealtimeAlertPayload = WebNotificationEnvelope;
