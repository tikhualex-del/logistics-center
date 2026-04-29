import { getQueueToken } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { IntegrationEventStatus } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WEBHOOK_DELIVERY_JOB,
  WEBHOOK_DELIVERY_QUEUE,
} from './integrations.constants';
import { WebhookDeliveryProcessor } from './webhook-delivery.processor';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockPrismaService = {
  integrationEvent: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  runWithoutTenant: jest.fn(),
};

const mockEventEmitter = {
  emitAsync: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
};

const baseIntegrationEvent = {
  id: 'event-1',
  company_id: 'company-1',
  integration_id: 'integration-1',
  event_type: 'order.status-changed',
  entity_type: 'order',
  entity_id: 'order-1',
  attempts: 0,
  payload: {
    eventType: 'order.status-changed',
    occurredAt: '2026-04-20T10:00:00.000Z',
    entityType: 'order',
    entityId: 'crm-order-1',
    data: {
      externalOrderId: 'crm-order-1',
      toStatus: 'delivered',
    },
  },
  integration: {
    id: 'integration-1',
    name: 'crm-main',
    is_active: true,
    outbound_webhook_url: 'https://crm.example.com/webhooks/logistics-center',
    webhook_secret: 'top-secret',
  },
};

describe('WebhookDeliveryProcessor', () => {
  let processor: WebhookDeliveryProcessor;
  let originalFetch: typeof global.fetch | undefined;

  beforeEach(async () => {
    jest.clearAllMocks();
    originalFetch = global.fetch;

    mockPrismaService.runWithoutTenant.mockImplementation(
      async (callback: () => Promise<unknown>) => await callback(),
    );
    mockEventEmitter.emitAsync.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookDeliveryProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: getQueueToken(WEBHOOK_DELIVERY_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    processor = module.get<WebhookDeliveryProcessor>(WebhookDeliveryProcessor);
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
      return;
    }

    delete (global as { fetch?: typeof global.fetch }).fetch;
  });

  it('delivers webhook successfully and marks integration event succeeded', async () => {
    mockPrismaService.integrationEvent.findFirst.mockResolvedValue(
      baseIntegrationEvent,
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"ok":true}',
    }) as typeof global.fetch;

    await processor.process({
      data: {
        integrationEventId: 'event-1',
      },
    } as never);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://crm.example.com/webhooks/logistics-center',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Webhook-Event': 'order.status-changed',
          'X-Webhook-Signature': expect.stringMatching(/^sha256=/),
          'X-Webhook-Attempt': '1',
        }),
        body: JSON.stringify(baseIntegrationEvent.payload),
      }),
    );
    expect(mockPrismaService.integrationEvent.update).toHaveBeenNthCalledWith(
      1,
      {
        where: { id: 'event-1' },
        data: expect.objectContaining({
          status: IntegrationEventStatus.processing,
          attempts: 1,
          signature: expect.stringMatching(/^sha256=/),
        }),
      },
    );
    expect(mockPrismaService.integrationEvent.update).toHaveBeenNthCalledWith(
      2,
      {
        where: { id: 'event-1' },
        data: expect.objectContaining({
          status: IntegrationEventStatus.succeeded,
          response: expect.any(Object),
        }),
      },
    );
    expect(mockQueue.add).not.toHaveBeenCalled();
  });

  it('schedules retry with the first delay when delivery fails', async () => {
    mockPrismaService.integrationEvent.findFirst.mockResolvedValue(
      baseIntegrationEvent,
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'crm is down',
    }) as typeof global.fetch;

    await processor.process({
      data: {
        integrationEventId: 'event-1',
      },
    } as never);

    expect(mockPrismaService.integrationEvent.update).toHaveBeenNthCalledWith(
      2,
      {
        where: { id: 'event-1' },
        data: expect.objectContaining({
          status: IntegrationEventStatus.retrying,
          next_retry_at: expect.any(Date),
          response: expect.objectContaining({
            statusCode: 500,
            body: 'crm is down',
          }),
        }),
      },
    );
    expect(mockQueue.add).toHaveBeenCalledWith(
      WEBHOOK_DELIVERY_JOB,
      {
        integrationEventId: 'event-1',
      },
      expect.objectContaining({
        delay: 30000,
      }),
    );
  });

  it('marks event failed permanently and emits integration.webhook-failed', async () => {
    mockPrismaService.integrationEvent.findFirst.mockResolvedValue({
      ...baseIntegrationEvent,
      attempts: 5,
    });
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network timeout')) as typeof global.fetch;

    await processor.process({
      data: {
        integrationEventId: 'event-1',
      },
    } as never);

    expect(mockPrismaService.integrationEvent.update).toHaveBeenNthCalledWith(
      2,
      {
        where: { id: 'event-1' },
        data: expect.objectContaining({
          status: IntegrationEventStatus.failed,
          attempts: 6,
          response: expect.objectContaining({
            error: 'network timeout',
          }),
        }),
      },
    );
    expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
      DOMAIN_EVENTS.INTEGRATION.WEBHOOK_FAILED,
      expect.objectContaining({
        integrationEventId: 'event-1',
        companyId: 'company-1',
        integrationId: 'integration-1',
        attempts: 6,
        error: 'network timeout',
      }),
    );
  });
});
