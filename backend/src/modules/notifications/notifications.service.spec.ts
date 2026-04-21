import { Test, type TestingModule } from '@nestjs/testing';
import { OrderStatus, RouteStatus } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockGateway = {
  broadcastToDispatchers: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsGateway, useValue: mockGateway },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('emits new-order alert for dispatchers', () => {
    service.handleOrderCreated({
      orderId: 'order-1',
      companyId: 'company-1',
      createdByUserId: 'admin-1',
      requestId: 'req-1',
      order: {
        id: 'order-1',
        companyId: 'company-1',
        status: OrderStatus.new,
        externalId: 'crm-order-1',
        orderNumber: 'ORD-1',
        customerName: 'Ivan Petrov',
        customerPhone: '+79990000000',
        deliveryAddress: 'Moscow, Tverskaya 1',
        deliveryLatitude: null,
        deliveryLongitude: null,
        comment: null,
        scheduledDate: new Date('2026-04-17T12:00:00.000Z'),
        timeWindowFrom: null,
        timeWindowTo: null,
        zoneId: null,
        assignedCourierId: null,
        createdByUserId: 'admin-1',
        assignedByUserId: null,
        metadata: null,
        createdAt: new Date('2026-04-17T11:50:00.000Z'),
        updatedAt: new Date('2026-04-17T11:50:00.000Z'),
      },
    });

    expect(mockGateway.broadcastToDispatchers).toHaveBeenCalledWith(
      'company-1',
      expect.objectContaining({
        type: 'new-order',
        entityType: 'order',
        entityId: 'order-1',
        title: 'New order',
      }),
    );
  });

  it('emits order status change alert for dispatchers', () => {
    service.handleOrderStatusChanged({
      orderId: 'order-1',
      companyId: 'company-1',
      actorUserId: 'dispatcher-1',
      actorRole: 'dispatcher',
      fromStatus: OrderStatus.assigned,
      toStatus: OrderStatus.delivered,
      reason: 'Delivered successfully',
      requestId: 'req-2',
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
        scheduledDate: null,
        timeWindowFrom: null,
        timeWindowTo: null,
        zoneId: null,
        assignedCourierId: null,
        createdByUserId: 'admin-1',
        assignedByUserId: 'dispatcher-1',
        metadata: null,
        createdAt: new Date('2026-04-17T11:50:00.000Z'),
        updatedAt: new Date('2026-04-17T12:10:00.000Z'),
      },
    });

    expect(mockGateway.broadcastToDispatchers).toHaveBeenCalledWith(
      'company-1',
      expect.objectContaining({
        type: 'order-status-change',
        entityType: 'order',
        entityId: 'order-1',
        data: expect.objectContaining({
          fromStatus: OrderStatus.assigned,
          toStatus: OrderStatus.delivered,
        }),
      }),
    );
  });

  it('emits route built alert for dispatchers', () => {
    service.handleRouteBuilt({
      routeId: 'route-1',
      companyId: 'company-1',
      actorUserId: 'dispatcher-1',
      requestId: 'req-3',
      route: buildRouteResponse(),
    });

    expect(mockGateway.broadcastToDispatchers).toHaveBeenCalledWith(
      'company-1',
      expect.objectContaining({
        type: 'route-change',
        entityType: 'route',
        entityId: 'route-1',
        data: expect.objectContaining({
          action: 'built',
        }),
      }),
    );
  });

  it('emits route updated and cancelled alerts for dispatchers', () => {
    service.handleRouteUpdated({
      routeId: 'route-1',
      companyId: 'company-1',
      actorUserId: 'dispatcher-1',
      fromStatus: RouteStatus.draft,
      toStatus: RouteStatus.planned,
      requestId: 'req-4',
      route: buildRouteResponse(),
    });
    service.handleRouteCancelled({
      routeId: 'route-1',
      companyId: 'company-1',
      actorUserId: 'dispatcher-1',
      fromStatus: RouteStatus.planned,
      toStatus: 'cancelled',
      requestId: 'req-5',
      route: {
        ...buildRouteResponse(),
        status: RouteStatus.cancelled,
      },
    });

    expect(mockGateway.broadcastToDispatchers).toHaveBeenNthCalledWith(
      1,
      'company-1',
      expect.objectContaining({
        type: 'route-change',
        data: expect.objectContaining({
          action: 'updated',
        }),
      }),
    );
    expect(mockGateway.broadcastToDispatchers).toHaveBeenNthCalledWith(
      2,
      'company-1',
      expect.objectContaining({
        type: 'route-change',
        data: expect.objectContaining({
          action: 'cancelled',
        }),
      }),
    );
  });
});

function buildRouteResponse() {
  return {
    id: 'route-1',
    companyId: 'company-1',
    courierId: 'courier-1',
    status: RouteStatus.planned,
    version: 2,
    routeDate: new Date('2026-04-17T12:00:00.000Z'),
    createdByUserId: 'dispatcher-1',
    totalDistanceMeters: 14500,
    totalDurationSeconds: 3600,
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
    ],
    optimizationData: null,
    metadata: null,
    createdAt: new Date('2026-04-17T11:30:00.000Z'),
    updatedAt: new Date('2026-04-17T11:45:00.000Z'),
  };
}
