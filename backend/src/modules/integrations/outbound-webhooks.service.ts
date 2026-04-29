import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  Prisma,
  IntegrationDirection,
  IntegrationEventStatus,
} from '@prisma/client';
import type { Queue } from 'bull';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { stringifyUnknown } from '../../common/utils/stringify-unknown';
import { PrismaService } from '../../prisma/prisma.service';
import type { OrderStatusChangedEvent } from '../orders/orders.events';
import type {
  RouteBuiltEvent,
  RouteCancelledEvent,
  RouteUpdatedEvent,
} from '../routing/routing.events';
import {
  SUPPORTED_OUTBOUND_WEBHOOK_EVENTS,
  WEBHOOK_DELIVERY_JOB,
  WEBHOOK_DELIVERY_QUEUE,
} from './integrations.constants';
import type {
  OutboundWebhookEnvelope,
  OutboundWebhookJobData,
} from './outbound-webhooks.types';

const activeOutboundIntegrationSelect = {
  id: true,
  company_id: true,
  name: true,
  outbound_webhook_url: true,
  webhook_secret: true,
  settings: true,
} satisfies Prisma.IntegrationSelect;

type ActiveOutboundIntegrationRecord = Prisma.IntegrationGetPayload<{
  select: typeof activeOutboundIntegrationSelect;
}>;

@Injectable()
export class OutboundWebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    @InjectQueue(WEBHOOK_DELIVERY_QUEUE)
    private readonly webhookQueue: Queue<OutboundWebhookJobData>,
  ) {
    this.logger.setContext(OutboundWebhooksService.name);
  }

  @OnEvent(DOMAIN_EVENTS.ORDER.STATUS_CHANGED)
  async handleOrderStatusChanged(
    event: OrderStatusChangedEvent,
  ): Promise<void> {
    if (!event.order.externalId) {
      this.logger.debug(
        {
          companyId: event.companyId,
          orderId: event.orderId,
        },
        'Skipping outbound webhook for order without external ID',
      );
      return;
    }

    await this.enqueueOutboundWebhooks(
      event.companyId,
      DOMAIN_EVENTS.ORDER.STATUS_CHANGED,
      'order',
      event.orderId,
      {
        eventType: DOMAIN_EVENTS.ORDER.STATUS_CHANGED,
        occurredAt: new Date().toISOString(),
        entityType: 'order',
        entityId: event.order.externalId,
        data: {
          externalOrderId: event.order.externalId,
          orderNumber: event.order.orderNumber,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          reason: event.reason,
          deliveryAddress: event.order.deliveryAddress,
          scheduledDate: event.order.scheduledDate?.toISOString() ?? null,
          timeWindowFrom: event.order.timeWindowFrom?.toISOString() ?? null,
          timeWindowTo: event.order.timeWindowTo?.toISOString() ?? null,
        },
      },
    );
  }

  @OnEvent(DOMAIN_EVENTS.ROUTE.BUILT)
  async handleRouteBuilt(event: RouteBuiltEvent): Promise<void> {
    await this.enqueueRouteWebhook(
      event.companyId,
      DOMAIN_EVENTS.ROUTE.BUILT,
      event.routeId,
      {
        routeStatus: event.route.status,
        routeDate: event.route.routeDate.toISOString(),
        version: event.route.version,
        totalDistanceMeters: event.route.totalDistanceMeters,
        totalDurationSeconds: event.route.totalDurationSeconds,
      },
      event.route.routePoints.map((point) => ({
        orderId: point.orderId,
        sequence: point.sequence,
        orderStatus: point.orderStatus,
        deliveryAddress: point.deliveryAddress,
        plannedEta: point.plannedEta?.toISOString() ?? null,
      })),
    );
  }

  @OnEvent(DOMAIN_EVENTS.ROUTE.UPDATED)
  async handleRouteUpdated(event: RouteUpdatedEvent): Promise<void> {
    await this.enqueueRouteWebhook(
      event.companyId,
      DOMAIN_EVENTS.ROUTE.UPDATED,
      event.routeId,
      {
        routeStatus: event.route.status,
        routeDate: event.route.routeDate.toISOString(),
        version: event.route.version,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        totalDistanceMeters: event.route.totalDistanceMeters,
        totalDurationSeconds: event.route.totalDurationSeconds,
      },
      event.route.routePoints.map((point) => ({
        orderId: point.orderId,
        sequence: point.sequence,
        orderStatus: point.orderStatus,
        deliveryAddress: point.deliveryAddress,
        plannedEta: point.plannedEta?.toISOString() ?? null,
        actualEta: point.actualEta?.toISOString() ?? null,
      })),
    );
  }

  @OnEvent(DOMAIN_EVENTS.ROUTE.CANCELLED)
  async handleRouteCancelled(event: RouteCancelledEvent): Promise<void> {
    await this.enqueueRouteWebhook(
      event.companyId,
      DOMAIN_EVENTS.ROUTE.CANCELLED,
      event.routeId,
      {
        routeStatus: event.route.status,
        routeDate: event.route.routeDate.toISOString(),
        version: event.route.version,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
      },
      event.route.routePoints.map((point) => ({
        orderId: point.orderId,
        sequence: point.sequence,
        orderStatus: point.orderStatus,
        deliveryAddress: point.deliveryAddress,
      })),
    );
  }

  private async enqueueRouteWebhook(
    companyId: string,
    eventType: string,
    routeId: string,
    routeData: Record<string, unknown>,
    routeOrders: Array<Record<string, unknown> & { orderId: string }>,
  ): Promise<void> {
    const orderRefs = await this.loadExternalOrderRefs(
      companyId,
      routeOrders.map((entry) => entry.orderId),
    );

    const serializedOrders = routeOrders
      .map((entry) => {
        const externalOrderId = orderRefs.get(entry.orderId);
        if (!externalOrderId) {
          return null;
        }

        const rest: Record<string, unknown> = { ...entry };
        delete rest['orderId'];

        return {
          externalOrderId,
          ...rest,
        };
      })
      .filter(
        (
          entry,
        ): entry is {
          externalOrderId: string;
        } & Record<string, unknown> => entry !== null,
      );

    if (serializedOrders.length === 0) {
      this.logger.debug(
        {
          companyId,
          routeId,
          eventType,
        },
        'Skipping outbound route webhook because no mapped order references were found',
      );
      return;
    }

    await this.enqueueOutboundWebhooks(companyId, eventType, 'route', routeId, {
      eventType,
      occurredAt: new Date().toISOString(),
      entityType: 'route',
      entityId: null,
      data: {
        ...routeData,
        orders: serializedOrders,
      },
    });
  }

  private async enqueueOutboundWebhooks(
    companyId: string,
    eventType: string,
    entityType: string,
    entityId: string,
    payload: OutboundWebhookEnvelope,
  ): Promise<void> {
    const integrations = await this.findActiveOutboundIntegrations(
      companyId,
      eventType,
    );

    if (integrations.length === 0) {
      return;
    }

    for (const integration of integrations) {
      const integrationEvent = await this.prisma.runWithoutTenant(
        async () =>
          await this.prisma.integrationEvent.create({
            data: {
              company_id: companyId,
              integration_id: integration.id,
              direction: IntegrationDirection.outbound,
              event_type: eventType,
              entity_type: entityType,
              entity_id: entityId,
              status: IntegrationEventStatus.pending,
              attempts: 0,
              payload: toInputJsonValue(payload),
            },
            select: {
              id: true,
            },
          }),
      );

      try {
        await this.webhookQueue.add(
          WEBHOOK_DELIVERY_JOB,
          {
            integrationEventId: integrationEvent.id,
          },
          {
            removeOnComplete: true,
            removeOnFail: true,
          },
        );
      } catch (error) {
        await this.prisma.runWithoutTenant(async () => {
          await this.prisma.integrationEvent.update({
            where: { id: integrationEvent.id },
            data: {
              status: IntegrationEventStatus.failed,
              processed_at: new Date(),
              response: toInputJsonValue({
                error:
                  error instanceof Error
                    ? error.message
                    : 'Queue enqueue failed',
              }),
            },
          });
        });

        this.logger.warn(
          {
            companyId,
            integrationId: integration.id,
            integrationEventId: integrationEvent.id,
            eventType,
            error,
          },
          'Failed to enqueue outbound webhook delivery',
        );
      }
    }
  }

  private async findActiveOutboundIntegrations(
    companyId: string,
    eventType: string,
  ): Promise<ActiveOutboundIntegrationRecord[]> {
    const integrations = await this.prisma.runWithoutTenant(
      async () =>
        await this.prisma.integration.findMany({
          where: {
            company_id: companyId,
            is_active: true,
            outbound_webhook_url: {
              not: null,
            },
            webhook_secret: {
              not: null,
            },
          },
          orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
          select: activeOutboundIntegrationSelect,
        }),
    );

    return integrations.filter((integration) =>
      readWebhookEventTypes(integration.settings).includes(
        eventType as (typeof SUPPORTED_OUTBOUND_WEBHOOK_EVENTS)[number],
      ),
    );
  }

  private async loadExternalOrderRefs(
    companyId: string,
    orderIds: string[],
  ): Promise<Map<string, string>> {
    if (orderIds.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.runWithoutTenant(
      async () =>
        await this.prisma.$queryRaw<
          Array<{
            internal_id: string;
            external_id: string;
          }>
        >(Prisma.sql`
        SELECT "internal_id", "external_id"
        FROM "external_id_map"
        WHERE "company_id" = ${companyId}
          AND "entity_type" = 'order'
          AND "internal_id" IN (${Prisma.join(orderIds)})
      `),
    );

    return new Map(rows.map((row) => [row.internal_id, row.external_id]));
  }
}

function readWebhookEventTypes(value: Prisma.JsonValue | null): string[] {
  const settings = toRecord(value);
  const rawEventTypes = settings?.['eventTypes'];

  if (!Array.isArray(rawEventTypes)) {
    return [...SUPPORTED_OUTBOUND_WEBHOOK_EVENTS];
  }

  return rawEventTypes.filter(
    (entry): entry is string =>
      typeof entry === 'string' &&
      SUPPORTED_OUTBOUND_WEBHOOK_EVENTS.includes(
        entry as (typeof SUPPORTED_OUTBOUND_WEBHOOK_EVENTS)[number],
      ),
  );
}

function toRecord(
  value: Prisma.JsonValue | null,
): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value as Prisma.InputJsonValue;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) =>
      toInputJsonValue(entry),
    ) as Prisma.InputJsonArray;
  }

  if (typeof value === 'object') {
    const inputObject: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) {
        continue;
      }

      inputObject[key] = toInputJsonValue(entry);
    }

    return inputObject as Prisma.InputJsonObject;
  }

  return stringifyUnknown(value);
}
