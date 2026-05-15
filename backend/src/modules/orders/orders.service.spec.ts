import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditActorRole, OrderStatus, Prisma } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { InvalidStateTransitionException } from './exceptions/invalid-state-transition.exception';
import { OrdersService } from './orders.service';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockEventEmitter = {
  emitAsync: jest.fn(),
};

const mockPrismaService = {
  order: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  orderStatusHistory: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  zone: {
    findFirst: jest.fn(),
  },
  courier: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
  runWithTenant: jest.fn(),
};

const baseOrder = {
  id: 'order-1',
  company_id: 'company-1',
  status: OrderStatus.new,
  external_id: 'crm-order-1',
  order_number: 'ORD-1',
  customer_name: 'Ivan Petrov',
  customer_phone: '+79990000000',
  delivery_address: 'Moscow, Tverskaya 1',
  delivery_latitude: new Prisma.Decimal('55.7558000'),
  delivery_longitude: new Prisma.Decimal('37.6173000'),
  comment: 'Leave at reception',
  scheduled_date: new Date('2026-04-16T10:00:00.000Z'),
  time_window_from: new Date('2026-04-16T12:00:00.000Z'),
  time_window_to: new Date('2026-04-16T14:00:00.000Z'),
  zone_id: 'zone-1',
  assigned_courier_id: 'courier-1',
  created_by_user_id: 'user-1',
  assigned_by_user_id: 'user-1',
  metadata: { source: 'dispatcher' },
  created_at: new Date('2026-04-16T10:00:00.000Z'),
  updated_at: new Date('2026-04-16T10:00:00.000Z'),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    jest.resetAllMocks();

    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );
    mockPrismaService.$transaction.mockImplementation(
      async (callback: (tx: typeof mockPrismaService) => Promise<unknown>) =>
        await callback(mockPrismaService),
    );
    mockEventEmitter.emitAsync.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('creates order with actor context and related references', async () => {
    mockPrismaService.order.findFirst.mockResolvedValue(null);
    mockPrismaService.zone.findFirst.mockResolvedValue({ id: 'zone-1' });
    mockPrismaService.courier.findFirst.mockResolvedValue({ id: 'courier-1' });
    mockPrismaService.order.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...baseOrder,
        id: 'order-2',
        created_by_user_id: data.created_by_user_id,
        assigned_by_user_id: data.assigned_by_user_id,
        assigned_courier_id: data.assigned_courier_id,
        zone_id: data.zone_id,
      }),
    );

    const result = await service.createOrder('company-1', 'user-1', {
      deliveryAddress: baseOrder.delivery_address,
      zoneId: 'zone-1',
      assignedCourierId: 'courier-1',
      customerName: 'Ivan Petrov',
    });

    expect(mockPrismaService.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          company_id: 'company-1',
          status: OrderStatus.new,
          created_by_user_id: 'user-1',
          assigned_by_user_id: 'user-1',
        }),
      }),
    );
    expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
      DOMAIN_EVENTS.ORDER.CREATED,
      expect.objectContaining({
        orderId: 'order-2',
        companyId: 'company-1',
        createdByUserId: 'user-1',
        requestId: null,
      }),
    );
    expect(result.status).toBe(OrderStatus.new);
    expect(result.zoneId).toBe('zone-1');
  });

  it('lists orders with Prisma where filters', async () => {
    mockPrismaService.order.findMany.mockResolvedValue([baseOrder]);

    const result = await service.listOrders('company-1', {
      status: OrderStatus.new,
      zoneId: 'zone-1',
      date: '2026-04-16',
    });

    expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
      where: {
        company_id: 'company-1',
        status: OrderStatus.new,
        zone_id: 'zone-1',
        scheduled_date: {
          gte: new Date('2026-04-16'),
          lt: new Date('2026-04-17'),
        },
      },
      orderBy: { created_at: 'desc' },
      select: expect.any(Object),
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.deliveryLatitude).toBeCloseTo(55.7558);
  });

  it('lists orders with search across order identity and customer fields', async () => {
    mockPrismaService.order.findMany.mockResolvedValue([baseOrder]);

    await service.listOrders('company-1', {
      search: 'Petrov',
    });

    expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
      where: {
        company_id: 'company-1',
        OR: [
          { external_id: { contains: 'Petrov', mode: 'insensitive' } },
          { order_number: { contains: 'Petrov', mode: 'insensitive' } },
          { customer_name: { contains: 'Petrov', mode: 'insensitive' } },
          { customer_phone: { contains: 'Petrov', mode: 'insensitive' } },
          {
            delivery_address: {
              contains: 'Petrov',
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: { created_at: 'desc' },
      select: expect.any(Object),
    });
  });

  it('lists orders whose delivery window overlaps the selected time range', async () => {
    mockPrismaService.order.findMany.mockResolvedValue([baseOrder]);

    await service.listOrders('company-1', {
      date: '2026-04-16',
      timeWindowFrom: '09:00',
      timeWindowTo: '13:00',
    });

    expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
      where: {
        company_id: 'company-1',
        scheduled_date: {
          gte: new Date('2026-04-16'),
          lt: new Date('2026-04-17'),
        },
        AND: [
          {
            time_window_from: {
              lt: new Date('2026-04-16T13:00:00.000Z'),
            },
          },
          {
            time_window_to: {
              gt: new Date('2026-04-16T09:00:00.000Z'),
            },
          },
        ],
      },
      orderBy: { created_at: 'desc' },
      select: expect.any(Object),
    });
  });

  it('rejects HH:mm time window filters without selected date', async () => {
    await expect(
      service.listOrders('company-1', {
        timeWindowFrom: '09:00',
        timeWindowTo: '13:00',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects inverted list time window filters', async () => {
    await expect(
      service.listOrders('company-1', {
        date: '2026-04-16',
        timeWindowFrom: '14:00',
        timeWindowTo: '13:00',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns order by id inside tenant scope', async () => {
    mockPrismaService.order.findFirst.mockResolvedValue(baseOrder);

    const result = await service.getOrder('company-1', 'order-1');

    expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      select: expect.any(Object),
    });
    expect(result.id).toBe('order-1');
  });

  it('throws when order is missing', async () => {
    mockPrismaService.order.findFirst.mockResolvedValue(null);

    await expect(
      service.getOrder('company-1', 'missing-order'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects duplicate externalId in company scope', async () => {
    mockPrismaService.order.findFirst.mockResolvedValue({
      id: 'existing-order',
    });

    await expect(
      service.createOrder('company-1', 'user-1', {
        deliveryAddress: baseOrder.delivery_address,
        externalId: 'crm-order-1',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects invalid time window on create', async () => {
    await expect(
      service.createOrder('company-1', 'user-1', {
        deliveryAddress: baseOrder.delivery_address,
        timeWindowFrom: new Date('2026-04-16T15:00:00.000Z'),
        timeWindowTo: new Date('2026-04-16T12:00:00.000Z'),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects missing zone reference on update', async () => {
    mockPrismaService.order.findFirst.mockResolvedValue(baseOrder);
    mockPrismaService.zone.findFirst.mockResolvedValue(null);

    await expect(
      service.updateOrder('company-1', 'user-2', 'order-1', {
        zoneId: 'missing-zone',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates order and tracks assignment actor when courier changed', async () => {
    mockPrismaService.order.findFirst
      .mockResolvedValueOnce(baseOrder)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockPrismaService.zone.findFirst.mockResolvedValue({ id: 'zone-1' });
    mockPrismaService.courier.findFirst.mockResolvedValue({ id: 'courier-2' });
    mockPrismaService.order.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...baseOrder,
        comment: data.comment,
        assigned_courier_id: data.assigned_courier_id,
        assigned_by_user_id: data.assigned_by_user_id,
      }),
    );

    const result = await service.updateOrder('company-1', 'user-2', 'order-1', {
      comment: 'Call on arrival',
      assignedCourierId: 'courier-2',
    });

    expect(mockPrismaService.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        comment: 'Call on arrival',
        assigned_courier_id: 'courier-2',
        assigned_by_user_id: 'user-2',
      },
      select: expect.any(Object),
    });
    expect(result.assignedCourierId).toBe('courier-2');
    expect(result.assignedByUserId).toBe('user-2');
  });

  it('transitions order status and writes history plus audit log', async () => {
    const transitionedOrder = {
      ...baseOrder,
      status: OrderStatus.confirmed,
    };
    mockPrismaService.order.findFirst.mockResolvedValue(baseOrder);
    mockPrismaService.order.update.mockResolvedValue(transitionedOrder);
    mockPrismaService.orderStatusHistory.create.mockResolvedValue({});
    mockPrismaService.auditLog.create.mockResolvedValue({});

    const result = await service.transitionOrderStatus(
      'company-1',
      'user-2',
      AuditActorRole.dispatcher,
      'order-1',
      {
        status: OrderStatus.confirmed,
        reason: 'Dispatcher confirmed order',
        metadata: { source: 'manual' },
      },
    );

    expect(mockPrismaService.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: OrderStatus.confirmed },
      select: expect.any(Object),
    });
    expect(mockPrismaService.orderStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        order_id: 'order-1',
        from_status: OrderStatus.new,
        to_status: OrderStatus.confirmed,
        changed_by_user_id: 'user-2',
        reason: 'Dispatcher confirmed order',
      }),
    });
    expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        actor_id: 'user-2',
        actor_role: AuditActorRole.dispatcher,
        action: 'order.status-changed',
        entity_type: 'order',
        entity_id: 'order-1',
        before: { status: OrderStatus.new },
        after: {
          status: OrderStatus.confirmed,
          reason: 'Dispatcher confirmed order',
        },
      }),
    });
    expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
      DOMAIN_EVENTS.ORDER.STATUS_CHANGED,
      expect.objectContaining({
        orderId: 'order-1',
        companyId: 'company-1',
        actorUserId: 'user-2',
        actorRole: AuditActorRole.dispatcher,
        fromStatus: OrderStatus.new,
        toStatus: OrderStatus.confirmed,
        reason: 'Dispatcher confirmed order',
        requestId: null,
      }),
    );
    expect(result.status).toBe(OrderStatus.confirmed);
  });

  it('rejects invalid order status transition', async () => {
    mockPrismaService.order.findFirst.mockResolvedValue(baseOrder);

    await expect(
      service.transitionOrderStatus(
        'company-1',
        'user-2',
        AuditActorRole.dispatcher,
        'order-1',
        {
          status: OrderStatus.delivered,
        },
      ),
    ).rejects.toThrow(InvalidStateTransitionException);
    expect(mockEventEmitter.emitAsync).not.toHaveBeenCalledWith(
      DOMAIN_EVENTS.ORDER.STATUS_CHANGED,
      expect.anything(),
    );
  });
});
