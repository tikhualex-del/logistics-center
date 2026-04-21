import { Test, type TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

const mockIntegrationsService = {
  importOrder: jest.fn(),
  registerWebhook: jest.fn(),
  listWebhooks: jest.fn(),
  updateWebhook: jest.fn(),
};

describe('IntegrationsController', () => {
  let controller: IntegrationsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationsController],
      providers: [
        { provide: IntegrationsService, useValue: mockIntegrationsService },
      ],
    }).compile();

    controller = module.get<IntegrationsController>(IntegrationsController);
  });

  it('passes integration headers and dto to the service', async () => {
    const dto = {
      externalId: 'crm-order-1',
      deliveryAddress: 'Moscow, Tverskaya 1',
    };
    const serviceResponse = {
      idempotencyKey: 'idem-1',
      integrationName: 'crm-main',
      result: 'created',
      order: {
        externalId: 'crm-order-1',
        orderNumber: null,
        status: OrderStatus.new,
        deliveryAddress: 'Moscow, Tverskaya 1',
        customerName: null,
        customerPhone: null,
        scheduledDate: null,
        timeWindowFrom: null,
        timeWindowTo: null,
        createdAt: new Date('2026-04-19T10:00:00.000Z'),
        updatedAt: new Date('2026-04-19T10:00:00.000Z'),
      },
    };
    mockIntegrationsService.importOrder.mockResolvedValue(serviceResponse);

    await expect(
      controller.importOrder('idem-1', 'crm-main', 'secret-1', dto),
    ).resolves.toEqual(serviceResponse);
    expect(mockIntegrationsService.importOrder).toHaveBeenCalledWith(
      'crm-main',
      'secret-1',
      'idem-1',
      dto,
    );
  });

  it('registers webhook settings in tenant scope', async () => {
    const dto = {
      name: 'crm-main',
      provider: 'amo-crm',
      outboundWebhookUrl: 'https://crm.example.com/webhooks/logistics-center',
      webhookSecret: 'webhook-secret',
    };
    const serviceResponse = {
      id: 'integration-1',
      companyId: 'company-1',
      name: 'crm-main',
      provider: 'amo-crm',
      isActive: true,
      outboundWebhookUrl: 'https://crm.example.com/webhooks/logistics-center',
      hasWebhookSecret: true,
      hasInboundSecret: false,
      eventTypes: ['order.status-changed'],
      settings: {
        eventTypes: ['order.status-changed'],
      },
      createdByUserId: 'admin-1',
      createdAt: new Date('2026-04-20T10:00:00.000Z'),
      updatedAt: new Date('2026-04-20T10:00:00.000Z'),
    };
    mockIntegrationsService.registerWebhook.mockResolvedValue(serviceResponse);

    await expect(
      controller.registerWebhook('company-1', 'admin-1', dto),
    ).resolves.toEqual(serviceResponse);
    expect(mockIntegrationsService.registerWebhook).toHaveBeenCalledWith(
      'company-1',
      'admin-1',
      dto,
    );
  });

  it('lists webhook registrations for the current company', async () => {
    const serviceResponse = [
      {
        id: 'integration-1',
        companyId: 'company-1',
        name: 'crm-main',
        provider: 'amo-crm',
        isActive: true,
        outboundWebhookUrl: 'https://crm.example.com/webhooks/logistics-center',
        hasWebhookSecret: true,
        hasInboundSecret: false,
        eventTypes: ['order.status-changed'],
        settings: {
          eventTypes: ['order.status-changed'],
        },
        createdByUserId: 'admin-1',
        createdAt: new Date('2026-04-20T10:00:00.000Z'),
        updatedAt: new Date('2026-04-20T10:00:00.000Z'),
      },
    ];
    mockIntegrationsService.listWebhooks.mockResolvedValue(serviceResponse);

    await expect(controller.listWebhooks('company-1')).resolves.toEqual(
      serviceResponse,
    );
    expect(mockIntegrationsService.listWebhooks).toHaveBeenCalledWith(
      'company-1',
    );
  });

  it('updates webhook registration in tenant scope', async () => {
    const dto = {
      isActive: false,
    };
    const serviceResponse = {
      id: 'integration-1',
      companyId: 'company-1',
      name: 'crm-main',
      provider: 'amo-crm',
      isActive: false,
      outboundWebhookUrl: 'https://crm.example.com/webhooks/logistics-center',
      hasWebhookSecret: true,
      hasInboundSecret: false,
      eventTypes: ['route.updated'],
      settings: {
        eventTypes: ['route.updated'],
      },
      createdByUserId: 'admin-1',
      createdAt: new Date('2026-04-20T10:00:00.000Z'),
      updatedAt: new Date('2026-04-20T11:00:00.000Z'),
    };
    mockIntegrationsService.updateWebhook.mockResolvedValue(serviceResponse);

    await expect(
      controller.updateWebhook('company-1', 'admin-1', 'integration-1', dto),
    ).resolves.toEqual(serviceResponse);
    expect(mockIntegrationsService.updateWebhook).toHaveBeenCalledWith(
      'company-1',
      'admin-1',
      'integration-1',
      dto,
    );
  });
});
