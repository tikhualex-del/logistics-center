import { Test, type TestingModule } from '@nestjs/testing';
import { AuditActorRole, Prisma, UserRole } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockPrismaService = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
  runWithTenant: jest.fn(),
  runWithoutTenant: jest.fn(),
};

const auditLogRecord = {
  id: 'audit-1',
  company_id: 'company-1',
  actor_id: 'user-1',
  actor_role: AuditActorRole.admin,
  action: 'route.updated',
  entity_type: 'route',
  entity_id: 'route-1',
  before: { status: 'draft' },
  after: { status: 'planned' },
  request_id: 'req-1',
  metadata: { source: 'domain-event' },
  created_at: new Date('2026-04-17T09:00:00.000Z'),
  updated_at: new Date('2026-04-17T09:00:00.000Z'),
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );
    mockPrismaService.runWithoutTenant.mockImplementation(
      async (callback: () => Promise<unknown>) => await callback(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PinoLogger, useValue: mockLogger },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('lists tenant audit logs with filters and limit', async () => {
    mockPrismaService.auditLog.findMany.mockResolvedValue([auditLogRecord]);

    const result = await service.listAuditLogs('company-1', {
      action: 'route.updated',
      entityType: 'route',
      entityId: 'route-1',
      actorId: 'user-1',
      requestId: 'req-1',
      createdFrom: new Date('2026-04-17T00:00:00.000Z'),
      createdTo: new Date('2026-04-18T00:00:00.000Z'),
      limit: 25,
    });

    expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        action: 'route.updated',
        entity_type: 'route',
        entity_id: 'route-1',
        actor_id: 'user-1',
        request_id: 'req-1',
        created_at: {
          gte: new Date('2026-04-17T00:00:00.000Z'),
          lte: new Date('2026-04-18T00:00:00.000Z'),
        },
      },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: 25,
      select: expect.any(Object),
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: 'audit-1',
        companyId: 'company-1',
        action: 'route.updated',
      }),
    ]);
  });

  it('appends audit log for order.created and resolves actor role from user role', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue({
      role: UserRole.admin,
    });
    mockPrismaService.auditLog.create.mockResolvedValue({});

    await service.handleOrderCreated({
      orderId: 'order-1',
      companyId: 'company-1',
      createdByUserId: 'user-1',
      requestId: 'req-1',
      order: {
        id: 'order-1',
        companyId: 'company-1',
        status: 'new',
        deliveryAddress: 'Moscow, Tverskaya 1',
        externalId: null,
        orderNumber: null,
        customerName: null,
        customerPhone: null,
        deliveryLatitude: null,
        deliveryLongitude: null,
        comment: null,
        scheduledDate: null,
        timeWindowFrom: null,
        timeWindowTo: null,
        zoneId: null,
        assignedCourierId: null,
        createdByUserId: 'user-1',
        assignedByUserId: null,
        metadata: null,
        createdAt: new Date('2026-04-17T09:00:00.000Z'),
        updatedAt: new Date('2026-04-17T09:00:00.000Z'),
      },
    });

    expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
        company_id: 'company-1',
      },
      select: {
        role: true,
      },
    });
    expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        actor_id: 'user-1',
        actor_role: AuditActorRole.admin,
        action: 'order.created',
        entity_type: 'order',
        entity_id: 'order-1',
        before: Prisma.JsonNull,
        request_id: 'req-1',
        metadata: {
          source: 'domain-event',
        },
      }),
    });
  });

  it('appends route.cancelled with before/after snapshots', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue({
      role: UserRole.dispatcher,
    });
    mockPrismaService.auditLog.create.mockResolvedValue({});

    await service.handleRouteCancelled({
      routeId: 'route-1',
      companyId: 'company-1',
      actorUserId: 'user-2',
      fromStatus: 'planned',
      toStatus: 'cancelled',
      requestId: 'req-2',
      route: {
        id: 'route-1',
        companyId: 'company-1',
        courierId: 'courier-1',
        status: 'cancelled',
        version: 3,
        routeDate: new Date('2026-04-18T09:00:00.000Z'),
        createdByUserId: 'user-2',
        totalDistanceMeters: 1800,
        totalDurationSeconds: 720,
        provider: 'mock-yandex',
        polyline: [],
        routePoints: [],
        optimizationData: null,
        metadata: null,
        createdAt: new Date('2026-04-17T09:00:00.000Z'),
        updatedAt: new Date('2026-04-17T10:00:00.000Z'),
      },
    });

    expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actor_role: AuditActorRole.dispatcher,
        action: 'route.cancelled',
        entity_type: 'route',
        entity_id: 'route-1',
        before: {
          status: 'planned',
        },
        metadata: {
          source: 'domain-event',
          fromStatus: 'planned',
          toStatus: 'cancelled',
        },
      }),
    });
  });

  it('uses explicit courier actor role without extra user lookup', async () => {
    mockPrismaService.auditLog.create.mockResolvedValue({});

    await service.handleCourierLocationUpdated({
      courierId: 'courier-1',
      companyId: 'company-1',
      actorUserId: 'dispatcher-1',
      actorRole: UserRole.dispatcher,
      requestId: 'req-3',
      latitude: 55.75,
      longitude: 37.61,
      lastSeenAt: new Date('2026-04-17T09:15:00.000Z'),
      courier: {
        id: 'courier-1',
        companyId: 'company-1',
        userId: 'courier-user-1',
        status: 'available',
        isOnline: true,
        email: 'courier@example.com',
        phone: '+79990000000',
        firstName: 'Ivan',
        lastName: 'Petrov',
        isActive: true,
        latitude: 55.75,
        longitude: 37.61,
        lastSeenAt: new Date('2026-04-17T09:15:00.000Z'),
        createdAt: new Date('2026-04-16T09:00:00.000Z'),
        updatedAt: new Date('2026-04-17T09:15:00.000Z'),
      },
    });

    expect(mockPrismaService.user.findFirst).not.toHaveBeenCalled();
    expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actor_role: AuditActorRole.dispatcher,
        action: 'courier.location-updated',
        entity_type: 'courier',
        entity_id: 'courier-1',
      }),
    });
  });

  it('appends payment.approved audit entry with payment snapshots', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue({
      role: UserRole.admin,
    });
    mockPrismaService.auditLog.create.mockResolvedValue({});

    await service.handlePaymentApproved({
      paymentId: 'payment-1',
      companyId: 'company-1',
      actorUserId: 'admin-1',
      fromStatus: 'calculated',
      toStatus: 'approved',
      requestId: 'req-4',
      payment: {
        id: 'payment-1',
        companyId: 'company-1',
        courierId: 'courier-1',
        paymentRuleVersionId: null,
        status: 'approved',
        periodStart: new Date('2026-04-18T00:00:00.000Z'),
        periodEnd: new Date('2026-04-18T23:59:59.999Z'),
        currency: 'RUB',
        amount: '425.00',
        breakdown: {
          summary: {
            totalAmount: 425,
          },
        },
        approvedByUserId: 'admin-1',
        approvedAt: new Date('2026-04-18T12:00:00.000Z'),
        paidAt: null,
        metadata: {
          calculatedByUserId: 'admin-1',
        },
        createdAt: new Date('2026-04-18T10:00:00.000Z'),
        updatedAt: new Date('2026-04-18T12:00:00.000Z'),
      },
    });

    expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actor_role: AuditActorRole.admin,
        action: 'payment.approved',
        entity_type: 'payment',
        entity_id: 'payment-1',
        before: {
          status: 'calculated',
        },
        metadata: {
          source: 'domain-event',
          fromStatus: 'calculated',
          toStatus: 'approved',
        },
      }),
    });
  });
});
