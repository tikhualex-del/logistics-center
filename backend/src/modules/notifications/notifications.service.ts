import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import type {
  OrderCreatedEvent,
  OrderStatusChangedEvent,
} from '../orders/orders.events';
import type {
  RouteBuiltEvent,
  RouteCancelledEvent,
  RouteUpdatedEvent,
} from '../routing/routing.events';
import {
  buildOrderCreatedNotification,
  buildOrderStatusChangedNotification,
  buildRouteChangedNotification,
} from './notification-builders';
import { NotificationsGateway } from './notifications.gateway';
import type { WebNotificationEnvelope } from './notifications.types';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly gateway: NotificationsGateway,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationsService.name);
  }

  @OnEvent(DOMAIN_EVENTS.ORDER.CREATED)
  handleOrderCreated(event: OrderCreatedEvent): void {
    this.dispatch(event.companyId, buildOrderCreatedNotification(event));
  }

  @OnEvent(DOMAIN_EVENTS.ORDER.STATUS_CHANGED)
  handleOrderStatusChanged(event: OrderStatusChangedEvent): void {
    this.dispatch(event.companyId, buildOrderStatusChangedNotification(event));
  }

  @OnEvent(DOMAIN_EVENTS.ROUTE.BUILT)
  handleRouteBuilt(event: RouteBuiltEvent): void {
    this.dispatch(
      event.companyId,
      buildRouteChangedNotification('built', event),
    );
  }

  @OnEvent(DOMAIN_EVENTS.ROUTE.UPDATED)
  handleRouteUpdated(event: RouteUpdatedEvent): void {
    this.dispatch(
      event.companyId,
      buildRouteChangedNotification('updated', event),
    );
  }

  @OnEvent(DOMAIN_EVENTS.ROUTE.CANCELLED)
  handleRouteCancelled(event: RouteCancelledEvent): void {
    this.dispatch(
      event.companyId,
      buildRouteChangedNotification('cancelled', event),
    );
  }

  private dispatch(
    companyId: string,
    notification: WebNotificationEnvelope,
  ): void {
    this.gateway.broadcastToDispatchers(companyId, notification);
    this.logger.debug(
      {
        companyId,
        notificationType: notification.type,
        entityType: notification.entityType,
        entityId: notification.entityId,
      },
      'Notification emitted to dispatcher sockets',
    );
  }
}
