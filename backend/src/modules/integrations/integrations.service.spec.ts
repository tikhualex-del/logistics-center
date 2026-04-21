/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  IntegrationDirection,
  IntegrationEventStatus,
  OrderStatus,
} from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { IntegrationsService } from './integrations.service';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockPrismaService = {
  integration: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  integrationEvent: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  order: {
    findFirst: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
  runWithoutTenant: jest.fn(),
  runWithTenant: jest.fn(),
};

const mockOrdersService = {
  createOrder: jest.fn(),
  getOrder: jest.fn(),
};

const integrationRecord = {
  id: 'integration-1',
  company_id: 'company-1',
  name: 'crm-main',
  provider: 'amo-crm',
};

const webhookRegistrationRecord = {
  id: 'integration-1',
  company_id: 'company-1',
  name: 'crm-main',
  provider: 'amo-crm',
  is_active: true,
  outbound_webhook_url: 'https://crm.example.com/webhooks/logistics-center',
  inbound_secret: 'inbound-secret',
  webhook_secret: 'webhook-secret',
  settings: {
    eventTypes: ['order.status-changed', 'route.updated'],
    channel: 'primary',
  },
  created_by_user_id: 'admin-1',
  created_at: new Date('2026-04-20T10:00:00.000Z'),
  updated_at: new Date('2026-04-20T10:00:00.000Z'),
};

const orderResponse = {
  id: 'order-1',
  companyId: 'company-1',
  status: OrderStatus.new,
  externalId: 'crm-order-1',
  orderNumber: 'ORD-1',
  customerName: 'Ivan Petrov',
  customerPhone: '+79990000000',
  deliveryAddress: 'Moscow, Tverskaya 1',
  deliveryLatitude: 55.7558,
  deliveryLongitude: 37.6173,
  comment: null,
  scheduledDate: new Date('2026-04-20T10:00:00.000Z'),
  timeWindowFrom: new Date('2026-04-20T12:00:00.000Z'),
  timeWindowTo: new Date('2026-04-20T14:00:00.000Z'),
  zoneId: null,
  assignedCourierId: null,
  createdByUserId: null,
  assignedByUserId: null,
  metadata: {
    source: 'crm',
  },
  createdAt: new Date('2026-04-19T10:00:00.000Z'),
  updatedAt: new Date('2026-04-19T10:00:00.000Z'),
};

describe('IntegrationsService', () => {
  let service: IntegrationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.runWithoutTenant.mockImplementation(
      async (callback: () => Promise<unknown>) => await callback(),
    );
    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
  });

  it('creates inbound CRM order with idempotency event and external mapping', async () => {
    mockPrismaService.integration.findFirst.mockResolvedValue(
      integrationRecord,
    );
    mockPrismaService.integrationEvent.create.mockResolvedValue({
      id: 'event-1',
    });
    mockPrismaService.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockOrdersService.createOrder.mockResolvedValue(orderResponse);
    mockPrismaService.$executeRaw.mockResolvedValue(1);
    mockPrismaService.integrationEvent.update.mockResolvedValue({});

    const result = await service.importOrder('crm-main', 'secret-1', 'idem-1', {
      externalId: 'crm-order-1',
      orderNumber: 'ORD-1',
      customerName: 'Ivan Petrov',
      customerPhone: '+79990000000',
      deliveryAddress: 'Moscow, Tverskaya 1',
    });

    expect(mockPrismaService.integrationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        integration_id: 'integration-1',
        direction: IntegrationDirection.inbound,
        event_type: 'integration.order.inbound',
        idempotency_key: 'idem-1',
        external_id: 'crm-order-1',
        status: IntegrationEventStatus.processing,
      }),
      select: {
        id: true,
      },
    });
    expect(mockOrdersService.createOrder).toHaveBeenCalledWith(
      'company-1',
      null,
      {
        externalId: 'crm-order-1',
        orderNumber: 'ORD-1',
        customerName: 'Ivan Petrov',
        customerPhone: '+79990000000',
        deliveryAddress: 'Moscow, Tverskaya 1',
        deliveryLatitude: undefined,
        deliveryLongitude: undefined,
        comment: undefined,
        scheduledDate: undefined,
        timeWindowFrom: undefined,
        timeWindowTo: undefined,
        metadata: undefined,
      },
    );
    expect(mockPrismaService.$executeRaw).toHaveBeenCalled();
    expect(result).toEqual({
      idempotencyKey: 'idem-1',
      integrationName: 'crm-main',
      result: 'created',
      order: {
        externalId: 'crm-order-1',
        orderNumber: 'ORD-1',
        status: OrderStatus.new,
        deliveryAddress: 'Moscow, Tverskaya 1',
        customerName: 'Ivan Petrov',
        customerPhone: '+79990000000',
        scheduledDate: new Date('2026-04-20T10:00:00.000Z'),
        timeWindowFrom: new Date('2026-04-20T12:00:00.000Z'),
        timeWindowTo: new Date('2026-04-20T14:00:00.000Z'),
        createdAt: new Date('2026-04-19T10:00:00.000Z'),
        updatedAt: new Date('2026-04-19T10:00:00.000Z'),
      },
    });
    expect(mockPrismaService.integrationEvent.update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: expect.objectContaining({
        entity_id: 'order-1',
        external_id: 'crm-order-1',
        status: IntegrationEventStatus.succeeded,
        response: expect.any(Object),
      }),
    });
  });

  it('returns cached response for duplicate idempotency key', async () => {
    mockPrismaService.integration.findFirst.mockResolvedValue(
      integrationRecord,
    );
    mockPrismaService.integrationEvent.create.mockRejectedValue({
      code: 'P2002',
    });
    mockPrismaService.integrationEvent.findFirst.mockResolvedValue({
      id: 'event-1',
      status: IntegrationEventStatus.succeeded,
      response: {
        idempotencyKey: 'idem-1',
        integrationName: 'crm-main',
        result: 'created',
        order: {
          externalId: 'crm-order-1',
          orderNumber: 'ORD-1',
          status: OrderStatus.new,
          deliveryAddress: 'Moscow, Tverskaya 1',
          customerName: 'Ivan Petrov',
          customerPhone: '+79990000000',
          scheduledDate: null,
          timeWindowFrom: null,
          timeWindowTo: null,
          createdAt: '2026-04-19T10:00:00.000Z',
          updatedAt: '2026-04-19T10:00:00.000Z',
        },
      },
    });

    const result = await service.importOrder('crm-main', 'secret-1', 'idem-1', {
      externalId: 'crm-order-1',
      deliveryAddress: 'Moscow, Tverskaya 1',
    });

    expect(mockOrdersService.createOrder).not.toHaveBeenCalled();
    expect(result).toEqual({
      idempotencyKey: 'idem-1',
      integrationName: 'crm-main',
      result: 'created',
      order: {
        externalId: 'crm-order-1',
        orderNumber: 'ORD-1',
        status: OrderStatus.new,
        deliveryAddress: 'Moscow, Tverskaya 1',
        customerName: 'Ivan Petrov',
        customerPhone: '+79990000000',
        scheduledDate: null,
        timeWindowFrom: null,
        timeWindowTo: null,
        createdAt: '2026-04-19T10:00:00.000Z',
        updatedAt: '2026-04-19T10:00:00.000Z',
      },
    });
  });

  it.each([
    [
      IntegrationEventStatus.failed,
      'Request with this Idempotency-Key has already failed',
    ],
    [
      IntegrationEventStatus.processing,
      'Request with this Idempotency-Key is already being processed',
    ],
  ])(
    'rejects duplicate idempotency key when previous event is %s',
    async (status, message) => {
      mockPrismaService.integration.findFirst.mockResolvedValue(
        integrationRecord,
      );
      mockPrismaService.integrationEvent.create.mockRejectedValue({
        code: 'P2002',
      });
      mockPrismaService.integrationEvent.findFirst.mockResolvedValue({
        id: 'event-duplicate',
        status,
        response: null,
      });

      await expect(
        service.importOrder('crm-main', 'secret-1', 'idem-duplicate', {
          externalId: 'crm-order-1',
          deliveryAddress: 'Moscow, Tverskaya 1',
        }),
      ).rejects.toThrow(new ConflictException(message));
      expect(mockOrdersService.createOrder).not.toHaveBeenCalled();
      expect(mockOrdersService.getOrder).not.toHaveBeenCalled();
    },
  );

  it('returns existing mapped order without duplicate creation', async () => {
    mockPrismaService.integration.findFirst.mockResolvedValue(
      integrationRecord,
    );
    mockPrismaService.integrationEvent.create.mockResolvedValue({
      id: 'event-2',
    });
    mockPrismaService.$queryRaw.mockResolvedValue([
      { id: 'map-1', internal_id: 'order-1' },
      { id: 'map-1', internal_id: 'order-1' },
    ]);
    mockOrdersService.getOrder.mockResolvedValue(orderResponse);
    mockPrismaService.integrationEvent.update.mockResolvedValue({});

    const result = await service.importOrder('crm-main', 'secret-1', 'idem-2', {
      externalId: 'crm-order-1',
      deliveryAddress: 'Moscow, Tverskaya 1',
    });

    expect(mockOrdersService.createOrder).not.toHaveBeenCalled();
    expect(mockOrdersService.getOrder).toHaveBeenCalledWith(
      'company-1',
      'order-1',
    );
    expect(result.result).toBe('existing');
  });

  it('recovers existing order and creates external mapping after externalId conflict', async () => {
    mockPrismaService.integration.findFirst.mockResolvedValue(
      integrationRecord,
    );
    mockPrismaService.integrationEvent.create.mockResolvedValue({
      id: 'event-4',
    });
    mockPrismaService.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockOrdersService.createOrder.mockRejectedValue(
      new ConflictException(
        'Order with this externalId already exists in this company',
      ),
    );
    mockPrismaService.order.findFirst.mockResolvedValue({ id: 'order-1' });
    mockPrismaService.$executeRaw.mockResolvedValue(1);
    mockOrdersService.getOrder.mockResolvedValue(orderResponse);
    mockPrismaService.integrationEvent.update.mockResolvedValue({});

    const result = await service.importOrder('crm-main', 'secret-1', 'idem-4', {
      externalId: 'crm-order-1',
      deliveryAddress: 'Moscow, Tverskaya 1',
    });

    expect(mockPrismaService.$executeRaw).toHaveBeenCalled();
    expect(mockOrdersService.getOrder).toHaveBeenCalledWith(
      'company-1',
      'order-1',
    );
    expect(result.result).toBe('existing');
    expect(mockPrismaService.integrationEvent.update).toHaveBeenCalledWith({
      where: { id: 'event-4' },
      data: expect.objectContaining({
        entity_id: 'order-1',
        external_id: 'crm-order-1',
        status: IntegrationEventStatus.succeeded,
        response: expect.objectContaining({
          result: 'existing',
        }),
      }),
    });
  });

  it('fails when external ID is mapped to a different internal order', async () => {
    mockPrismaService.integration.findFirst.mockResolvedValue(
      integrationRecord,
    );
    mockPrismaService.integrationEvent.create.mockResolvedValue({
      id: 'event-5',
    });
    mockPrismaService.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'map-1', internal_id: 'order-other' }]);
    mockOrdersService.createOrder.mockResolvedValue(orderResponse);
    mockPrismaService.integrationEvent.update.mockResolvedValue({});

    await expect(
      service.importOrder('crm-main', 'secret-1', 'idem-5', {
        externalId: 'crm-order-1',
        deliveryAddress: 'Moscow, Tverskaya 1',
      }),
    ).rejects.toThrow(
      new ConflictException(
        'External ID is already mapped to a different order',
      ),
    );
    expect(mockPrismaService.$executeRaw).not.toHaveBeenCalled();
    expect(mockPrismaService.integrationEvent.update).toHaveBeenCalledWith({
      where: { id: 'event-5' },
      data: expect.objectContaining({
        external_id: 'crm-order-1',
        status: IntegrationEventStatus.failed,
        response: {
          error: 'External ID is already mapped to a different order',
        },
      }),
    });
  });

  it('marks integration event as failed when processing throws', async () => {
    mockPrismaService.integration.findFirst.mockResolvedValue(
      integrationRecord,
    );
    mockPrismaService.integrationEvent.create.mockResolvedValue({
      id: 'event-3',
    });
    mockPrismaService.$queryRaw.mockResolvedValue([]);
    mockOrdersService.createOrder.mockRejectedValue(
      new ConflictException(
        'Order with this externalId already exists in this company',
      ),
    );
    mockPrismaService.order.findFirst.mockResolvedValue(null);
    mockPrismaService.integrationEvent.update.mockResolvedValue({});

    await expect(
      service.importOrder('crm-main', 'secret-1', 'idem-3', {
        externalId: 'crm-order-9',
        deliveryAddress: 'Moscow, Tverskaya 9',
      }),
    ).rejects.toThrow(ConflictException);
    expect(mockPrismaService.integrationEvent.update).toHaveBeenCalledWith({
      where: { id: 'event-3' },
      data: expect.objectContaining({
        external_id: 'crm-order-9',
        status: IntegrationEventStatus.failed,
        response: {
          error: 'Order with this externalId already exists in this company',
        },
      }),
    });
  });

  it('rejects missing idempotency header', async () => {
    await expect(
      service.importOrder('crm-main', 'secret-1', undefined, {
        externalId: 'crm-order-1',
        deliveryAddress: 'Moscow, Tverskaya 1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects invalid integration credentials', async () => {
    mockPrismaService.integration.findFirst.mockResolvedValue(null);

    await expect(
      service.importOrder('crm-main', 'wrong-secret', 'idem-1', {
        externalId: 'crm-order-1',
        deliveryAddress: 'Moscow, Tverskaya 1',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('registers outbound webhook settings for the company', async () => {
    mockPrismaService.integration.create.mockResolvedValue(
      webhookRegistrationRecord,
    );

    const result = await service.registerWebhook('company-1', 'admin-1', {
      name: 'crm-main',
      provider: 'amo-crm',
      outboundWebhookUrl: 'https://crm.example.com/webhooks/logistics-center',
      webhookSecret: 'webhook-secret',
      inboundSecret: 'inbound-secret',
      eventTypes: ['order.status-changed', 'route.updated'],
      settings: {
        channel: 'primary',
      },
    });

    expect(mockPrismaService.integration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        name: 'crm-main',
        provider: 'amo-crm',
        outbound_webhook_url:
          'https://crm.example.com/webhooks/logistics-center',
        webhook_secret: 'webhook-secret',
        inbound_secret: 'inbound-secret',
        created_by_user_id: 'admin-1',
      }),
      select: expect.any(Object),
    });
    expect(result).toEqual({
      id: 'integration-1',
      companyId: 'company-1',
      name: 'crm-main',
      provider: 'amo-crm',
      isActive: true,
      outboundWebhookUrl: 'https://crm.example.com/webhooks/logistics-center',
      hasWebhookSecret: true,
      hasInboundSecret: true,
      eventTypes: ['order.status-changed', 'route.updated'],
      settings: {
        eventTypes: ['order.status-changed', 'route.updated'],
        channel: 'primary',
      },
      createdByUserId: 'admin-1',
      createdAt: new Date('2026-04-20T10:00:00.000Z'),
      updatedAt: new Date('2026-04-20T10:00:00.000Z'),
    });
  });

  it('lists webhook registrations for the company', async () => {
    mockPrismaService.integration.findMany.mockResolvedValue([
      webhookRegistrationRecord,
    ]);

    const result = await service.listWebhooks('company-1');

    expect(mockPrismaService.integration.findMany).toHaveBeenCalledWith({
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      select: expect.any(Object),
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.eventTypes).toEqual([
      'order.status-changed',
      'route.updated',
    ]);
  });

  it('updates webhook registration settings', async () => {
    mockPrismaService.integration.findFirst.mockResolvedValue(
      webhookRegistrationRecord,
    );
    mockPrismaService.integration.update.mockResolvedValue({
      ...webhookRegistrationRecord,
      is_active: false,
      settings: {
        eventTypes: ['route.cancelled'],
        channel: 'backup',
      },
      updated_at: new Date('2026-04-20T11:00:00.000Z'),
    });

    const result = await service.updateWebhook(
      'company-1',
      'admin-1',
      'integration-1',
      {
        isActive: false,
        eventTypes: ['route.cancelled'],
        settings: {
          channel: 'backup',
        },
      },
    );

    expect(mockPrismaService.integration.update).toHaveBeenCalledWith({
      where: { id: 'integration-1' },
      data: expect.objectContaining({
        is_active: false,
        settings: expect.anything(),
      }),
      select: expect.any(Object),
    });
    expect(result.isActive).toBe(false);
    expect(result.eventTypes).toEqual(['route.cancelled']);
    expect(result.settings).toEqual({
      eventTypes: ['route.cancelled'],
      channel: 'backup',
    });
  });
});
