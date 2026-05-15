import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuditActorRole, OrderStatus, Prisma, RouteStatus } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { InvalidRouteStateTransitionException } from './exceptions/invalid-route-state-transition.exception';
import { ROUTING_PROVIDER } from './providers/routing-provider.interface';
import { RoutingService } from './routing.service';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockRoutingProvider = {
  buildRoute: jest.fn(),
  calculateDistance: jest.fn(),
  geocode: jest.fn(),
};

const mockEventEmitter = {
  emitAsync: jest.fn(),
};

const mockTransactionClient = {
  route: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  order: {
    update: jest.fn(),
  },
  orderStatusHistory: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  routePoint: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockPrismaService = {
  route: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  routePoint: {
    findMany: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  courier: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
  runWithTenant: jest.fn(),
};

const routeDate = new Date('2026-04-18T09:00:00.000Z');

const baseOrders = [
  {
    id: 'order-1',
    company_id: 'company-1',
    status: OrderStatus.confirmed,
    customer_name: 'Alice',
    delivery_address: 'Moscow, Tverskaya 1',
    delivery_latitude: new Prisma.Decimal('55.7520'),
    delivery_longitude: new Prisma.Decimal('37.6170'),
    scheduled_date: routeDate,
    zone_id: 'zone-1',
    assigned_courier_id: null,
  },
  {
    id: 'order-2',
    company_id: 'company-1',
    status: OrderStatus.assigned,
    customer_name: 'Bob',
    delivery_address: 'Moscow, Tverskaya 2',
    delivery_latitude: null,
    delivery_longitude: null,
    scheduled_date: routeDate,
    zone_id: 'zone-1',
    assigned_courier_id: null,
  },
];

const courierRecord = {
  id: 'courier-1',
  company_id: 'company-1',
  latitude: new Prisma.Decimal('55.7510'),
  longitude: new Prisma.Decimal('37.6180'),
};

const providerRouteResult = {
  distanceMeters: 1800,
  durationSeconds: 720,
  polyline: [
    { latitude: 55.751, longitude: 37.618 },
    { latitude: 55.752, longitude: 37.617 },
    { latitude: 55.758, longitude: 37.615 },
  ],
  orderedPoints: [
    {
      id: 'courier:courier-1',
      orderId: null,
      address: null,
      coordinates: { latitude: 55.751, longitude: 37.618 },
      type: 'courier',
      metadata: { courierId: 'courier-1' },
    },
    {
      id: 'order-1',
      orderId: 'order-1',
      address: 'Moscow, Tverskaya 1',
      coordinates: { latitude: 55.752, longitude: 37.617 },
      type: 'dropoff',
      metadata: null,
    },
    {
      id: 'order-2',
      orderId: 'order-2',
      address: 'Moscow, Tverskaya 2',
      coordinates: { latitude: 55.758, longitude: 37.615 },
      type: 'dropoff',
      metadata: null,
    },
  ],
  stops: [
    {
      pointId: 'courier:courier-1',
      sequence: 1,
      eta: routeDate,
    },
    {
      pointId: 'order-1',
      sequence: 2,
      eta: new Date('2026-04-18T09:10:00.000Z'),
    },
    {
      pointId: 'order-2',
      sequence: 3,
      eta: new Date('2026-04-18T09:20:00.000Z'),
    },
  ],
  legs: [
    {
      fromPointId: 'courier:courier-1',
      toPointId: 'order-1',
      distanceMeters: 400,
      durationSeconds: 180,
      geometry: [
        { latitude: 55.751, longitude: 37.618 },
        { latitude: 55.752, longitude: 37.617 },
      ],
    },
    {
      fromPointId: 'order-1',
      toPointId: 'order-2',
      distanceMeters: 1400,
      durationSeconds: 540,
      geometry: [
        { latitude: 55.752, longitude: 37.617 },
        { latitude: 55.758, longitude: 37.615 },
      ],
    },
  ],
  provider: 'mock-yandex',
  metadata: {
    mock: true,
  },
};

const persistedRoute = {
  id: 'route-1',
  company_id: 'company-1',
  courier_id: 'courier-1',
  status: RouteStatus.draft,
  version: 1,
  route_date: routeDate,
  created_by_user_id: 'user-1',
  optimization_data: {
    provider: 'mock-yandex',
    distanceMeters: 1800,
    durationSeconds: 720,
    polyline: providerRouteResult.polyline,
    options: {
      mode: 'driving',
      optimizeWaypoints: true,
      avoidTolls: false,
      avoidUnpaved: false,
      departureTime: routeDate.toISOString(),
      returnToStart: false,
      locale: 'ru_RU',
    },
  },
  metadata: null,
  created_at: new Date('2026-04-17T10:00:00.000Z'),
  updated_at: new Date('2026-04-17T10:00:00.000Z'),
  route_points: [
    {
      id: 'route-point-1',
      route_id: 'route-1',
      order_id: 'order-1',
      sequence: 1,
      planned_eta: new Date('2026-04-18T09:10:00.000Z'),
      actual_eta: null,
      order: {
        ...baseOrders[0],
        delivery_latitude: new Prisma.Decimal('55.7520'),
        delivery_longitude: new Prisma.Decimal('37.6170'),
      },
    },
    {
      id: 'route-point-2',
      route_id: 'route-1',
      order_id: 'order-2',
      sequence: 2,
      planned_eta: new Date('2026-04-18T09:20:00.000Z'),
      actual_eta: null,
      order: {
        ...baseOrders[1],
        delivery_latitude: new Prisma.Decimal('55.7580'),
        delivery_longitude: new Prisma.Decimal('37.6150'),
      },
    },
  ],
};

function buildOrderAssignmentRecord(
  order: (typeof baseOrders)[number],
  data: Record<string, unknown> = {},
) {
  return {
    ...order,
    status: (data['status'] as OrderStatus | undefined) ?? order.status,
    assigned_courier_id:
      (data['assigned_courier_id'] as string | null | undefined) ??
      order.assigned_courier_id,
    assigned_by_user_id:
      (data['assigned_by_user_id'] as string | null | undefined) ?? null,
    external_id: null,
    order_number: null,
    customer_phone: null,
    comment: null,
    time_window_from: null,
    time_window_to: null,
    created_by_user_id: null,
    metadata: null,
    created_at: new Date('2026-04-17T10:00:00.000Z'),
    updated_at: new Date('2026-04-17T10:05:00.000Z'),
  };
}

describe('RoutingService', () => {
  let service: RoutingService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );
    mockPrismaService.$transaction.mockImplementation(
      async (
        callback: (tx: typeof mockTransactionClient) => Promise<unknown>,
      ) => await callback(mockTransactionClient),
    );
    mockRoutingProvider.geocode.mockResolvedValue({
      latitude: 55.758,
      longitude: 37.615,
    });
    mockRoutingProvider.buildRoute.mockResolvedValue(providerRouteResult);
    mockTransactionClient.order.update.mockImplementation(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const order =
          baseOrders.find((item) => item.id === where.id) ?? baseOrders[0];

        return buildOrderAssignmentRecord(order, data);
      },
    );
    mockTransactionClient.orderStatusHistory.create.mockResolvedValue({});
    mockTransactionClient.auditLog.create.mockResolvedValue({});
    mockEventEmitter.emitAsync.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: ROUTING_PROVIDER, useValue: mockRoutingProvider },
      ],
    }).compile();

    service = module.get<RoutingService>(RoutingService);
  });

  it('builds a draft route, geocodes missing order coordinates, and persists ordered route points', async () => {
    mockPrismaService.order.findMany.mockResolvedValue(baseOrders);
    mockPrismaService.routePoint.findMany.mockResolvedValue([]);
    mockPrismaService.courier.findFirst.mockResolvedValue(courierRecord);
    mockTransactionClient.route.create.mockResolvedValue({ id: 'route-1' });
    mockTransactionClient.route.findFirst.mockResolvedValue(persistedRoute);

    const result = await service.buildRoute('company-1', 'user-1', {
      orderIds: ['order-1', 'order-2'],
      courierId: 'courier-1',
      routeDate,
      mode: 'driving',
      optimizeWaypoints: true,
      returnToStart: false,
      locale: 'ru_RU',
    });

    expect(mockRoutingProvider.geocode).toHaveBeenCalledWith(
      'Moscow, Tverskaya 2',
    );
    expect(mockPrismaService.order.update).toHaveBeenCalledWith({
      where: { id: 'order-2' },
      data: {
        delivery_latitude: expect.any(Prisma.Decimal),
        delivery_longitude: expect.any(Prisma.Decimal),
      },
    });
    expect(mockRoutingProvider.buildRoute).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'courier:courier-1', type: 'courier' }),
        expect.objectContaining({ id: 'order-1', type: 'dropoff' }),
        expect.objectContaining({ id: 'order-2', type: 'dropoff' }),
      ]),
      expect.objectContaining({
        mode: 'driving',
        optimizeWaypoints: true,
      }),
    );
    expect(mockTransactionClient.route.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          company_id: 'company-1',
          courier_id: 'courier-1',
          status: RouteStatus.draft,
          version: 1,
          created_by_user_id: 'user-1',
        }),
      }),
    );
    expect(mockTransactionClient.routePoint.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          route_id: 'route-1',
          order_id: 'order-1',
          sequence: 1,
        }),
        expect.objectContaining({
          route_id: 'route-1',
          order_id: 'order-2',
          sequence: 2,
        }),
      ],
    });
    expect(mockTransactionClient.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        assigned_courier_id: 'courier-1',
        assigned_by_user_id: 'user-1',
        status: OrderStatus.assigned,
      },
      select: expect.any(Object),
    });
    expect(mockTransactionClient.order.update).toHaveBeenCalledWith({
      where: { id: 'order-2' },
      data: {
        assigned_courier_id: 'courier-1',
        assigned_by_user_id: 'user-1',
      },
      select: expect.any(Object),
    });
    expect(mockTransactionClient.orderStatusHistory.create).toHaveBeenCalledWith(
      {
        data: expect.objectContaining({
          company_id: 'company-1',
          order_id: 'order-1',
          from_status: OrderStatus.confirmed,
          to_status: OrderStatus.assigned,
          changed_by_user_id: 'user-1',
          reason: 'Assigned to route courier',
        }),
      },
    );
    expect(mockTransactionClient.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        actor_id: 'user-1',
        actor_role: AuditActorRole.system,
        action: DOMAIN_EVENTS.ORDER.STATUS_CHANGED,
        entity_type: 'order',
        entity_id: 'order-1',
      }),
    });
    expect(result.status).toBe(RouteStatus.draft);
    expect(result.totalDistanceMeters).toBe(1800);
    expect(result.routePoints).toHaveLength(2);
    expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
      DOMAIN_EVENTS.ROUTE.BUILT,
      expect.objectContaining({
        routeId: 'route-1',
        companyId: 'company-1',
        actorUserId: 'user-1',
        requestId: null,
        route: expect.objectContaining({
          id: 'route-1',
          status: RouteStatus.draft,
        }),
      }),
    );
    expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
      DOMAIN_EVENTS.ORDER.STATUS_CHANGED,
      expect.objectContaining({
        orderId: 'order-1',
        companyId: 'company-1',
        actorUserId: 'user-1',
        actorRole: AuditActorRole.system,
        fromStatus: OrderStatus.confirmed,
        toStatus: OrderStatus.assigned,
        reason: 'Assigned to route courier',
        order: expect.objectContaining({
          id: 'order-1',
          status: OrderStatus.assigned,
          assignedCourierId: 'courier-1',
        }),
      }),
    );
  });

  it('does not assign orders when route is built without courier', async () => {
    mockPrismaService.order.findMany.mockResolvedValue(baseOrders);
    mockPrismaService.routePoint.findMany.mockResolvedValue([]);
    mockTransactionClient.route.create.mockResolvedValue({ id: 'route-1' });
    mockTransactionClient.route.findFirst.mockResolvedValue({
      ...persistedRoute,
      courier_id: null,
    });

    const result = await service.buildRoute('company-1', 'user-1', {
      orderIds: ['order-1', 'order-2'],
      routeDate,
    });

    expect(result.id).toBe('route-1');
    expect(mockPrismaService.courier.findFirst).not.toHaveBeenCalled();
    expect(mockTransactionClient.order.update).not.toHaveBeenCalled();
    expect(
      mockTransactionClient.orderStatusHistory.create,
    ).not.toHaveBeenCalled();
    expect(mockTransactionClient.auditLog.create).not.toHaveBeenCalled();
    expect(mockEventEmitter.emitAsync).not.toHaveBeenCalledWith(
      DOMAIN_EVENTS.ORDER.STATUS_CHANGED,
      expect.anything(),
    );
  });

  it('rejects terminal orders before assigning a route courier', async () => {
    mockPrismaService.order.findMany.mockResolvedValue([
      {
        ...baseOrders[0],
        status: OrderStatus.delivered,
      },
      baseOrders[1],
    ]);

    await expect(
      service.buildRoute('company-1', 'user-1', {
        orderIds: ['order-1', 'order-2'],
        courierId: 'courier-1',
        routeDate,
      }),
    ).rejects.toThrow(
      'Order order-1 has terminal status and cannot be routed',
    );

    expect(mockTransactionClient.order.update).not.toHaveBeenCalled();
  });

  it('lists routes with Prisma filters', async () => {
    mockPrismaService.route.findMany.mockResolvedValue([persistedRoute]);

    const result = await service.listRoutes('company-1', {
      date: '2026-04-18',
      status: RouteStatus.draft,
      courierId: 'courier-1',
    });

    expect(mockPrismaService.route.findMany).toHaveBeenCalledWith({
      where: {
        deleted_at: null,
        status: RouteStatus.draft,
        courier_id: 'courier-1',
        route_date: {
          gte: new Date('2026-04-18'),
          lt: new Date('2026-04-19'),
        },
      },
      orderBy: [{ route_date: 'desc' }, { created_at: 'desc' }],
      select: expect.any(Object),
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('route-1');
  });

  it('updates route points, bumps version, and transitions to planned', async () => {
    mockPrismaService.route.findFirst.mockResolvedValue(persistedRoute);
    mockPrismaService.order.findMany.mockResolvedValue([
      {
        ...baseOrders[0],
        delivery_latitude: new Prisma.Decimal('55.7520'),
        delivery_longitude: new Prisma.Decimal('37.6170'),
      },
      {
        ...baseOrders[1],
        delivery_latitude: new Prisma.Decimal('55.7580'),
        delivery_longitude: new Prisma.Decimal('37.6150'),
      },
    ]);
    mockPrismaService.routePoint.findMany.mockResolvedValue([]);
    mockPrismaService.courier.findFirst.mockResolvedValue(courierRecord);
    mockRoutingProvider.buildRoute.mockResolvedValue({
      ...providerRouteResult,
      orderedPoints: [
        providerRouteResult.orderedPoints[0],
        providerRouteResult.orderedPoints[2],
        providerRouteResult.orderedPoints[1],
      ],
      stops: [
        providerRouteResult.stops[0],
        {
          pointId: 'order-2',
          sequence: 2,
          eta: new Date('2026-04-18T09:12:00.000Z'),
        },
        {
          pointId: 'order-1',
          sequence: 3,
          eta: new Date('2026-04-18T09:24:00.000Z'),
        },
      ],
    });
    mockTransactionClient.route.findFirst.mockResolvedValue({
      ...persistedRoute,
      status: RouteStatus.planned,
      version: 2,
      route_points: [
        persistedRoute.route_points[1],
        persistedRoute.route_points[0],
      ],
    });

    const result = await service.updateRoute('company-1', 'user-1', 'route-1', {
      orderIds: ['order-2', 'order-1'],
      status: RouteStatus.planned,
    });

    expect(mockTransactionClient.route.update).toHaveBeenCalledWith({
      where: { id: 'route-1' },
      data: expect.objectContaining({
        courier_id: 'courier-1',
        status: RouteStatus.planned,
        version: 2,
      }),
    });
    expect(mockTransactionClient.routePoint.deleteMany).toHaveBeenCalledWith({
      where: { route_id: 'route-1' },
    });
    expect(mockTransactionClient.routePoint.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          order_id: 'order-2',
          sequence: 1,
        }),
        expect.objectContaining({
          order_id: 'order-1',
          sequence: 2,
        }),
      ],
    });
    expect(mockTransactionClient.order.update).toHaveBeenCalledTimes(2);
    expect(mockTransactionClient.order.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'order-2' },
      data: {
        assigned_courier_id: 'courier-1',
        assigned_by_user_id: 'user-1',
      },
      select: expect.any(Object),
    });
    expect(mockTransactionClient.order.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'order-1' },
      data: {
        assigned_courier_id: 'courier-1',
        assigned_by_user_id: 'user-1',
        status: OrderStatus.assigned,
      },
      select: expect.any(Object),
    });
    expect(mockTransactionClient.orderStatusHistory.create).toHaveBeenCalledTimes(
      1,
    );
    expect(result.status).toBe(RouteStatus.planned);
    expect(result.version).toBe(2);
    expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
      DOMAIN_EVENTS.ROUTE.UPDATED,
      expect.objectContaining({
        routeId: 'route-1',
        companyId: 'company-1',
        actorUserId: 'user-1',
        fromStatus: RouteStatus.draft,
        toStatus: RouteStatus.planned,
        requestId: null,
        route: expect.objectContaining({
          id: 'route-1',
          status: RouteStatus.planned,
          version: 2,
        }),
      }),
    );
  });

  it('emits route.cancelled when route transitions to cancelled', async () => {
    mockPrismaService.route.findFirst.mockResolvedValue({
      ...persistedRoute,
      status: RouteStatus.planned,
      version: 2,
    });
    mockPrismaService.route.update.mockResolvedValue({
      ...persistedRoute,
      status: RouteStatus.cancelled,
      version: 2,
    });

    const result = await service.updateRoute('company-1', 'user-1', 'route-1', {
      status: RouteStatus.cancelled,
    });

    expect(mockPrismaService.route.update).toHaveBeenCalledWith({
      where: { id: 'route-1' },
      data: {
        status: RouteStatus.cancelled,
      },
      select: expect.any(Object),
    });
    expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
      DOMAIN_EVENTS.ROUTE.CANCELLED,
      expect.objectContaining({
        routeId: 'route-1',
        companyId: 'company-1',
        actorUserId: 'user-1',
        fromStatus: RouteStatus.planned,
        toStatus: RouteStatus.cancelled,
        requestId: null,
        route: expect.objectContaining({
          id: 'route-1',
          status: RouteStatus.cancelled,
        }),
      }),
    );
    expect(result.status).toBe(RouteStatus.cancelled);
  });

  it('soft-deletes editable route and emits route.cancelled', async () => {
    mockPrismaService.route.findFirst.mockResolvedValue(persistedRoute);
    mockPrismaService.route.update.mockResolvedValue({
      ...persistedRoute,
      status: RouteStatus.cancelled,
    });

    const result = await service.deleteRoute('company-1', 'user-1', 'route-1');

    expect(mockPrismaService.route.update).toHaveBeenCalledWith({
      where: { id: 'route-1' },
      data: {
        status: RouteStatus.cancelled,
        deleted_at: expect.any(Date),
      },
      select: expect.any(Object),
    });
    expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
      DOMAIN_EVENTS.ROUTE.CANCELLED,
      expect.objectContaining({
        routeId: 'route-1',
        companyId: 'company-1',
        actorUserId: 'user-1',
        fromStatus: RouteStatus.draft,
        toStatus: RouteStatus.cancelled,
        requestId: null,
        route: expect.objectContaining({
          id: 'route-1',
          status: RouteStatus.cancelled,
        }),
      }),
    );
    expect(result.status).toBe(RouteStatus.cancelled);
  });

  it('rejects invalid route status transition', async () => {
    mockPrismaService.route.findFirst.mockResolvedValue(persistedRoute);

    await expect(
      service.updateRoute('company-1', 'user-1', 'route-1', {
        status: RouteStatus.completed,
      }),
    ).rejects.toThrow(InvalidRouteStateTransitionException);
  });

  it('rejects orders already assigned to another active route', async () => {
    mockPrismaService.order.findMany.mockResolvedValue(baseOrders);
    mockPrismaService.routePoint.findMany.mockResolvedValue([
      {
        order_id: 'order-1',
        route_id: 'route-conflict',
      },
    ]);

    await expect(
      service.buildRoute('company-1', 'user-1', {
        orderIds: ['order-1', 'order-2'],
        courierId: 'courier-1',
        routeDate,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws when route detail is missing', async () => {
    mockPrismaService.route.findFirst.mockResolvedValue(null);

    await expect(
      service.getRoute('company-1', 'missing-route'),
    ).rejects.toThrow(NotFoundException);
  });

  it('does not fail route build when built event emission fails', async () => {
    mockPrismaService.order.findMany.mockResolvedValue(baseOrders);
    mockPrismaService.routePoint.findMany.mockResolvedValue([]);
    mockPrismaService.courier.findFirst.mockResolvedValue(courierRecord);
    mockTransactionClient.route.create.mockResolvedValue({ id: 'route-1' });
    mockTransactionClient.route.findFirst.mockResolvedValue(persistedRoute);
    mockEventEmitter.emitAsync.mockRejectedValueOnce(new Error('broker down'));

    const result = await service.buildRoute('company-1', 'user-1', {
      orderIds: ['order-1', 'order-2'],
      courierId: 'courier-1',
      routeDate,
    });

    expect(result.id).toBe('route-1');
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        routeId: 'route-1',
        companyId: 'company-1',
        actorUserId: 'user-1',
        error: expect.any(Error),
      }),
      'Route built event emission failed',
    );
  });
});
