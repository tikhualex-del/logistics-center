import { Test, type TestingModule } from '@nestjs/testing';
import { OrderStatus, RouteStatus, UserRole } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { RealtimeGateway } from './realtime.gateway';
import { REALTIME_EVENTS } from './realtime.events';
import { RealtimeEventsService } from './realtime-events.service';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockGateway = {
  emitToRole: jest.fn(),
  emitToCompany: jest.fn(),
  emitToUser: jest.fn(),
};

describe('RealtimeEventsService', () => {
  let service: RealtimeEventsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeEventsService,
        { provide: RealtimeGateway, useValue: mockGateway },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<RealtimeEventsService>(RealtimeEventsService);
  });

  it('emits courier:location_updated to dispatcher and admin rooms', () => {
    service.handleCourierLocationUpdated({
      courierId: 'courier-1',
      companyId: 'company-1',
      actorUserId: 'courier-user-1',
      actorRole: UserRole.courier,
      requestId: 'req-1',
      latitude: 55.75,
      longitude: 37.61,
      lastSeenAt: new Date('2026-04-17T12:00:00.000Z'),
      courier: {
        id: 'courier-1',
        companyId: 'company-1',
        userId: 'courier-user-1',
        status: 'available',
        isOnline: true,
        email: 'courier@example.com',
        firstName: 'Ivan',
        lastName: 'Petrov',
        phone: '+79990000000',
        isActive: true,
        latitude: 55.75,
        longitude: 37.61,
        lastSeenAt: new Date('2026-04-17T12:00:00.000Z'),
        createdAt: new Date('2026-04-17T11:00:00.000Z'),
        updatedAt: new Date('2026-04-17T12:00:00.000Z'),
      },
    });

    expect(mockGateway.emitToRole).toHaveBeenNthCalledWith(
      1,
      'company-1',
      UserRole.dispatcher,
      REALTIME_EVENTS.COURIER_LOCATION_UPDATED,
      expect.objectContaining({
        entityId: 'courier-1',
        latitude: 55.75,
        longitude: 37.61,
      }),
    );
    expect(mockGateway.emitToRole).toHaveBeenNthCalledWith(
      2,
      'company-1',
      UserRole.admin,
      REALTIME_EVENTS.COURIER_LOCATION_UPDATED,
      expect.any(Object),
    );
  });

  it('emits order:status_changed to operations and alert:new to dispatchers', () => {
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
        createdByUserId: null,
        assignedByUserId: 'dispatcher-1',
        metadata: null,
        createdAt: new Date('2026-04-17T11:00:00.000Z'),
        updatedAt: new Date('2026-04-17T12:00:00.000Z'),
      },
    });

    expect(mockGateway.emitToRole).toHaveBeenNthCalledWith(
      1,
      'company-1',
      UserRole.dispatcher,
      REALTIME_EVENTS.ORDER_STATUS_CHANGED,
      expect.objectContaining({
        entityId: 'order-1',
        fromStatus: OrderStatus.assigned,
        toStatus: OrderStatus.delivered,
      }),
    );
    expect(mockGateway.emitToRole).toHaveBeenNthCalledWith(
      2,
      'company-1',
      UserRole.admin,
      REALTIME_EVENTS.ORDER_STATUS_CHANGED,
      expect.any(Object),
    );
    expect(mockGateway.emitToRole).toHaveBeenNthCalledWith(
      3,
      'company-1',
      UserRole.dispatcher,
      REALTIME_EVENTS.ALERT_NEW,
      expect.objectContaining({
        type: 'order-status-change',
        entityId: 'order-1',
      }),
    );
  });

  it('emits alert:new for order created to dispatchers', () => {
    service.handleOrderCreated({
      orderId: 'order-2',
      companyId: 'company-1',
      createdByUserId: 'admin-1',
      requestId: 'req-3',
      order: {
        id: 'order-2',
        companyId: 'company-1',
        status: OrderStatus.new,
        externalId: 'crm-order-2',
        orderNumber: 'ORD-2',
        customerName: 'Petr Ivanov',
        customerPhone: '+79991111111',
        deliveryAddress: 'Moscow, Arbat 2',
        deliveryLatitude: null,
        deliveryLongitude: null,
        comment: null,
        scheduledDate: null,
        timeWindowFrom: null,
        timeWindowTo: null,
        zoneId: null,
        assignedCourierId: null,
        createdByUserId: 'admin-1',
        assignedByUserId: null,
        metadata: null,
        createdAt: new Date('2026-04-17T11:00:00.000Z'),
        updatedAt: new Date('2026-04-17T11:00:00.000Z'),
      },
    });

    expect(mockGateway.emitToRole).toHaveBeenCalledWith(
      'company-1',
      UserRole.dispatcher,
      REALTIME_EVENTS.ALERT_NEW,
      expect.objectContaining({
        type: 'new-order',
        entityId: 'order-2',
      }),
    );
  });

  it('emits route:updated and alert:new for route changes', () => {
    service.handleRouteBuilt({
      routeId: 'route-1',
      companyId: 'company-1',
      actorUserId: 'dispatcher-1',
      requestId: 'req-4',
      route: buildRouteResponse(RouteStatus.planned),
    });
    service.handleRouteCancelled({
      routeId: 'route-1',
      companyId: 'company-1',
      actorUserId: 'dispatcher-1',
      fromStatus: RouteStatus.planned,
      toStatus: 'cancelled',
      requestId: 'req-5',
      route: buildRouteResponse(RouteStatus.cancelled),
    });

    expect(mockGateway.emitToRole).toHaveBeenNthCalledWith(
      1,
      'company-1',
      UserRole.dispatcher,
      REALTIME_EVENTS.ROUTE_UPDATED,
      expect.objectContaining({
        entityId: 'route-1',
        action: 'built',
      }),
    );
    expect(mockGateway.emitToRole).toHaveBeenNthCalledWith(
      2,
      'company-1',
      UserRole.admin,
      REALTIME_EVENTS.ROUTE_UPDATED,
      expect.any(Object),
    );
    expect(mockGateway.emitToRole).toHaveBeenNthCalledWith(
      3,
      'company-1',
      UserRole.dispatcher,
      REALTIME_EVENTS.ALERT_NEW,
      expect.objectContaining({
        type: 'route-change',
        data: expect.objectContaining({
          action: 'built',
        }),
      }),
    );
    expect(mockGateway.emitToRole).toHaveBeenNthCalledWith(
      4,
      'company-1',
      UserRole.dispatcher,
      REALTIME_EVENTS.ROUTE_UPDATED,
      expect.objectContaining({
        action: 'cancelled',
      }),
    );
  });
});

function buildRouteResponse(status: RouteStatus) {
  return {
    id: 'route-1',
    companyId: 'company-1',
    courierId: 'courier-1',
    status,
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
    createdAt: new Date('2026-04-17T11:00:00.000Z'),
    updatedAt: new Date('2026-04-17T11:30:00.000Z'),
  };
}
