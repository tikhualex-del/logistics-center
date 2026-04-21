import { getQueueToken } from '@nestjs/bull';
import { Test, type TestingModule } from '@nestjs/testing';
import { IntegrationDirection, IntegrationEventStatus, OrderStatus } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { WEBHOOK_DELIVERY_JOB, WEBHOOK_DELIVERY_QUEUE } from './integrations.constants';
import { OutboundWebhooksService } from './outbound-webhooks.service';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockPrismaService = {
  integration: {
    findMany: jest.fn(),
  },
  integrationEvent: {
    create: jest.fn(),
    update: jest.fn(),
  },
  $queryRaw: jest.fn(),
  runWithoutTenant: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
};

describe('OutboundWebhooksService', () => {
  let service: OutboundWebhooksService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.runWithoutTenant.mockImplementation(
      async (callback: () => Promise<unknown>) => await callback(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboundWebhooksService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
        { provide: getQueueToken(WEBHOOK_DELIVERY_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<OutboundWebhooksService>(OutboundWebhooksService);
  });

  it('enqueues order.status-changed webhook for active integrations', async () => {
    mockPrismaService.integration.findMany.mockResolvedValue([
      {
        id: 'integration-1',
        company_id: 'company-1',
        name: 'crm-main',
        outbound_webhook_url: 'https://crm.example.com/webhooks/logistics-center',
        webhook_secret: 'secret',
        settings: {
          eventTypes: ['order.status-changed'],
        },
      },
    ]);
    mockPrismaService.integrationEvent.create.mockResolvedValue({ id: 'event-1' });
    mockQueue.add.mockResolvedValue({});

    await service.handleOrderStatusChanged({
      orderId: 'order-1',
      companyId: 'company-1',
      actorUserId: 'admin-1',
      actorRole: 'admin',
      fromStatus: OrderStatus.assigned,
      toStatus: OrderStatus.delivered,
      reason: 'Delivered successfully',
      requestId: 'req-1',
      order: {
        id: 'order-1',
        companyId: 'company-1',
        status: OrderStatus.delivered,
        externalId: 'crm-order-1',
        orderNumber: 'ORD-1',
        customerName: 'Ivan Petrov',
        customerPhone: '+79990000000',
        deliveryAddress: 'Moscow, Tverskaya 1',
        deliveryLatitude: null,
        deliveryLongitude: null,
        comment: null,
        scheduledDate: new Date('2026-04-20T10:00:00.000Z'),
        timeWindowFrom: null,
        timeWindowTo: null,
        zoneId: null,
        assignedCourierId: null,
        createdByUserId: null,
        assignedByUserId: null,
        metadata: null,
        createdAt: new Date('2026-04-20T09:00:00.000Z'),
        updatedAt: new Date('2026-04-20T10:00:00.000Z'),
      },
    });

    expect(mockPrismaService.integrationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        integration_id: 'integration-1',
        direction: IntegrationDirection.outbound,
        event_type: DOMAIN_EVENTS.ORDER.STATUS_CHANGED,
        entity_type: 'order',
        entity_id: 'order-1',
        status: IntegrationEventStatus.pending,
        attempts: 0,
        payload: expect.any(Object),
      }),
      select: {
        id: true,
      },
    });
    expect(mockQueue.add).toHaveBeenCalledWith(
      WEBHOOK_DELIVERY_JOB,
      {
        integrationEventId: 'event-1',
      },
      expect.objectContaining({
        removeOnComplete: true,
        removeOnFail: true,
      }),
    );
  });

  it('enqueues route.updated webhook with external order references only', async () => {
    mockPrismaService.integration.findMany.mockResolvedValue([
      {
        id: 'integration-1',
        company_id: 'company-1',
        name: 'crm-main',
        outbound_webhook_url: 'https://crm.example.com/webhooks/logistics-center',
        webhook_secret: 'secret',
        settings: {
          eventTypes: ['route.updated'],
        },
      },
    ]);
    mockPrismaService.$queryRaw.mockResolvedValue([
      { internal_id: 'order-1', external_id: 'crm-order-1' },
    ]);
    mockPrismaService.integrationEvent.create.mockResolvedValue({ id: 'event-2' });
    mockQueue.add.mockResolvedValue({});

    await service.handleRouteUpdated({
      routeId: 'route-1',
      companyId: 'company-1',
      actorUserId: 'dispatcher-1',
      fromStatus: 'draft',
      toStatus: 'planned',
      requestId: 'req-2',
      route: {
        id: 'route-1',
        companyId: 'company-1',
        courierId: null,
        status: 'planned',
        version: 2,
        routeDate: new Date('2026-04-20T10:00:00.000Z'),
        createdByUserId: 'dispatcher-1',
        totalDistanceMeters: 1000,
        totalDurationSeconds: 300,
        provider: 'mock-yandex',
        polyline: [],
        routePoints: [
          {
            id: 'point-1',
            routeId: 'route-1',
            orderId: 'order-1',
            sequence: 1,
            plannedEta: null,
            actualEta: null,
            deliveryAddress: 'Moscow, Tverskaya 1',
            deliveryLatitude: null,
            deliveryLongitude: null,
            customerName: 'Ivan Petrov',
            orderStatus: OrderStatus.assigned,
            scheduledDate: null,
            zoneId: null,
          },
          {
            id: 'point-2',
            routeId: 'route-1',
            orderId: 'order-without-map',
            sequence: 2,
            plannedEta: null,
            actualEta: null,
            deliveryAddress: 'Moscow, Tverskaya 2',
            deliveryLatitude: null,
            deliveryLongitude: null,
            customerName: 'Petr Ivanov',
            orderStatus: OrderStatus.assigned,
            scheduledDate: null,
            zoneId: null,
          },
        ],
        optimizationData: null,
        metadata: null,
        createdAt: new Date('2026-04-20T09:00:00.000Z'),
        updatedAt: new Date('2026-04-20T09:30:00.000Z'),
      },
    });

    expect(mockPrismaService.integrationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event_type: DOMAIN_EVENTS.ROUTE.UPDATED,
        entity_type: 'route',
        entity_id: 'route-1',
        payload: expect.objectContaining({
          data: expect.objectContaining({
            orders: [
              expect.objectContaining({
                externalOrderId: 'crm-order-1',
                sequence: 1,
              }),
            ],
          }),
        }),
      }),
      select: {
        id: true,
      },
    });
  });

  it('skips order webhook when external ID is missing', async () => {
    await service.handleOrderStatusChanged({
      orderId: 'order-1',
      companyId: 'company-1',
      actorUserId: 'admin-1',
      actorRole: 'admin',
      fromStatus: OrderStatus.assigned,
      toStatus: OrderStatus.delivered,
      reason: null,
      requestId: null,
      order: {
        id: 'order-1',
        companyId: 'company-1',
        status: OrderStatus.delivered,
        externalId: null,
        orderNumber: null,
        customerName: null,
        customerPhone: null,
        deliveryAddress: 'Moscow, Tverskaya 1',
        deliveryLatitude: null,
        deliveryLongitude: null,
        comment: null,
        scheduledDate: null,
        timeWindowFrom: null,
        timeWindowTo: null,
        zoneId: null,
        assignedCourierId: null,
        createdByUserId: null,
        assignedByUserId: null,
        metadata: null,
        createdAt: new Date('2026-04-20T09:00:00.000Z'),
        updatedAt: new Date('2026-04-20T09:30:00.000Z'),
      },
    });

    expect(mockPrismaService.integration.findMany).not.toHaveBeenCalled();
    expect(mockPrismaService.integrationEvent.create).not.toHaveBeenCalled();
  });
});
