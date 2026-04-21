import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHmac } from 'node:crypto';
import {
  IntegrationEventStatus,
  Prisma,
} from '@prisma/client';
import type { Job, Queue } from 'bull';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WEBHOOK_DELIVERY_JOB,
  WEBHOOK_DELIVERY_QUEUE,
  WEBHOOK_RETRY_DELAYS_MS,
} from './integrations.constants';
import type { IntegrationWebhookFailedEvent } from './integrations.events';
import type {
  OutboundWebhookEnvelope,
  OutboundWebhookJobData,
} from './outbound-webhooks.types';

const deliveryEventSelect = {
  id: true,
  company_id: true,
  integration_id: true,
  event_type: true,
  entity_type: true,
  entity_id: true,
  attempts: true,
  payload: true,
  integration: {
    select: {
      id: true,
      name: true,
      is_active: true,
      outbound_webhook_url: true,
      webhook_secret: true,
    },
  },
} satisfies Prisma.IntegrationEventSelect;

type DeliveryEventRecord = Prisma.IntegrationEventGetPayload<{
  select: typeof deliveryEventSelect;
}>;

@Processor(WEBHOOK_DELIVERY_QUEUE)
export class WebhookDeliveryProcessor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(WEBHOOK_DELIVERY_QUEUE)
    private readonly webhookQueue: Queue<OutboundWebhookJobData>,
  ) {
    this.logger.setContext(WebhookDeliveryProcessor.name);
  }

  @Process(WEBHOOK_DELIVERY_JOB)
  async process(job: Job<OutboundWebhookJobData>): Promise<void> {
    const integrationEvent = await this.prisma.runWithoutTenant(async () =>
      await this.prisma.integrationEvent.findFirst({
        where: {
          id: job.data.integrationEventId,
        },
        select: deliveryEventSelect,
      }),
    );

    if (!integrationEvent) {
      this.logger.warn(
        {
          integrationEventId: job.data.integrationEventId,
        },
        'Outbound webhook event not found',
      );
      return;
    }

    if (
      !integrationEvent.integration ||
      !integrationEvent.integration.is_active ||
      !integrationEvent.integration.outbound_webhook_url ||
      !integrationEvent.integration.webhook_secret
    ) {
      await this.markFailed(
        integrationEvent,
        integrationEvent.attempts,
        'Webhook integration is inactive or missing delivery settings',
      );
      return;
    }

    const payload = toRecord(integrationEvent.payload);
    if (!payload) {
      await this.markFailed(
        integrationEvent,
        integrationEvent.attempts,
        'Webhook payload is invalid',
      );
      return;
    }

    const payloadBody = JSON.stringify(payload);
    const signature = signPayload(
      integrationEvent.integration.webhook_secret,
      payloadBody,
    );
    const nextAttempt = integrationEvent.attempts + 1;

    await this.prisma.runWithoutTenant(async () => {
      await this.prisma.integrationEvent.update({
        where: { id: integrationEvent.id },
        data: {
          status: IntegrationEventStatus.processing,
          attempts: nextAttempt,
          signature,
          next_retry_at: null,
        },
      });
    });

    try {
      const response = await sendWebhookRequest(
        integrationEvent.integration.outbound_webhook_url,
        integrationEvent.event_type,
        nextAttempt,
        payloadBody,
        signature,
      );

      if (!response.ok) {
        await this.handleDeliveryFailure(integrationEvent, nextAttempt, {
          statusCode: response.status,
          body: response.body,
        });
        return;
      }

      await this.prisma.runWithoutTenant(async () => {
        await this.prisma.integrationEvent.update({
          where: { id: integrationEvent.id },
          data: {
            status: IntegrationEventStatus.succeeded,
            processed_at: new Date(),
            next_retry_at: null,
            response: toInputJsonValue({
              ok: true,
              statusCode: response.status,
              body: response.body,
            }),
          },
        });
      });
    } catch (error) {
      await this.handleDeliveryFailure(integrationEvent, nextAttempt, {
        error: error instanceof Error ? error.message : 'Webhook request failed',
      });
    }
  }

  private async handleDeliveryFailure(
    integrationEvent: DeliveryEventRecord,
    attempts: number,
    response: Record<string, unknown>,
  ): Promise<void> {
    const retryDelayMs = WEBHOOK_RETRY_DELAYS_MS[attempts - 1];

    if (retryDelayMs !== undefined) {
      const nextRetryAt = new Date(Date.now() + retryDelayMs);

      await this.prisma.runWithoutTenant(async () => {
        await this.prisma.integrationEvent.update({
          where: { id: integrationEvent.id },
          data: {
            status: IntegrationEventStatus.retrying,
            next_retry_at: nextRetryAt,
            response: toInputJsonValue(response),
          },
        });
      });

      await this.webhookQueue.add(
        WEBHOOK_DELIVERY_JOB,
        {
          integrationEventId: integrationEvent.id,
        },
        {
          delay: retryDelayMs,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );

      this.logger.warn(
        {
          integrationEventId: integrationEvent.id,
          integrationId: integrationEvent.integration_id,
          eventType: integrationEvent.event_type,
          attempts,
          retryDelayMs,
        },
        'Outbound webhook delivery scheduled for retry',
      );

      return;
    }

    await this.markFailed(
      integrationEvent,
      attempts,
      typeof response['error'] === 'string'
        ? response['error']
        : `HTTP ${String(response['statusCode'] ?? 'unknown')}`,
      response,
    );
  }

  private async markFailed(
    integrationEvent: DeliveryEventRecord,
    attempts: number,
    errorMessage: string,
    response?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.runWithoutTenant(async () => {
      await this.prisma.integrationEvent.update({
        where: { id: integrationEvent.id },
        data: {
          status: IntegrationEventStatus.failed,
          processed_at: new Date(),
          next_retry_at: null,
          attempts,
          response: toInputJsonValue(
            response ?? {
              error: errorMessage,
            },
          ),
        },
      });
    });

    const payload: IntegrationWebhookFailedEvent = {
      integrationEventId: integrationEvent.id,
      companyId: integrationEvent.company_id,
      integrationId: integrationEvent.integration_id ?? 'unknown-integration',
      eventType: integrationEvent.event_type,
      entityType: integrationEvent.entity_type,
      entityId: integrationEvent.entity_id,
      attempts,
      error: errorMessage,
    };

    try {
      await this.eventEmitter.emitAsync(
        DOMAIN_EVENTS.INTEGRATION.WEBHOOK_FAILED,
        payload,
      );
    } catch (error) {
      this.logger.warn(
        {
          integrationEventId: integrationEvent.id,
          error,
        },
        'integration.webhook-failed event emission failed',
      );
    }

    this.logger.warn(
      {
        integrationEventId: integrationEvent.id,
        integrationId: integrationEvent.integration_id,
        eventType: integrationEvent.event_type,
        attempts,
        error: errorMessage,
      },
      'Outbound webhook delivery failed permanently',
    );
  }
}

function signPayload(secret: string, payloadBody: string): string {
  const digest = createHmac('sha256', secret).update(payloadBody).digest('hex');
  return `sha256=${digest}`;
}

async function sendWebhookRequest(
  url: string,
  eventType: string,
  attempt: number,
  payloadBody: string,
  signature: string,
): Promise<{
  ok: boolean;
  status: number;
  body: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'logistics-center-webhooks/1.0',
        'X-Webhook-Event': eventType,
        'X-Webhook-Signature': signature,
        'X-Webhook-Attempt': String(attempt),
      },
      body: payloadBody,
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await response.text(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function toRecord(
  value: Prisma.JsonValue | null,
): OutboundWebhookEnvelope | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as unknown as OutboundWebhookEnvelope)
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
