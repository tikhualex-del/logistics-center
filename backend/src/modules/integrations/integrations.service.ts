import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  IntegrationDirection,
  IntegrationEventStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { SUPPORTED_OUTBOUND_WEBHOOK_EVENTS } from './integrations.constants';
import { CreateWebhookRegistrationDto } from './dto/create-webhook-registration.dto';
import { InboundIntegrationOrderDto } from './dto/inbound-integration-order.dto';
import {
  IntegrationOrderImportResponseDto,
  type InboundImportResult,
} from './dto/integration-order-response.dto';
import { UpdateWebhookRegistrationDto } from './dto/update-webhook-registration.dto';
import { WebhookRegistrationResponseDto } from './dto/webhook-registration-response.dto';

const INBOUND_ORDER_EVENT_TYPE = 'integration.order.inbound';
const ORDER_ENTITY_TYPE = 'order';

const integrationSelect = {
  id: true,
  company_id: true,
  name: true,
  provider: true,
} satisfies Prisma.IntegrationSelect;

const webhookRegistrationSelect = {
  id: true,
  company_id: true,
  name: true,
  provider: true,
  is_active: true,
  outbound_webhook_url: true,
  inbound_secret: true,
  webhook_secret: true,
  settings: true,
  created_by_user_id: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.IntegrationSelect;

const integrationEventSelect = {
  id: true,
  status: true,
  response: true,
} satisfies Prisma.IntegrationEventSelect;

type IntegrationRecord = Prisma.IntegrationGetPayload<{
  select: typeof integrationSelect;
}>;

type WebhookRegistrationRecord = Prisma.IntegrationGetPayload<{
  select: typeof webhookRegistrationSelect;
}>;

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IntegrationsService.name);
  }

  async registerWebhook(
    companyId: string,
    actorUserId: string,
    dto: CreateWebhookRegistrationDto,
  ): Promise<WebhookRegistrationResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      let registration: WebhookRegistrationRecord;

      try {
        registration = await this.prisma.integration.create({
          data: {
            company_id: companyId,
            name: dto.name,
            provider: dto.provider,
            is_active: dto.isActive ?? true,
            outbound_webhook_url: dto.outboundWebhookUrl,
            inbound_secret: dto.inboundSecret ?? null,
            webhook_secret: dto.webhookSecret,
            settings: buildWebhookSettings(dto.eventTypes, dto.settings),
            created_by_user_id: actorUserId,
          },
          select: webhookRegistrationSelect,
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ConflictException(
            'Integration with this name already exists in this company',
          );
        }

        throw error;
      }

      this.logger.info(
        {
          integrationId: registration.id,
          companyId,
          actorUserId,
          provider: registration.provider,
        },
        'Webhook registration created',
      );

      return mapWebhookRegistration(registration);
    });
  }

  async listWebhooks(companyId: string): Promise<WebhookRegistrationResponseDto[]> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const registrations = await this.prisma.integration.findMany({
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        select: webhookRegistrationSelect,
      });

      return registrations.map(mapWebhookRegistration);
    });
  }

  async updateWebhook(
    companyId: string,
    actorUserId: string,
    integrationId: string,
    dto: UpdateWebhookRegistrationDto,
  ): Promise<WebhookRegistrationResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const currentRegistration = await this.prisma.integration.findFirst({
        where: {
          id: integrationId,
        },
        select: webhookRegistrationSelect,
      });

      if (!currentRegistration) {
        throw new NotFoundException('Webhook registration not found');
      }

      let updatedRegistration: WebhookRegistrationRecord;

      try {
        updatedRegistration = await this.prisma.integration.update({
          where: { id: integrationId },
          data: {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.provider !== undefined ? { provider: dto.provider } : {}),
            ...(dto.isActive !== undefined ? { is_active: dto.isActive } : {}),
            ...(dto.outboundWebhookUrl !== undefined
              ? { outbound_webhook_url: dto.outboundWebhookUrl }
              : {}),
            ...(dto.inboundSecret !== undefined
              ? { inbound_secret: dto.inboundSecret }
              : {}),
            ...(dto.webhookSecret !== undefined
              ? { webhook_secret: dto.webhookSecret }
              : {}),
            ...(dto.eventTypes !== undefined || dto.settings !== undefined
              ? {
                  settings: buildWebhookSettings(
                    dto.eventTypes ??
                      readWebhookEventTypes(currentRegistration.settings),
                    mergeSettings(
                      currentRegistration.settings,
                      dto.settings,
                      dto.eventTypes,
                    ),
                  ),
                }
              : {}),
          },
          select: webhookRegistrationSelect,
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ConflictException(
            'Integration with this name already exists in this company',
          );
        }

        throw error;
      }

      this.logger.info(
        {
          integrationId,
          companyId,
          actorUserId,
        },
        'Webhook registration updated',
      );

      return mapWebhookRegistration(updatedRegistration);
    });
  }

  async importOrder(
    integrationName: string | undefined,
    integrationSecret: string | undefined,
    idempotencyKey: string | undefined,
    dto: InboundIntegrationOrderDto,
  ): Promise<IntegrationOrderImportResponseDto> {
    const normalizedIntegrationName = readRequiredHeader(
      integrationName,
      'X-Integration-Name',
    );
    const normalizedIntegrationSecret = readRequiredHeader(
      integrationSecret,
      'X-Integration-Secret',
    );
    const normalizedIdempotencyKey = readRequiredHeader(
      idempotencyKey,
      'Idempotency-Key',
    );

    return await this.prisma.runWithoutTenant(async () => {
      const integration = await this.resolveIntegration(
        normalizedIntegrationName,
        normalizedIntegrationSecret,
      );

      const integrationEvent = await this.createInboundEventOrGetCached(
        integration,
        normalizedIdempotencyKey,
        dto,
      );

      if ('cachedResponse' in integrationEvent) {
        return integrationEvent.cachedResponse;
      }

      try {
        const existingOrder = await this.resolveExistingMappedOrder(
          integration.company_id,
          dto.externalId,
        );

        const order =
          existingOrder ??
          (await this.ordersService.createOrder(integration.company_id, null, {
            externalId: dto.externalId,
            orderNumber: dto.orderNumber,
            customerName: dto.customerName,
            customerPhone: dto.customerPhone,
            deliveryAddress: dto.deliveryAddress,
            deliveryLatitude: dto.deliveryLatitude,
            deliveryLongitude: dto.deliveryLongitude,
            comment: dto.comment,
            scheduledDate: dto.scheduledDate,
            timeWindowFrom: dto.timeWindowFrom,
            timeWindowTo: dto.timeWindowTo,
            metadata: dto.metadata,
          }));

        await this.ensureExternalIdMap(
          integration.company_id,
          integration.id,
          dto.externalId,
          order.id,
        );

        const response = mapIntegrationOrderResponse(
          normalizedIdempotencyKey,
          integration.name,
          existingOrder ? 'existing' : 'created',
          order,
        );

        await this.markEventSucceeded(
          integrationEvent.id,
          order.id,
          dto.externalId,
          response,
        );

        this.logger.info(
          {
            integrationId: integration.id,
            companyId: integration.company_id,
            externalId: dto.externalId,
            result: response.result,
          },
          'Inbound CRM order processed',
        );

        return response;
      } catch (error) {
        const recoveredOrder = await this.tryRecoverExistingOrder(
          integration.company_id,
          integration.id,
          dto.externalId,
          error,
        );

        if (recoveredOrder) {
          const response = mapIntegrationOrderResponse(
            normalizedIdempotencyKey,
            integration.name,
            'existing',
            recoveredOrder,
          );

          await this.markEventSucceeded(
            integrationEvent.id,
            recoveredOrder.id,
            dto.externalId,
            response,
          );

          return response;
        }

        await this.markEventFailed(integrationEvent.id, dto.externalId, error);
        throw error;
      }
    });
  }

  private async resolveIntegration(
    integrationName: string,
    integrationSecret: string,
  ): Promise<IntegrationRecord> {
    const integration = await this.prisma.integration.findFirst({
      where: {
        name: integrationName,
        inbound_secret: integrationSecret,
        is_active: true,
      },
      select: integrationSelect,
    });

    if (!integration) {
      throw new UnauthorizedException('Invalid integration credentials');
    }

    return integration;
  }

  private async createInboundEventOrGetCached(
    integration: IntegrationRecord,
    idempotencyKey: string,
    dto: InboundIntegrationOrderDto,
  ): Promise<
    | { id: string }
    | {
        cachedResponse: IntegrationOrderImportResponseDto;
      }
  > {
    try {
      const event = await this.prisma.integrationEvent.create({
        data: {
          company_id: integration.company_id,
          integration_id: integration.id,
          direction: IntegrationDirection.inbound,
          event_type: INBOUND_ORDER_EVENT_TYPE,
          entity_type: ORDER_ENTITY_TYPE,
          idempotency_key: idempotencyKey,
          external_id: dto.externalId,
          status: IntegrationEventStatus.processing,
          attempts: 1,
          payload: toInputJsonValue({
            integrationName: integration.name,
            body: dto,
          }),
        },
        select: {
          id: true,
        },
      });

      return { id: event.id };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          cachedResponse: await this.loadCachedInboundResponse(
            integration.company_id,
            idempotencyKey,
          ),
        };
      }

      throw error;
    }
  }

  private async loadCachedInboundResponse(
    companyId: string,
    idempotencyKey: string,
  ): Promise<IntegrationOrderImportResponseDto> {
    const existingEvent = await this.prisma.integrationEvent.findFirst({
      where: {
        company_id: companyId,
        direction: IntegrationDirection.inbound,
        event_type: INBOUND_ORDER_EVENT_TYPE,
        idempotency_key: idempotencyKey,
      },
      orderBy: { created_at: 'desc' },
      select: integrationEventSelect,
    });

    if (!existingEvent) {
      throw new ConflictException('Idempotent request already exists');
    }

    if (
      existingEvent.status === IntegrationEventStatus.succeeded &&
      isPlainObject(existingEvent.response)
    ) {
      return existingEvent.response as unknown as IntegrationOrderImportResponseDto;
    }

    if (existingEvent.status === IntegrationEventStatus.failed) {
      throw new ConflictException(
        'Request with this Idempotency-Key has already failed',
      );
    }

    throw new ConflictException(
      'Request with this Idempotency-Key is already being processed',
    );
  }

  private async resolveExistingMappedOrder(
    companyId: string,
    externalId: string,
  ) {
    const externalIdMap = await this.findExternalIdMap(companyId, externalId);

    if (!externalIdMap) {
      return null;
    }

    try {
      return await this.ordersService.getOrder(companyId, externalIdMap.internal_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ConflictException(
          'External ID mapping points to a missing internal order',
        );
      }

      throw error;
    }
  }

  private async ensureExternalIdMap(
    companyId: string,
    integrationId: string,
    externalId: string,
    internalId: string,
  ): Promise<void> {
    const existingMap = await this.findExternalIdMap(companyId, externalId);

    if (existingMap) {
      if (existingMap.internal_id !== internalId) {
        throw new ConflictException(
          'External ID is already mapped to a different order',
        );
      }

      return;
    }

    await this.prisma.$executeRaw`
      INSERT INTO "external_id_map" (
        "id",
        "company_id",
        "integration_id",
        "entity_type",
        "external_id",
        "internal_id",
        "created_at",
        "updated_at"
      )
      VALUES (
        ${randomUUID()},
        ${companyId},
        ${integrationId},
        ${ORDER_ENTITY_TYPE},
        ${externalId},
        ${internalId},
        NOW(),
        NOW()
      )
    `;
  }

  private async markEventSucceeded(
    integrationEventId: string,
    entityId: string,
    externalId: string,
    response: IntegrationOrderImportResponseDto,
  ): Promise<void> {
    await this.prisma.integrationEvent.update({
      where: { id: integrationEventId },
      data: {
        entity_id: entityId,
        external_id: externalId,
        status: IntegrationEventStatus.succeeded,
        processed_at: new Date(),
        response: toInputJsonValue(response),
      },
    });
  }

  private async markEventFailed(
    integrationEventId: string,
    externalId: string,
    error: unknown,
  ): Promise<void> {
    await this.prisma.integrationEvent.update({
      where: { id: integrationEventId },
      data: {
        external_id: externalId,
        status: IntegrationEventStatus.failed,
        processed_at: new Date(),
        response: {
          error: error instanceof Error ? error.message : 'Unknown error',
        } satisfies Prisma.InputJsonObject,
      },
    });
  }

  private async tryRecoverExistingOrder(
    companyId: string,
    integrationId: string,
    externalId: string,
    error: unknown,
  ) {
    if (
      !(error instanceof ConflictException) ||
      !String(error.message).includes('externalId')
    ) {
      return null;
    }

    const existingOrder = await this.prisma.runWithTenant(companyId, async () =>
      await this.prisma.order.findFirst({
        where: {
          external_id: externalId,
        },
        select: {
          id: true,
        },
      }),
    );

    if (!existingOrder) {
      return null;
    }

    await this.ensureExternalIdMap(
      companyId,
      integrationId,
      externalId,
      existingOrder.id,
    );

    return await this.ordersService.getOrder(companyId, existingOrder.id);
  }

  private async findExternalIdMap(
    companyId: string,
    externalId: string,
  ): Promise<{
    id: string;
    internal_id: string;
  } | null> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        internal_id: string;
      }>
    >`
      SELECT "id", "internal_id"
      FROM "external_id_map"
      WHERE "company_id" = ${companyId}
        AND "entity_type" = ${ORDER_ENTITY_TYPE}
        AND "external_id" = ${externalId}
      LIMIT 1
    `;

    return rows[0] ?? null;
  }
}

function readRequiredHeader(
  value: string | undefined,
  headerName: string,
): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new BadRequestException(`Missing required header: ${headerName}`);
  }

  return normalized;
}

function mapWebhookRegistration(
  integration: WebhookRegistrationRecord,
): WebhookRegistrationResponseDto {
  const settings = toRecord(integration.settings);

  return {
    id: integration.id,
    companyId: integration.company_id,
    name: integration.name,
    provider: integration.provider,
    isActive: integration.is_active,
    outboundWebhookUrl: integration.outbound_webhook_url,
    hasWebhookSecret: Boolean(integration.webhook_secret),
    hasInboundSecret: Boolean(integration.inbound_secret),
    eventTypes: readWebhookEventTypes(integration.settings),
    settings,
    createdByUserId: integration.created_by_user_id,
    createdAt: integration.created_at,
    updatedAt: integration.updated_at,
  };
}

function mapIntegrationOrderResponse(
  idempotencyKey: string,
  integrationName: string,
  result: InboundImportResult,
  order: {
    externalId: string | null;
    orderNumber: string | null;
    status: OrderStatus;
    deliveryAddress: string;
    customerName: string | null;
    customerPhone: string | null;
    scheduledDate: Date | null;
    timeWindowFrom: Date | null;
    timeWindowTo: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
): IntegrationOrderImportResponseDto {
  if (!order.externalId) {
    throw new ConflictException('Inbound order must have an externalId');
  }

  return {
    idempotencyKey,
    integrationName,
    result,
    order: {
      externalId: order.externalId,
      orderNumber: order.orderNumber,
      status: order.status,
      deliveryAddress: order.deliveryAddress,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      scheduledDate: order.scheduledDate,
      timeWindowFrom: order.timeWindowFrom,
      timeWindowTo: order.timeWindowTo,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

function isPlainObject(
  value: Prisma.JsonValue | null,
): value is Prisma.JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toRecord(
  value: Prisma.JsonValue | null,
): Record<string, unknown> | null {
  return isPlainObject(value) ? (value as Record<string, unknown>) : null;
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

function buildWebhookSettings(
  eventTypes?: string[],
  settings?: Record<string, unknown> | null,
): Prisma.InputJsonValue {
  return toInputJsonValue({
    ...(settings ?? {}),
    eventTypes: eventTypes ?? [...SUPPORTED_OUTBOUND_WEBHOOK_EVENTS],
  });
}

function mergeSettings(
  currentSettings: Prisma.JsonValue | null,
  nextSettings?: Record<string, unknown>,
  nextEventTypes?: string[],
): Record<string, unknown> {
  const current = toRecord(currentSettings) ?? {};

  const merged = {
    ...current,
    ...(nextSettings ?? {}),
  };

  if (nextEventTypes !== undefined) {
    merged['eventTypes'] = nextEventTypes;
  }

  return merged;
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
