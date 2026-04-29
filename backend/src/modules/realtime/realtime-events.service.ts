import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRole } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import type { CourierLocationUpdatedEvent } from '../couriers/couriers.events';
import {
  buildOrderCreatedNotification,
  buildOrderStatusChangedNotification,
  buildRouteChangedNotification,
} from '../notifications/notification-builders';
import type {
  OrderCreatedEvent,
  OrderStatusChangedEvent,
} from '../orders/orders.events';
import type {
  RouteBuiltEvent,
  RouteCancelledEvent,
  RouteUpdatedEvent,
} from '../routing/routing.events';
import { REALTIME_EVENTS } from './realtime.events';
import { RealtimeGateway } from './realtime.gateway';
import type {
  CourierLocationRealtimePayload,
  OrderStatusChangedRealtimePayload,
  RouteUpdatedRealtimePayload,
} from './realtime.types';

@Injectable()
export class RealtimeEventsService {
  constructor(
    private readonly gateway: RealtimeGateway,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RealtimeEventsService.name);
  }

  @OnEvent(DOMAIN_EVENTS.COURIER.LOCATION_UPDATED)
  handleCourierLocationUpdated(event: CourierLocationUpdatedEvent): void {
    const payload = mapCourierLocationUpdated(event);

    this.gateway.emitToRole(
      event.companyId,
      UserRole.dispatcher,
      REALTIME_EVENTS.COURIER_LOCATION_UPDATED,
      payload,
    );
    this.gateway.emitToRole(
      event.companyId,
      UserRole.admin,
      REALTIME_EVENTS.COURIER_LOCATION_UPDATED,
      payload,
    );
  }

  @OnEvent(DOMAIN_EVENTS.ORDER.STATUS_CHANGED)
  handleOrderStatusChanged(event: OrderStatusChangedEvent): void {
    const payload = mapOrderStatusChanged(event);

    this.emitToOperations(
      event.companyId,
      REALTIME_EVENTS.ORDER_STATUS_CHANGED,
      payload,
    );
    this.gateway.emitToRole(
      event.companyId,
      UserRole.dispatcher,
      REALTIME_EVENTS.ALERT_NEW,
      buildOrderStatusChangedNotification(event),
    );
  }

  @OnEvent(DOMAIN_EVENTS.ORDER.CREATED)
  handleOrderCreated(event: OrderCreatedEvent): void {
    this.gateway.emitToRole(
      event.companyId,
      UserRole.dispatcher,
      REALTIME_EVENTS.ALERT_NEW,
      buildOrderCreatedNotification(event),
    );
  }

  @OnEvent(DOMAIN_EVENTS.ROUTE.BUILT)
  handleRouteBuilt(event: RouteBuiltEvent): void {
    this.handleRouteChange('built', event);
  }

  @OnEvent(DOMAIN_EVENTS.ROUTE.UPDATED)
  handleRouteUpdated(event: RouteUpdatedEvent): void {
    this.handleRouteChange('updated', event);
  }

  @OnEvent(DOMAIN_EVENTS.ROUTE.CANCELLED)
  handleRouteCancelled(event: RouteCancelledEvent): void {
    this.handleRouteChange('cancelled', event);
  }

  private handleRouteChange(
    action: 'built' | 'updated' | 'cancelled',
    event: RouteBuiltEvent | RouteUpdatedEvent | RouteCancelledEvent,
  ): void {
    const payload = mapRouteUpdated(action, event);

    this.emitToOperations(
      event.companyId,
      REALTIME_EVENTS.ROUTE_UPDATED,
      payload,
    );
    this.gateway.emitToRole(
      event.companyId,
      UserRole.dispatcher,
      REALTIME_EVENTS.ALERT_NEW,
      buildRouteChangedNotification(action, event),
    );
  }

  private emitToOperations(
    companyId: string,
    event: string,
    payload: unknown,
  ): void {
    this.gateway.emitToRole(companyId, UserRole.dispatcher, event, payload);
    this.gateway.emitToRole(companyId, UserRole.admin, event, payload);

    this.logger.debug(
      {
        companyId,
        event,
      },
      'Realtime event emitted to operations rooms',
    );
  }
}

function mapCourierLocationUpdated(
  event: CourierLocationUpdatedEvent,
): CourierLocationRealtimePayload {
  return {
    companyId: event.companyId,
    entityId: event.courierId,
    timestamp: new Date().toISOString(),
    courierId: event.courierId,
    latitude: event.latitude,
    longitude: event.longitude,
    lastSeenAt: event.lastSeenAt?.toISOString() ?? null,
    status: event.courier.status,
    firstName: event.courier.firstName,
    lastName: event.courier.lastName,
  };
}

function mapOrderStatusChanged(
  event: OrderStatusChangedEvent,
): OrderStatusChangedRealtimePayload {
  return {
    companyId: event.companyId,
    entityId: event.orderId,
    timestamp: new Date().toISOString(),
    orderId: event.orderId,
    orderNumber: event.order.orderNumber,
    externalId: event.order.externalId,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    reason: event.reason,
    deliveryAddress: event.order.deliveryAddress,
  };
}

function mapRouteUpdated(
  action: 'built' | 'updated' | 'cancelled',
  event: RouteBuiltEvent | RouteUpdatedEvent | RouteCancelledEvent,
): RouteUpdatedRealtimePayload {
  return {
    companyId: event.companyId,
    entityId: event.routeId,
    timestamp: new Date().toISOString(),
    routeId: event.routeId,
    action,
    status: event.route.status,
    version: event.route.version,
    routeDate: event.route.routeDate.toISOString(),
    courierId: event.route.courierId,
    orderCount: event.route.routePoints.length,
  };
}
