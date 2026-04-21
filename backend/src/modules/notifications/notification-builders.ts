import { randomUUID } from 'node:crypto';
import type { OrderCreatedEvent, OrderStatusChangedEvent } from '../orders/orders.events';
import type {
  RouteBuiltEvent,
  RouteCancelledEvent,
  RouteUpdatedEvent,
} from '../routing/routing.events';
import type { WebNotificationEnvelope } from './notifications.types';

export function buildOrderCreatedNotification(
  event: OrderCreatedEvent,
): WebNotificationEnvelope {
  const orderLabel =
    event.order.orderNumber ?? event.order.externalId ?? event.orderId;

  return {
    id: randomUUID(),
    type: 'new-order',
    companyId: event.companyId,
    entityType: 'order',
    entityId: event.orderId,
    title: 'New order',
    message: `Order ${orderLabel} is ready for dispatch`,
    createdAt: new Date().toISOString(),
    data: {
      orderId: event.orderId,
      orderNumber: event.order.orderNumber,
      externalId: event.order.externalId,
      status: event.order.status,
      deliveryAddress: event.order.deliveryAddress,
      scheduledDate: event.order.scheduledDate?.toISOString() ?? null,
      timeWindowFrom: event.order.timeWindowFrom?.toISOString() ?? null,
      timeWindowTo: event.order.timeWindowTo?.toISOString() ?? null,
    },
  };
}

export function buildOrderStatusChangedNotification(
  event: OrderStatusChangedEvent,
): WebNotificationEnvelope {
  const orderLabel =
    event.order.orderNumber ?? event.order.externalId ?? event.orderId;

  return {
    id: randomUUID(),
    type: 'order-status-change',
    companyId: event.companyId,
    entityType: 'order',
    entityId: event.orderId,
    title: 'Order status changed',
    message: `Order ${orderLabel} changed from ${event.fromStatus} to ${event.toStatus}`,
    createdAt: new Date().toISOString(),
    data: {
      orderId: event.orderId,
      orderNumber: event.order.orderNumber,
      externalId: event.order.externalId,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      reason: event.reason,
      deliveryAddress: event.order.deliveryAddress,
    },
  };
}

export function buildRouteChangedNotification(
  action: 'built' | 'updated' | 'cancelled',
  event: RouteBuiltEvent | RouteUpdatedEvent | RouteCancelledEvent,
): WebNotificationEnvelope {
  return {
    id: randomUUID(),
    type: 'route-change',
    companyId: event.companyId,
    entityType: 'route',
    entityId: event.routeId,
    title: 'Route changed',
    message: `Route ${event.routeId} was ${action}`,
    createdAt: new Date().toISOString(),
    data: {
      routeId: event.routeId,
      action,
      status: event.route.status,
      routeDate: event.route.routeDate.toISOString(),
      version: event.route.version,
      courierId: event.route.courierId,
      totalDistanceMeters: event.route.totalDistanceMeters,
      totalDurationSeconds: event.route.totalDurationSeconds,
      orderCount: event.route.routePoints.length,
    },
  };
}
