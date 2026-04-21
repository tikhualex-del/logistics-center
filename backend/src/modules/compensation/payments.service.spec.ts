/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getQueueToken } from '@nestjs/bull';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  OrderStatus,
  PaymentRuleType,
  PaymentStatus,
  RouteStatus,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { InvalidPaymentStateTransitionException } from './exceptions/invalid-payment-state-transition.exception';
import { PaymentsService } from './payments.service';

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

const mockPaymentCalculationJob = {
  finished: jest.fn(),
};

const mockPaymentCalculationQueue = {
  add: jest.fn(),
};

const routeDate = new Date('2026-04-18T09:00:00.000Z');

const completedRoute = {
  id: 'route-1',
  courier_id: 'courier-1',
  status: RouteStatus.completed,
  route_date: routeDate,
  optimization_data: {
    distanceMeters: 10000,
  },
  route_points: [
    {
      id: 'route-point-1',
      order_id: 'order-1',
      sequence: 1,
      order: {
        id: 'order-1',
        status: OrderStatus.delivered,
        zone_id: 'zone-1',
        delivery_address: 'Moscow, Tverskaya 1',
      },
    },
    {
      id: 'route-point-2',
      order_id: 'order-2',
      sequence: 2,
      order: {
        id: 'order-2',
        status: OrderStatus.delivered,
        zone_id: 'zone-2',
        delivery_address: 'Moscow, Tverskaya 2',
      },
    },
  ],
};

const currentRules = [
  {
    id: 'rule-zone-v1',
    company_id: 'company-1',
    rule_key: 'rule-zone',
    name: 'Central zone rate',
    rule_type: PaymentRuleType.zone_rate,
    version: 1,
    config: {
      value: 100,
      conditions: { zoneId: 'zone-1' },
    },
    changed_by_user_id: 'user-1',
    change_reason: null,
    is_active: true,
    effective_from: new Date('2026-01-01T00:00:00.000Z'),
    effective_to: null,
    created_at: new Date('2026-04-17T00:00:00.000Z'),
    updated_at: new Date('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 'rule-km-v1',
    company_id: 'company-1',
    rule_key: 'rule-km',
    name: 'Mileage',
    rule_type: PaymentRuleType.per_km,
    version: 1,
    config: {
      value: 10,
      conditions: null,
    },
    changed_by_user_id: 'user-1',
    change_reason: null,
    is_active: true,
    effective_from: new Date('2026-01-01T00:00:00.000Z'),
    effective_to: null,
    created_at: new Date('2026-04-17T00:00:00.000Z'),
    updated_at: new Date('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 'rule-order-v1',
    company_id: 'company-1',
    rule_key: 'rule-order',
    name: 'Per order v1',
    rule_type: PaymentRuleType.per_order,
    version: 1,
    config: {
      value: 40,
      conditions: null,
    },
    changed_by_user_id: 'user-1',
    change_reason: null,
    is_active: true,
    effective_from: new Date('2026-01-01T00:00:00.000Z'),
    effective_to: null,
    created_at: new Date('2026-04-16T00:00:00.000Z'),
    updated_at: new Date('2026-04-16T00:00:00.000Z'),
  },
  {
    id: 'rule-order-v2',
    company_id: 'company-1',
    rule_key: 'rule-order',
    name: 'Per order v2',
    rule_type: PaymentRuleType.per_order,
    version: 2,
    config: {
      value: 50,
      conditions: null,
    },
    changed_by_user_id: 'user-1',
    change_reason: null,
    is_active: true,
    effective_from: new Date('2026-01-01T00:00:00.000Z'),
    effective_to: null,
    created_at: new Date('2026-04-18T00:00:00.000Z'),
    updated_at: new Date('2026-04-18T00:00:00.000Z'),
  },
  {
    id: 'rule-bonus-v1',
    company_id: 'company-1',
    rule_key: 'rule-bonus',
    name: 'Volume bonus',
    rule_type: PaymentRuleType.bonus,
    version: 1,
    config: {
      value: 200,
      conditions: { metric: 'completed_orders', threshold: 2 },
    },
    changed_by_user_id: 'user-1',
    change_reason: null,
    is_active: true,
    effective_from: new Date('2026-01-01T00:00:00.000Z'),
    effective_to: null,
    created_at: new Date('2026-04-17T00:00:00.000Z'),
    updated_at: new Date('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 'rule-penalty-v1',
    company_id: 'company-1',
    rule_key: 'rule-penalty',
    name: 'Route shortage penalty',
    rule_type: PaymentRuleType.penalty,
    version: 1,
    config: {
      value: 75,
      conditions: { metric: 'completed_routes', threshold: 2 },
    },
    changed_by_user_id: 'user-1',
    change_reason: null,
    is_active: true,
    effective_from: new Date('2026-01-01T00:00:00.000Z'),
    effective_to: null,
    created_at: new Date('2026-04-17T00:00:00.000Z'),
    updated_at: new Date('2026-04-17T00:00:00.000Z'),
  },
];

const mockPrismaService = {
  courier: {
    findFirst: jest.fn(),
  },
  paymentRuleVersion: {
    findMany: jest.fn(),
  },
  route: {
    findMany: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  runWithTenant: jest.fn(),
};

interface PaymentCreateMockArgs {
  data: {
    amount: Prisma.Decimal;
    breakdown: Prisma.InputJsonValue;
    company_id: string;
    courier_id: string;
    currency: string;
    metadata: Prisma.InputJsonValue;
    payment_rule_version_id: string | null;
    period_end: Date;
    period_start: Date;
    status: PaymentStatus;
  };
}

interface PaymentUpdateMockArgs {
  data: {
    approved_at?: Date | null;
    approved_by_user_id?: string | null;
    metadata?: Prisma.InputJsonValue;
    paid_at?: Date | null;
    status?: PaymentStatus;
  };
}

function buildPaymentRecord(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: 'payment-1',
    company_id: 'company-1',
    courier_id: 'courier-1',
    payment_rule_version_id: null,
    status: PaymentStatus.calculated,
    period_start: new Date('2026-04-18T00:00:00.000Z'),
    period_end: new Date('2026-04-18T23:59:59.999Z'),
    currency: 'RUB',
    amount: new Prisma.Decimal('425.00'),
    breakdown: {
      summary: {
        totalAmount: 425,
      },
    },
    approved_by_user_id: null,
    approved_at: null,
    paid_at: null,
    metadata: {
      calculatedByUserId: 'admin-1',
      appliedRuleCount: 5,
      stateTransitions: [
        {
          fromStatus: PaymentStatus.draft,
          toStatus: PaymentStatus.calculated,
          actorUserId: 'admin-1',
          transitionedAt: '2026-04-18T10:00:00.000Z',
        },
      ],
    },
    created_at: new Date('2026-04-18T10:00:00.000Z'),
    updated_at: new Date('2026-04-18T10:00:00.000Z'),
    ...overrides,
  };
}

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );
    mockEventEmitter.emitAsync.mockResolvedValue([]);
    mockPaymentCalculationQueue.add.mockReset();
    mockPaymentCalculationJob.finished.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        {
          provide: getQueueToken('payment-calculation'),
          useValue: mockPaymentCalculationQueue,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('queues payment calculation and returns the completed job result', async () => {
    const queuedPayment = {
      id: 'payment-queued-1',
      companyId: 'company-1',
      courierId: 'courier-1',
      paymentRuleVersionId: null,
      status: PaymentStatus.calculated,
      periodStart: new Date('2026-04-18T00:00:00.000Z'),
      periodEnd: new Date('2026-04-18T23:59:59.999Z'),
      currency: 'RUB',
      amount: '425.00',
      breakdown: {
        summary: {
          totalAmount: 425,
        },
      },
      approvedByUserId: null,
      approvedAt: null,
      paidAt: null,
      metadata: {
        calculatedByUserId: 'admin-1',
      },
      createdAt: new Date('2026-04-18T10:00:00.000Z'),
      updatedAt: new Date('2026-04-18T10:00:00.000Z'),
    };
    mockPaymentCalculationQueue.add.mockResolvedValue(
      mockPaymentCalculationJob,
    );
    mockPaymentCalculationJob.finished.mockResolvedValue({
      ok: true,
      payment: queuedPayment,
    });

    await expect(
      service.calculatePayment('company-1', 'admin-1', {
        courierId: 'courier-1',
        periodStart: new Date('2026-04-18T00:00:00.000Z'),
        periodEnd: new Date('2026-04-18T23:59:59.999Z'),
        currency: 'RUB',
      }),
    ).resolves.toEqual(queuedPayment);
    expect(mockPaymentCalculationQueue.add).toHaveBeenCalledWith(
      'calculate-payment',
      {
        companyId: 'company-1',
        actorUserId: 'admin-1',
        requestId: null,
        dto: {
          courierId: 'courier-1',
          periodStart: '2026-04-18T00:00:00.000Z',
          periodEnd: '2026-04-18T23:59:59.999Z',
          currency: 'RUB',
        },
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    expect(mockPaymentCalculationJob.finished).toHaveBeenCalled();
  });

  it('rethrows queued payment calculation failures as HTTP exceptions', async () => {
    mockPaymentCalculationQueue.add.mockResolvedValue(
      mockPaymentCalculationJob,
    );
    mockPaymentCalculationJob.finished.mockResolvedValue({
      ok: false,
      error: {
        statusCode: 404,
        message: 'Courier not found',
      },
    });

    await expect(
      service.calculatePayment('company-1', 'admin-1', {
        courierId: 'missing-courier',
        periodStart: new Date('2026-04-18T00:00:00.000Z'),
        periodEnd: new Date('2026-04-18T23:59:59.999Z'),
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('calculates append-only payment from active rules and completed routes', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue({ id: 'courier-1' });
    mockPrismaService.paymentRuleVersion.findMany.mockResolvedValue(
      currentRules,
    );
    mockPrismaService.route.findMany.mockResolvedValue([completedRoute]);
    mockPrismaService.payment.create.mockImplementation(
      ({ data }: PaymentCreateMockArgs) => ({
        id: 'payment-1',
        company_id: data.company_id,
        courier_id: data.courier_id,
        payment_rule_version_id: data.payment_rule_version_id,
        status: data.status,
        period_start: data.period_start,
        period_end: data.period_end,
        currency: data.currency,
        amount: new Prisma.Decimal('425.00'),
        breakdown: data.breakdown,
        approved_by_user_id: null,
        approved_at: null,
        paid_at: null,
        metadata: data.metadata,
        created_at: new Date('2026-04-18T10:00:00.000Z'),
        updated_at: new Date('2026-04-18T10:00:00.000Z'),
      }),
    );

    const result = await service.runPaymentCalculationJob({
      companyId: 'company-1',
      actorUserId: 'admin-1',
      requestId: 'req-1',
      dto: {
        courierId: 'courier-1',
        periodStart: '2026-04-18T00:00:00.000Z',
        periodEnd: '2026-04-18T23:59:59.999Z',
        currency: 'RUB',
      },
    });

    expect(mockPrismaService.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        courier_id: 'courier-1',
        payment_rule_version_id: null,
        status: PaymentStatus.calculated,
        currency: 'RUB',
        amount: expect.any(Prisma.Decimal),
        metadata: expect.objectContaining({
          calculatedByUserId: 'admin-1',
          appliedRuleCount: 5,
          stateTransitions: expect.arrayContaining([
            expect.objectContaining({
              fromStatus: PaymentStatus.draft,
              toStatus: PaymentStatus.calculated,
              actorUserId: 'admin-1',
            }),
          ]),
        }),
      }),
      select: expect.any(Object),
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'payment-1',
        courierId: 'courier-1',
        status: PaymentStatus.calculated,
        amount: '425.00',
        breakdown: expect.objectContaining({
          summary: expect.objectContaining({
            completedRoutesCount: 1,
            deliveredOrdersCount: 2,
            totalDistanceKm: 10,
            totalAmount: 425,
          }),
          appliedRuleVersionIds: expect.arrayContaining([
            'rule-zone-v1',
            'rule-km-v1',
            'rule-order-v2',
            'rule-bonus-v1',
            'rule-penalty-v1',
          ]),
        }),
      }),
    );
    expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
      DOMAIN_EVENTS.PAYMENT.CALCULATED,
      expect.objectContaining({
        paymentId: 'payment-1',
        companyId: 'company-1',
        actorUserId: 'admin-1',
        fromStatus: PaymentStatus.draft,
        toStatus: PaymentStatus.calculated,
        requestId: 'req-1',
      }),
    );
  });

  it('applies minimum guarantee top-up when subtotal is below the floor', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue({ id: 'courier-1' });
    mockPrismaService.paymentRuleVersion.findMany.mockResolvedValue([
      {
        id: 'rule-guarantee-v1',
        company_id: 'company-1',
        rule_key: 'rule-guarantee',
        name: 'Daily guarantee',
        rule_type: PaymentRuleType.minimum_guarantee,
        version: 1,
        config: {
          value: 500,
          conditions: { period: 'daily' },
        },
        changed_by_user_id: 'user-1',
        change_reason: null,
        is_active: true,
        effective_from: new Date('2026-01-01T00:00:00.000Z'),
        effective_to: null,
        created_at: new Date('2026-04-17T00:00:00.000Z'),
        updated_at: new Date('2026-04-17T00:00:00.000Z'),
      },
    ]);
    mockPrismaService.route.findMany.mockResolvedValue([]);
    mockPrismaService.payment.create.mockImplementation(
      ({ data }: PaymentCreateMockArgs) => ({
        ...buildPaymentRecord({
          id: 'payment-2',
          amount: new Prisma.Decimal('500.00'),
          breakdown: data.breakdown,
          metadata: data.metadata,
        }),
      }),
    );

    const result = await service.runPaymentCalculationJob({
      companyId: 'company-1',
      actorUserId: 'admin-1',
      requestId: 'req-2',
      dto: {
        courierId: 'courier-1',
        periodStart: '2026-04-18T00:00:00.000Z',
        periodEnd: '2026-04-18T23:59:59.999Z',
      },
    });

    expect(result.amount).toBe('500.00');
    expect(result.breakdown).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          subtotalBeforeGuarantee: 0,
          minimumGuaranteeTopUp: 500,
          totalAmount: 500,
        }),
      }),
    );
  });

  it('rounds route metrics, rule components, and final payment amount', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue({ id: 'courier-1' });
    mockPrismaService.paymentRuleVersion.findMany.mockResolvedValue([
      {
        ...currentRules[1],
        config: {
          value: 1.234,
          conditions: null,
        },
      },
      {
        ...currentRules[3],
        config: {
          value: 10.01,
          conditions: null,
        },
      },
    ]);
    mockPrismaService.route.findMany.mockResolvedValue([
      {
        ...completedRoute,
        optimization_data: {
          distanceMeters: 12345.6,
        },
        route_points: [completedRoute.route_points[0]],
      },
    ]);
    mockPrismaService.payment.create.mockImplementation(
      ({ data }: PaymentCreateMockArgs) => ({
        ...buildPaymentRecord({
          id: 'payment-rounding',
          amount: data.amount,
          breakdown: data.breakdown,
          metadata: data.metadata,
        }),
      }),
    );

    const result = await service.runPaymentCalculationJob({
      companyId: 'company-1',
      actorUserId: 'admin-1',
      requestId: 'req-rounding',
      dto: {
        courierId: 'courier-1',
        periodStart: '2026-04-18T00:00:00.000Z',
        periodEnd: '2026-04-18T23:59:59.999Z',
      },
    });

    expect(result.amount).toBe('25.24');
    expect(result.breakdown).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          totalDistanceKm: 12.346,
          subtotalBeforeGuarantee: 25.24,
          totalAmount: 25.24,
        }),
        metrics: expect.objectContaining({
          totalDistanceMeters: 12345.6,
          totalDistanceKm: 12.346,
        }),
        components: expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'rule-km-v1',
            amount: 15.23,
          }),
          expect.objectContaining({
            ruleId: 'rule-order-v2',
            amount: 10.01,
          }),
        ]),
      }),
    );
  });

  it('skips inactive and out-of-window payment rules', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue({ id: 'courier-1' });
    mockPrismaService.paymentRuleVersion.findMany.mockResolvedValue([
      {
        ...currentRules[3],
        id: 'rule-active-v1',
        rule_key: 'rule-active',
        config: {
          value: 25,
          conditions: null,
        },
      },
      {
        ...currentRules[3],
        id: 'rule-inactive-v1',
        rule_key: 'rule-inactive',
        is_active: false,
        config: {
          value: 999,
          conditions: null,
        },
      },
      {
        ...currentRules[3],
        id: 'rule-future-v1',
        rule_key: 'rule-future',
        effective_from: new Date('2026-05-01T00:00:00.000Z'),
        config: {
          value: 999,
          conditions: null,
        },
      },
      {
        ...currentRules[3],
        id: 'rule-expired-v1',
        rule_key: 'rule-expired',
        effective_to: new Date('2026-04-17T23:59:59.999Z'),
        config: {
          value: 999,
          conditions: null,
        },
      },
    ]);
    mockPrismaService.route.findMany.mockResolvedValue([
      {
        ...completedRoute,
        route_points: [completedRoute.route_points[0]],
      },
    ]);
    mockPrismaService.payment.create.mockImplementation(
      ({ data }: PaymentCreateMockArgs) => ({
        ...buildPaymentRecord({
          id: 'payment-effective-rules',
          amount: data.amount,
          breakdown: data.breakdown,
          metadata: data.metadata,
        }),
      }),
    );

    const result = await service.runPaymentCalculationJob({
      companyId: 'company-1',
      actorUserId: 'admin-1',
      requestId: 'req-effective-rules',
      dto: {
        courierId: 'courier-1',
        periodStart: '2026-04-18T00:00:00.000Z',
        periodEnd: '2026-04-18T23:59:59.999Z',
      },
    });

    expect(result.amount).toBe('25.00');
    expect(result.breakdown).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          appliedRuleCount: 1,
          componentCount: 1,
          totalAmount: 25,
        }),
        appliedRuleVersionIds: ['rule-active-v1'],
      }),
    );
  });

  it('ignores undelivered orders and excludes zero-value rule components from applied rules', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue({ id: 'courier-1' });
    mockPrismaService.paymentRuleVersion.findMany.mockResolvedValue([
      {
        ...currentRules[0],
        id: 'rule-edge-zone',
        rule_key: 'rule-edge-zone',
        config: {
          value: 100,
          conditions: { zoneId: 'zone-2' },
        },
      },
      {
        ...currentRules[3],
        id: 'rule-edge-per-order',
        rule_key: 'rule-edge-per-order',
        config: {
          value: 25,
          conditions: null,
        },
      },
      {
        ...currentRules[4],
        id: 'rule-edge-bonus',
        rule_key: 'rule-edge-bonus',
        config: {
          value: 500,
          conditions: { metric: 'completed_orders', threshold: 2 },
        },
      },
    ]);
    mockPrismaService.route.findMany.mockResolvedValue([
      {
        ...completedRoute,
        route_points: [
          completedRoute.route_points[0],
          {
            ...completedRoute.route_points[1],
            order: {
              ...completedRoute.route_points[1].order,
              status: OrderStatus.undelivered,
            },
          },
        ],
      },
    ]);
    mockPrismaService.payment.create.mockImplementation(
      ({ data }: PaymentCreateMockArgs) => ({
        ...buildPaymentRecord({
          id: 'payment-edge-cases',
          amount: data.amount,
          breakdown: data.breakdown,
          metadata: data.metadata,
        }),
      }),
    );

    const result = await service.runPaymentCalculationJob({
      companyId: 'company-1',
      actorUserId: 'admin-1',
      requestId: 'req-edge-cases',
      dto: {
        courierId: 'courier-1',
        periodStart: '2026-04-18T00:00:00.000Z',
        periodEnd: '2026-04-18T23:59:59.999Z',
      },
    });

    expect(result.amount).toBe('25.00');
    expect(result.breakdown).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          deliveredOrdersCount: 1,
          appliedRuleCount: 1,
          componentCount: 3,
          totalAmount: 25,
        }),
        appliedRuleVersionIds: ['rule-edge-per-order'],
        orders: [
          expect.objectContaining({
            orderId: 'order-1',
            zoneId: 'zone-1',
          }),
        ],
        components: expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'rule-edge-zone',
            applied: false,
            amount: 0,
          }),
          expect.objectContaining({
            ruleId: 'rule-edge-per-order',
            applied: true,
            amount: 25,
          }),
          expect.objectContaining({
            ruleId: 'rule-edge-bonus',
            applied: false,
            amount: 0,
          }),
        ]),
      }),
    );
  });

  it('lists payments with tenant filters', async () => {
    mockPrismaService.payment.findMany.mockResolvedValue([
      buildPaymentRecord(),
    ]);

    const result = await service.listPayments('company-1', {
      status: PaymentStatus.calculated,
      courierId: '9e4b526a-6ef0-48dc-87ab-0f4440d7c001',
      periodStartFrom: new Date('2026-04-01T00:00:00.000Z'),
      periodEndTo: new Date('2026-04-30T23:59:59.999Z'),
      limit: 25,
    });

    expect(mockPrismaService.payment.findMany).toHaveBeenCalledWith({
      where: {
        status: PaymentStatus.calculated,
        courier_id: '9e4b526a-6ef0-48dc-87ab-0f4440d7c001',
        period_start: {
          gte: new Date('2026-04-01T00:00:00.000Z'),
        },
        period_end: {
          lte: new Date('2026-04-30T23:59:59.999Z'),
        },
      },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: 25,
      select: expect.any(Object),
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: 'payment-1',
        status: PaymentStatus.calculated,
      }),
    ]);
  });

  it('returns payment detail in tenant scope', async () => {
    mockPrismaService.payment.findFirst.mockResolvedValue(buildPaymentRecord());

    await expect(service.getPayment('company-1', 'payment-1')).resolves.toEqual(
      expect.objectContaining({
        id: 'payment-1',
        amount: '425.00',
      }),
    );
    expect(mockPrismaService.payment.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'payment-1',
      },
      select: expect.any(Object),
    });
  });

  it('approves calculated payment and emits payment.approved', async () => {
    const currentPayment = buildPaymentRecord();
    mockPrismaService.payment.findFirst.mockResolvedValue(currentPayment);
    mockPrismaService.payment.update.mockImplementation(
      ({ data }: PaymentUpdateMockArgs) => ({
        ...currentPayment,
        status: data.status,
        approved_by_user_id: data.approved_by_user_id,
        approved_at: data.approved_at,
        metadata: data.metadata,
        updated_at: new Date('2026-04-18T12:00:00.000Z'),
      }),
    );

    const result = await service.updatePaymentStatus(
      'company-1',
      'admin-2',
      'payment-1',
      {
        status: PaymentStatus.approved,
        reason: 'Finance approved the payout batch',
        metadata: {
          batchId: 'batch-1',
        },
      },
    );

    expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: expect.objectContaining({
        status: PaymentStatus.approved,
        approved_by_user_id: 'admin-2',
        approved_at: expect.any(Date),
        metadata: expect.any(Object),
      }),
      select: expect.any(Object),
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'payment-1',
        status: PaymentStatus.approved,
        approvedByUserId: 'admin-2',
        approvedAt: expect.any(Date),
        metadata: expect.objectContaining({
          calculatedByUserId: 'admin-1',
          appliedRuleCount: 5,
          stateTransitions: expect.arrayContaining([
            expect.objectContaining({
              fromStatus: PaymentStatus.draft,
              toStatus: PaymentStatus.calculated,
            }),
            expect.objectContaining({
              fromStatus: PaymentStatus.calculated,
              toStatus: PaymentStatus.approved,
              actorUserId: 'admin-2',
              reason: 'Finance approved the payout batch',
              metadata: {
                batchId: 'batch-1',
              },
            }),
          ]),
        }),
      }),
    );
    expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
      DOMAIN_EVENTS.PAYMENT.APPROVED,
      expect.objectContaining({
        paymentId: 'payment-1',
        companyId: 'company-1',
        actorUserId: 'admin-2',
        fromStatus: PaymentStatus.calculated,
        toStatus: PaymentStatus.approved,
      }),
    );
  });

  it('throws on invalid payment status transition', async () => {
    mockPrismaService.payment.findFirst.mockResolvedValue(
      buildPaymentRecord({
        status: PaymentStatus.calculated,
      }),
    );

    await expect(
      service.updatePaymentStatus('company-1', 'admin-1', 'payment-1', {
        status: PaymentStatus.paid,
      }),
    ).rejects.toThrow(InvalidPaymentStateTransitionException);
    expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
  });

  it('logs warning and keeps response when payment.approved event emission fails', async () => {
    const currentPayment = buildPaymentRecord();
    mockPrismaService.payment.findFirst.mockResolvedValue(currentPayment);
    mockPrismaService.payment.update.mockImplementation(
      ({ data }: PaymentUpdateMockArgs) => ({
        ...currentPayment,
        status: data.status,
        approved_by_user_id: data.approved_by_user_id,
        approved_at: data.approved_at,
        metadata: data.metadata,
      }),
    );
    mockEventEmitter.emitAsync.mockRejectedValueOnce(new Error('broker down'));

    await expect(
      service.updatePaymentStatus('company-1', 'admin-1', 'payment-1', {
        status: PaymentStatus.approved,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'payment-1',
        status: PaymentStatus.approved,
      }),
    );
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'payment-1',
        companyId: 'company-1',
        actorUserId: 'admin-1',
        error: expect.any(Error),
      }),
      'Payment approved event emission failed',
    );
  });

  it('throws when courier is missing in tenant scope', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue(null);

    await expect(
      service.runPaymentCalculationJob({
        companyId: 'company-1',
        actorUserId: 'admin-1',
        requestId: 'req-3',
        dto: {
          courierId: 'missing-courier',
          periodStart: '2026-04-18T00:00:00.000Z',
          periodEnd: '2026-04-18T23:59:59.999Z',
        },
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws on invalid calculation period', async () => {
    await expect(
      service.runPaymentCalculationJob({
        companyId: 'company-1',
        actorUserId: 'admin-1',
        requestId: 'req-4',
        dto: {
          courierId: 'courier-1',
          periodStart: '2026-04-19T00:00:00.000Z',
          periodEnd: '2026-04-18T00:00:00.000Z',
        },
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
