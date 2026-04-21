import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AuditActorRole,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { PrismaService } from '../../prisma/prisma.service';
import type { CourierLocationUpdatedEvent } from '../couriers/couriers.events';
import type {
  PaymentApprovedEvent,
  PaymentCalculatedEvent,
} from '../compensation/payments.events';
import type { OrderCreatedEvent } from '../orders/orders.events';
import type {
  RouteBuiltEvent,
  RouteCancelledEvent,
  RouteUpdatedEvent,
} from '../routing/routing.events';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs.query.dto';

const JSON_NULL = Prisma.JsonNull;

const auditLogSelect = {
  id: true,
  company_id: true,
  actor_id: true,
  actor_role: true,
  action: true,
  entity_type: true,
  entity_id: true,
  before: true,
  after: true,
  request_id: true,
  metadata: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.AuditLogSelect;

type AuditLogRecord = Prisma.AuditLogGetPayload<{
  select: typeof auditLogSelect;
}>;

type AuditActorRoleInput = UserRole | AuditActorRole | null | undefined;

interface AuditEntryInput {
  companyId: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  actorRole?: AuditActorRoleInput;
  requestId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuditService.name);
  }

  async listAuditLogs(
    companyId: string,
    query: ListAuditLogsQueryDto,
  ): Promise<AuditLogResponseDto[]> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const where: Prisma.AuditLogWhereInput = {};

      if (query.action) {
        where.action = query.action;
      }

      if (query.entityType) {
        where.entity_type = query.entityType;
      }

      if (query.entityId) {
        where.entity_id = query.entityId;
      }

      if (query.actorId) {
        where.actor_id = query.actorId;
      }

      if (query.requestId) {
        where.request_id = query.requestId;
      }

      if (query.createdFrom || query.createdTo) {
        where.created_at = {
          ...(query.createdFrom ? { gte: query.createdFrom } : {}),
          ...(query.createdTo ? { lte: query.createdTo } : {}),
        };
      }

      const logs = await this.prisma.auditLog.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        take: query.limit ?? 50,
        select: auditLogSelect,
      });

      return logs.map(mapAuditLog);
    });
  }

  @OnEvent(DOMAIN_EVENTS.ORDER.CREATED)
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.appendAuditEntry({
      companyId: event.companyId,
      action: DOMAIN_EVENTS.ORDER.CREATED,
      entityType: 'order',
      entityId: event.orderId,
      actorId: event.createdByUserId,
      requestId: event.requestId,
      before: null,
      after: event.order as unknown as Record<string, unknown>,
      metadata: {
        source: 'domain-event',
      },
    });
  }

  @OnEvent(DOMAIN_EVENTS.ROUTE.BUILT)
  async handleRouteBuilt(event: RouteBuiltEvent): Promise<void> {
    await this.appendAuditEntry({
      companyId: event.companyId,
      action: DOMAIN_EVENTS.ROUTE.BUILT,
      entityType: 'route',
      entityId: event.routeId,
      actorId: event.actorUserId,
      requestId: event.requestId,
      before: null,
      after: event.route as unknown as Record<string, unknown>,
      metadata: {
        source: 'domain-event',
      },
    });
  }

  @OnEvent(DOMAIN_EVENTS.ROUTE.UPDATED)
  async handleRouteUpdated(event: RouteUpdatedEvent): Promise<void> {
    await this.appendAuditEntry({
      companyId: event.companyId,
      action: DOMAIN_EVENTS.ROUTE.UPDATED,
      entityType: 'route',
      entityId: event.routeId,
      actorId: event.actorUserId,
      requestId: event.requestId,
      before: {
        status: event.fromStatus,
      },
      after: event.route as unknown as Record<string, unknown>,
      metadata: {
        source: 'domain-event',
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
      },
    });
  }

  @OnEvent(DOMAIN_EVENTS.ROUTE.CANCELLED)
  async handleRouteCancelled(event: RouteCancelledEvent): Promise<void> {
    await this.appendAuditEntry({
      companyId: event.companyId,
      action: DOMAIN_EVENTS.ROUTE.CANCELLED,
      entityType: 'route',
      entityId: event.routeId,
      actorId: event.actorUserId,
      requestId: event.requestId,
      before: {
        status: event.fromStatus,
      },
      after: event.route as unknown as Record<string, unknown>,
      metadata: {
        source: 'domain-event',
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
      },
    });
  }

  @OnEvent(DOMAIN_EVENTS.COURIER.LOCATION_UPDATED)
  async handleCourierLocationUpdated(
    event: CourierLocationUpdatedEvent,
  ): Promise<void> {
    await this.appendAuditEntry({
      companyId: event.companyId,
      action: DOMAIN_EVENTS.COURIER.LOCATION_UPDATED,
      entityType: 'courier',
      entityId: event.courierId,
      actorId: event.actorUserId,
      actorRole: event.actorRole,
      requestId: event.requestId,
      before: null,
      after: {
        latitude: event.latitude,
        longitude: event.longitude,
        lastSeenAt: event.lastSeenAt,
        courier: event.courier,
      },
      metadata: {
        source: 'domain-event',
      },
    });
  }

  @OnEvent(DOMAIN_EVENTS.PAYMENT.CALCULATED)
  async handlePaymentCalculated(event: PaymentCalculatedEvent): Promise<void> {
    await this.appendAuditEntry({
      companyId: event.companyId,
      action: DOMAIN_EVENTS.PAYMENT.CALCULATED,
      entityType: 'payment',
      entityId: event.paymentId,
      actorId: event.actorUserId,
      requestId: event.requestId,
      before: {
        status: event.fromStatus,
      },
      after: event.payment as unknown as Record<string, unknown>,
      metadata: {
        source: 'domain-event',
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
      },
    });
  }

  @OnEvent(DOMAIN_EVENTS.PAYMENT.APPROVED)
  async handlePaymentApproved(event: PaymentApprovedEvent): Promise<void> {
    await this.appendAuditEntry({
      companyId: event.companyId,
      action: DOMAIN_EVENTS.PAYMENT.APPROVED,
      entityType: 'payment',
      entityId: event.paymentId,
      actorId: event.actorUserId,
      requestId: event.requestId,
      before: {
        status: event.fromStatus,
      },
      after: event.payment as unknown as Record<string, unknown>,
      metadata: {
        source: 'domain-event',
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
      },
    });
  }

  private async appendAuditEntry(input: AuditEntryInput): Promise<void> {
    await this.prisma.runWithoutTenant(async () => {
      const actorRole = await this.resolveActorRole(
        input.companyId,
        input.actorId ?? null,
        input.actorRole,
      );

      await this.prisma.auditLog.create({
        data: {
          company_id: input.companyId,
          actor_id: input.actorId ?? null,
          actor_role: actorRole,
          action: input.action,
          entity_type: input.entityType,
          entity_id: input.entityId,
          before:
            input.before === undefined || input.before === null
              ? JSON_NULL
              : toInputJsonValue(input.before),
          after:
            input.after === undefined || input.after === null
              ? JSON_NULL
              : toInputJsonValue(input.after),
          request_id: input.requestId ?? null,
          metadata:
            input.metadata === undefined || input.metadata === null
              ? JSON_NULL
              : toInputJsonValue(input.metadata),
        },
      });
    });

    this.logger.info(
      {
        companyId: input.companyId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
      },
      'Audit log appended',
    );
  }

  private async resolveActorRole(
    companyId: string,
    actorId: string | null,
    explicitRole?: AuditActorRoleInput,
  ): Promise<AuditActorRole | null> {
    if (explicitRole) {
      return mapAuditActorRole(explicitRole);
    }

    if (!actorId) {
      return null;
    }

    const actor = await this.prisma.user.findFirst({
      where: {
        id: actorId,
        company_id: companyId,
      },
      select: {
        role: true,
      },
    });

    return actor ? mapAuditActorRole(actor.role) : null;
  }
}

function mapAuditLog(log: AuditLogRecord): AuditLogResponseDto {
  return {
    id: log.id,
    companyId: log.company_id,
    actorId: log.actor_id,
    actorRole: log.actor_role,
    action: log.action,
    entityType: log.entity_type,
    entityId: log.entity_id,
    before: toRecord(log.before),
    after: toRecord(log.after),
    requestId: log.request_id,
    metadata: toRecord(log.metadata),
    createdAt: log.created_at,
    updatedAt: log.updated_at,
  };
}

function toRecord(
  value: Prisma.JsonValue | null,
): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function mapAuditActorRole(role: UserRole | AuditActorRole): AuditActorRole {
  switch (role) {
    case UserRole.admin:
    case AuditActorRole.admin:
      return AuditActorRole.admin;
    case UserRole.dispatcher:
    case AuditActorRole.dispatcher:
      return AuditActorRole.dispatcher;
    case UserRole.courier:
    case AuditActorRole.courier:
      return AuditActorRole.courier;
    case AuditActorRole.system:
      return AuditActorRole.system;
    default:
      return AuditActorRole.system;
  }
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
    return value.map((entry) => toInputJsonValue(entry)) as Prisma.InputJsonArray;
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

  return String(value);
}
