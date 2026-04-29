import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrderStatus,
  PaymentRuleType,
  PaymentStatus,
  Prisma,
  RouteStatus,
} from '@prisma/client';
import type { Job, Queue } from 'bull';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { stringifyUnknown } from '../../common/utils/stringify-unknown';
import { getTenantContextRequestId } from '../../prisma/tenant-context.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PAYMENT_CALCULATION_JOB,
  PAYMENT_CALCULATION_QUEUE,
} from './compensation.constants';
import { CalculatePaymentDto } from './dto/calculate-payment.dto';
import { ListPaymentsQueryDto } from './dto/list-payments.query.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { InvalidPaymentStateTransitionException } from './exceptions/invalid-payment-state-transition.exception';
import {
  isRuleEffectiveNow,
  parsePaymentRuleConfig,
  validateEffectiveWindow,
} from './payment-rule-config';
import { canTransitionPayment } from './payment-state-machine';
import type {
  PaymentApprovedEvent,
  PaymentCalculatedEvent,
} from './payments.events';
import type {
  PaymentCalculationJobData,
  PaymentCalculationJobResult,
} from './payment-calculation.types';

const paymentSelect = {
  id: true,
  company_id: true,
  courier_id: true,
  payment_rule_version_id: true,
  status: true,
  period_start: true,
  period_end: true,
  currency: true,
  amount: true,
  breakdown: true,
  approved_by_user_id: true,
  approved_at: true,
  paid_at: true,
  metadata: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.PaymentSelect;

const paymentRuleSelect = {
  id: true,
  company_id: true,
  rule_key: true,
  name: true,
  rule_type: true,
  version: true,
  config: true,
  changed_by_user_id: true,
  change_reason: true,
  is_active: true,
  effective_from: true,
  effective_to: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.PaymentRuleVersionSelect;

const completedRouteSelect = {
  id: true,
  courier_id: true,
  status: true,
  route_date: true,
  optimization_data: true,
  route_points: {
    orderBy: { sequence: 'asc' },
    select: {
      id: true,
      order_id: true,
      sequence: true,
      order: {
        select: {
          id: true,
          status: true,
          zone_id: true,
          delivery_address: true,
        },
      },
    },
  },
} satisfies Prisma.RouteSelect;

type PaymentRecord = Prisma.PaymentGetPayload<{ select: typeof paymentSelect }>;
type PaymentRuleRecord = Prisma.PaymentRuleVersionGetPayload<{
  select: typeof paymentRuleSelect;
}>;
type CompletedRouteRecord = Prisma.RouteGetPayload<{
  select: typeof completedRouteSelect;
}>;

type SupportedMetric = 'completed_orders' | 'completed_routes' | 'distance_km';
type GuaranteePeriod = 'daily' | 'weekly' | 'monthly';

interface PaymentMetrics {
  completedRoutesCount: number;
  deliveredOrdersCount: number;
  totalDistanceMeters: number;
  totalDistanceKm: number;
  deliveredOrders: DeliveredOrderMetric[];
  routes: RouteMetric[];
}

interface DeliveredOrderMetric {
  routeId: string;
  routeDate: Date;
  orderId: string;
  sequence: number;
  zoneId: string | null;
  deliveryAddress: string;
}

interface RouteMetric {
  routeId: string;
  routeDate: Date;
  distanceMeters: number;
  distanceKm: number;
  deliveredOrdersCount: number;
}

interface PaymentBreakdownComponent {
  ruleId: string;
  ruleKey: string;
  version: number;
  ruleType: PaymentRuleType;
  name: string;
  applied: boolean;
  amount: number;
  reason: string;
  details: Record<string, unknown>;
}

interface PaymentBreakdownSummary {
  completedRoutesCount: number;
  deliveredOrdersCount: number;
  totalDistanceKm: number;
  subtotalBeforeGuarantee: number;
  minimumGuaranteeTopUp: number;
  totalAmount: number;
  appliedRuleCount: number;
  componentCount: number;
}

interface PaymentBreakdown {
  currency: string;
  period: {
    start: string;
    end: string;
  };
  summary: PaymentBreakdownSummary;
  metrics: {
    completedRoutesCount: number;
    deliveredOrdersCount: number;
    totalDistanceMeters: number;
    totalDistanceKm: number;
  };
  routes: Array<Record<string, unknown>>;
  orders: Array<Record<string, unknown>>;
  components: PaymentBreakdownComponent[];
  appliedRuleVersionIds: string[];
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(PAYMENT_CALCULATION_QUEUE)
    private readonly paymentCalculationQueue: Queue<PaymentCalculationJobData>,
  ) {
    this.logger.setContext(PaymentsService.name);
  }

  async listPayments(
    companyId: string,
    query: ListPaymentsQueryDto,
  ): Promise<PaymentResponseDto[]> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const where: Prisma.PaymentWhereInput = {};

      if (query.status) {
        where.status = query.status;
      }

      if (query.courierId) {
        where.courier_id = query.courierId;
      }

      if (query.periodStartFrom || query.periodEndTo) {
        where.period_start = query.periodStartFrom
          ? {
              gte: query.periodStartFrom,
            }
          : undefined;
        where.period_end = query.periodEndTo
          ? {
              lte: query.periodEndTo,
            }
          : undefined;
      }

      const payments = await this.prisma.payment.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        take: query.limit ?? 50,
        select: paymentSelect,
      });

      return payments.map(mapPayment);
    });
  }

  async getPayment(
    companyId: string,
    paymentId: string,
  ): Promise<PaymentResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const payment = await this.prisma.payment.findFirst({
        where: {
          id: paymentId,
        },
        select: paymentSelect,
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      return mapPayment(payment);
    });
  }

  async calculatePayment(
    companyId: string,
    actorUserId: string,
    dto: CalculatePaymentDto,
  ): Promise<PaymentResponseDto> {
    validateEffectiveWindow(dto.periodStart, dto.periodEnd);

    const job = await this.paymentCalculationQueue.add(
      PAYMENT_CALCULATION_JOB,
      {
        companyId,
        actorUserId,
        requestId: getTenantContextRequestId() ?? null,
        dto: {
          courierId: dto.courierId,
          periodStart: dto.periodStart.toISOString(),
          periodEnd: dto.periodEnd.toISOString(),
          ...(dto.currency ? { currency: dto.currency } : {}),
        },
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    return await this.waitForPaymentCalculation(job);
  }

  async runPaymentCalculationJob(
    job: PaymentCalculationJobData,
  ): Promise<PaymentResponseDto> {
    return await this.calculatePaymentInternal(
      job.companyId,
      job.actorUserId,
      {
        courierId: job.dto.courierId,
        periodStart: new Date(job.dto.periodStart),
        periodEnd: new Date(job.dto.periodEnd),
        currency: job.dto.currency,
      },
      job.requestId,
    );
  }

  private async waitForPaymentCalculation(
    job: Job<PaymentCalculationJobData>,
  ): Promise<PaymentResponseDto> {
    let result: PaymentCalculationJobResult;

    try {
      result = (await job.finished()) as PaymentCalculationJobResult;
    } catch (error) {
      this.logger.error(
        {
          jobId: job.id,
          queue: PAYMENT_CALCULATION_QUEUE,
          error,
        },
        'Payment calculation queue failed unexpectedly',
      );

      throw new InternalServerErrorException(
        'Payment calculation queue failed',
      );
    }

    if (result.ok) {
      return result.payment;
    }

    throw createPaymentCalculationException(result.error);
  }

  private async calculatePaymentInternal(
    companyId: string,
    actorUserId: string,
    dto: CalculatePaymentDto,
    requestId: string | null,
  ): Promise<PaymentResponseDto> {
    validateEffectiveWindow(dto.periodStart, dto.periodEnd);

    return await this.prisma.runWithTenant(companyId, async () => {
      const courier = await this.prisma.courier.findFirst({
        where: { id: dto.courierId },
        select: { id: true },
      });

      if (!courier) {
        throw new NotFoundException('Courier not found');
      }

      const [ruleVersions, completedRoutes] = await Promise.all([
        this.prisma.paymentRuleVersion.findMany({
          orderBy: [
            { rule_key: 'asc' },
            { version: 'desc' },
            { created_at: 'desc' },
          ],
          select: paymentRuleSelect,
        }),
        this.prisma.route.findMany({
          where: {
            courier_id: dto.courierId,
            status: RouteStatus.completed,
            deleted_at: null,
            route_date: {
              gte: dto.periodStart,
              lte: dto.periodEnd,
            },
          },
          orderBy: [{ route_date: 'asc' }, { created_at: 'asc' }],
          select: completedRouteSelect,
        }),
      ]);

      const activeRules = latestRulesOnly(ruleVersions).filter(
        (rule) =>
          rule.is_active &&
          isRuleEffectiveForPeriod(
            rule.effective_from,
            rule.effective_to,
            dto.periodStart,
            dto.periodEnd,
          ),
      );

      const metrics = buildPaymentMetrics(completedRoutes);
      const breakdown = buildPaymentBreakdown(
        activeRules,
        metrics,
        dto.periodStart,
        dto.periodEnd,
        dto.currency ?? 'RUB',
      );
      const transitionTimestamp = new Date();

      const payment = await this.prisma.payment.create({
        data: {
          company_id: companyId,
          courier_id: dto.courierId,
          payment_rule_version_id: null,
          status: PaymentStatus.calculated,
          period_start: dto.periodStart,
          period_end: dto.periodEnd,
          currency: dto.currency ?? 'RUB',
          amount: new Prisma.Decimal(roundMoney(breakdown.summary.totalAmount)),
          breakdown: toInputJsonValue(breakdown),
          metadata: buildPaymentCalculationMetadata(
            actorUserId,
            breakdown.summary.appliedRuleCount,
            transitionTimestamp,
          ),
        },
        select: paymentSelect,
      });

      const mappedPayment = mapPayment(payment);

      this.logger.info(
        {
          paymentId: payment.id,
          companyId,
          courierId: dto.courierId,
          amount: payment.amount.toFixed(2),
          ruleCount: breakdown.summary.appliedRuleCount,
        },
        'Payment calculated',
      );

      await this.emitPaymentCalculated({
        paymentId: payment.id,
        companyId,
        actorUserId,
        fromStatus: PaymentStatus.draft,
        toStatus: PaymentStatus.calculated,
        requestId,
        payment: mappedPayment,
      });

      return mappedPayment;
    });
  }

  async updatePaymentStatus(
    companyId: string,
    actorUserId: string,
    paymentId: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<PaymentResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const currentPayment = await this.prisma.payment.findFirst({
        where: {
          id: paymentId,
        },
        select: paymentSelect,
      });

      if (!currentPayment) {
        throw new NotFoundException('Payment not found');
      }

      if (!canTransitionPayment(currentPayment.status, dto.status)) {
        throw new InvalidPaymentStateTransitionException(
          currentPayment.status,
          dto.status,
        );
      }

      const transitionTimestamp = new Date();
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: dto.status,
          ...(dto.status === PaymentStatus.approved
            ? {
                approved_by_user_id: actorUserId,
                approved_at: transitionTimestamp,
              }
            : {}),
          ...(dto.status === PaymentStatus.paid
            ? {
                paid_at: transitionTimestamp,
              }
            : {}),
          metadata: toInputJsonValue(
            appendPaymentStatusTransition(currentPayment.metadata, {
              fromStatus: currentPayment.status,
              toStatus: dto.status,
              actorUserId,
              transitionedAt: transitionTimestamp,
              reason: dto.reason ?? null,
              metadata: dto.metadata ?? null,
            }),
          ),
        },
        select: paymentSelect,
      });

      const payment = mapPayment(updatedPayment);

      this.logger.info(
        {
          paymentId,
          companyId,
          actorUserId,
          fromStatus: currentPayment.status,
          toStatus: dto.status,
        },
        'Payment status updated',
      );

      if (dto.status === PaymentStatus.calculated) {
        await this.emitPaymentCalculated({
          paymentId,
          companyId,
          actorUserId,
          fromStatus: currentPayment.status,
          toStatus: PaymentStatus.calculated,
          requestId: getTenantContextRequestId() ?? null,
          payment,
        });
      }

      if (dto.status === PaymentStatus.approved) {
        await this.emitPaymentApproved({
          paymentId,
          companyId,
          actorUserId,
          fromStatus: currentPayment.status,
          toStatus: PaymentStatus.approved,
          requestId: getTenantContextRequestId() ?? null,
          payment,
        });
      }

      return payment;
    });
  }

  private async emitPaymentCalculated(
    payload: PaymentCalculatedEvent,
  ): Promise<void> {
    try {
      await this.eventEmitter.emitAsync(
        DOMAIN_EVENTS.PAYMENT.CALCULATED,
        payload,
      );
    } catch (error) {
      this.logger.warn(
        {
          paymentId: payload.paymentId,
          companyId: payload.companyId,
          actorUserId: payload.actorUserId,
          error,
        },
        'Payment calculated event emission failed',
      );
    }
  }

  private async emitPaymentApproved(
    payload: PaymentApprovedEvent,
  ): Promise<void> {
    try {
      await this.eventEmitter.emitAsync(
        DOMAIN_EVENTS.PAYMENT.APPROVED,
        payload,
      );
    } catch (error) {
      this.logger.warn(
        {
          paymentId: payload.paymentId,
          companyId: payload.companyId,
          actorUserId: payload.actorUserId,
          error,
        },
        'Payment approved event emission failed',
      );
    }
  }
}

function createPaymentCalculationException(error: {
  statusCode: number;
  message: string;
}): BadRequestException | NotFoundException | InternalServerErrorException {
  if (error.statusCode === 404) {
    return new NotFoundException(error.message);
  }

  if (error.statusCode >= 500) {
    return new InternalServerErrorException(error.message);
  }

  return new BadRequestException(error.message);
}

function mapPayment(payment: PaymentRecord): PaymentResponseDto {
  return {
    id: payment.id,
    companyId: payment.company_id,
    courierId: payment.courier_id,
    paymentRuleVersionId: payment.payment_rule_version_id,
    status: payment.status,
    periodStart: payment.period_start,
    periodEnd: payment.period_end,
    currency: payment.currency,
    amount: payment.amount.toFixed(2),
    breakdown: toRecord(payment.breakdown) ?? {},
    approvedByUserId: payment.approved_by_user_id,
    approvedAt: payment.approved_at,
    paidAt: payment.paid_at,
    metadata: toRecord(payment.metadata),
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
  };
}

function buildPaymentCalculationMetadata(
  actorUserId: string,
  appliedRuleCount: number,
  transitionedAt: Date,
): Prisma.InputJsonObject {
  return {
    calculatedByUserId: actorUserId,
    appliedRuleCount,
    stateTransitions: [
      {
        fromStatus: PaymentStatus.draft,
        toStatus: PaymentStatus.calculated,
        actorUserId,
        transitionedAt: transitionedAt.toISOString(),
      },
    ],
    lastStatusTransition: {
      fromStatus: PaymentStatus.draft,
      toStatus: PaymentStatus.calculated,
      actorUserId,
      transitionedAt: transitionedAt.toISOString(),
    },
  } satisfies Prisma.InputJsonObject;
}

function appendPaymentStatusTransition(
  metadata: Prisma.JsonValue | null,
  transition: {
    fromStatus: PaymentStatus;
    toStatus: PaymentStatus;
    actorUserId: string;
    transitionedAt: Date;
    reason: string | null;
    metadata: Record<string, unknown> | null;
  },
): Record<string, unknown> {
  const currentMetadata = toRecord(metadata) ?? {};
  const nextTransition: Record<string, unknown> = {
    fromStatus: transition.fromStatus,
    toStatus: transition.toStatus,
    actorUserId: transition.actorUserId,
    transitionedAt: transition.transitionedAt.toISOString(),
  };

  if (transition.reason) {
    nextTransition.reason = transition.reason;
  }

  if (transition.metadata && Object.keys(transition.metadata).length > 0) {
    nextTransition.metadata = transition.metadata;
  }

  return {
    ...currentMetadata,
    stateTransitions: [
      ...toRecordArray(currentMetadata['stateTransitions']),
      nextTransition,
    ],
    lastStatusTransition: nextTransition,
  };
}

function latestRulesOnly(rules: PaymentRuleRecord[]): PaymentRuleRecord[] {
  const latestByRuleKey = new Map<string, PaymentRuleRecord>();

  for (const rule of rules) {
    const existing = latestByRuleKey.get(rule.rule_key);

    if (!existing || rule.version > existing.version) {
      latestByRuleKey.set(rule.rule_key, rule);
    }
  }

  return [...latestByRuleKey.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function buildPaymentMetrics(routes: CompletedRouteRecord[]): PaymentMetrics {
  const deliveredOrders: DeliveredOrderMetric[] = [];
  const routeMetrics: RouteMetric[] = [];
  let totalDistanceMeters = 0;

  for (const route of routes) {
    const distanceMeters = readRouteDistanceMeters(route.optimization_data);
    totalDistanceMeters += distanceMeters;

    const routeDeliveredOrders = route.route_points
      .filter((point) => point.order.status === OrderStatus.delivered)
      .map((point) => ({
        routeId: route.id,
        routeDate: route.route_date,
        orderId: point.order.id,
        sequence: point.sequence,
        zoneId: point.order.zone_id,
        deliveryAddress: point.order.delivery_address,
      }));

    deliveredOrders.push(...routeDeliveredOrders);
    routeMetrics.push({
      routeId: route.id,
      routeDate: route.route_date,
      distanceMeters,
      distanceKm: roundMetric(distanceMeters / 1000),
      deliveredOrdersCount: routeDeliveredOrders.length,
    });
  }

  return {
    completedRoutesCount: routes.length,
    deliveredOrdersCount: deliveredOrders.length,
    totalDistanceMeters: roundMetric(totalDistanceMeters),
    totalDistanceKm: roundMetric(totalDistanceMeters / 1000),
    deliveredOrders,
    routes: routeMetrics,
  };
}

function buildPaymentBreakdown(
  rules: PaymentRuleRecord[],
  metrics: PaymentMetrics,
  periodStart: Date,
  periodEnd: Date,
  currency: string,
): PaymentBreakdown {
  const components: PaymentBreakdownComponent[] = [];
  let runningSubtotal = 0;
  let subtotalBeforeGuarantee = 0;
  let minimumGuaranteeTopUp = 0;

  for (const rule of rules) {
    const config = parsePaymentRuleConfig(rule.config);
    const component = buildRuleComponent(
      rule,
      config.value,
      config.conditions,
      metrics,
      periodStart,
      periodEnd,
      runningSubtotal,
    );

    components.push(component);
    runningSubtotal = roundMoney(runningSubtotal + component.amount);

    if (rule.rule_type === PaymentRuleType.minimum_guarantee) {
      minimumGuaranteeTopUp = roundMoney(
        minimumGuaranteeTopUp + component.amount,
      );
    } else {
      subtotalBeforeGuarantee = runningSubtotal;
    }
  }

  subtotalBeforeGuarantee = roundMoney(subtotalBeforeGuarantee);
  const totalAmount = roundMoney(Math.max(0, runningSubtotal));
  const appliedComponents = components.filter(
    (component) => component.applied && component.amount !== 0,
  );

  return {
    currency,
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    summary: {
      completedRoutesCount: metrics.completedRoutesCount,
      deliveredOrdersCount: metrics.deliveredOrdersCount,
      totalDistanceKm: metrics.totalDistanceKm,
      subtotalBeforeGuarantee,
      minimumGuaranteeTopUp,
      totalAmount,
      appliedRuleCount: appliedComponents.length,
      componentCount: components.length,
    },
    metrics: {
      completedRoutesCount: metrics.completedRoutesCount,
      deliveredOrdersCount: metrics.deliveredOrdersCount,
      totalDistanceMeters: metrics.totalDistanceMeters,
      totalDistanceKm: metrics.totalDistanceKm,
    },
    routes: metrics.routes.map((route) => ({
      routeId: route.routeId,
      routeDate: route.routeDate.toISOString(),
      distanceMeters: route.distanceMeters,
      distanceKm: route.distanceKm,
      deliveredOrdersCount: route.deliveredOrdersCount,
    })),
    orders: metrics.deliveredOrders.map((order) => ({
      routeId: order.routeId,
      routeDate: order.routeDate.toISOString(),
      orderId: order.orderId,
      sequence: order.sequence,
      zoneId: order.zoneId,
      deliveryAddress: order.deliveryAddress,
    })),
    components,
    appliedRuleVersionIds: appliedComponents.map(
      (component) => component.ruleId,
    ),
  };
}

function buildRuleComponent(
  rule: PaymentRuleRecord,
  value: number,
  conditions: Record<string, unknown> | null,
  metrics: PaymentMetrics,
  periodStart: Date,
  periodEnd: Date,
  runningSubtotal: number,
): PaymentBreakdownComponent {
  switch (rule.rule_type) {
    case PaymentRuleType.zone_rate:
      return buildZoneRateComponent(rule, value, conditions, metrics);
    case PaymentRuleType.per_km:
      return buildPerKmComponent(rule, value, metrics);
    case PaymentRuleType.per_order:
      return buildPerOrderComponent(rule, value, metrics);
    case PaymentRuleType.bonus:
      return buildBonusComponent(rule, value, conditions, metrics);
    case PaymentRuleType.penalty:
      return buildPenaltyComponent(rule, value, conditions, metrics);
    case PaymentRuleType.minimum_guarantee:
      return buildMinimumGuaranteeComponent(
        rule,
        value,
        conditions,
        periodStart,
        periodEnd,
        runningSubtotal,
      );
    default:
      throw new BadRequestException('Unsupported payment rule type');
  }
}

function buildZoneRateComponent(
  rule: PaymentRuleRecord,
  value: number,
  conditions: Record<string, unknown> | null,
  metrics: PaymentMetrics,
): PaymentBreakdownComponent {
  const zoneId = readString(conditions?.['zoneId']);
  const matchedOrders = metrics.deliveredOrders.filter(
    (order) => order.zoneId === zoneId,
  );
  const amount = roundMoney(value * matchedOrders.length);

  return {
    ruleId: rule.id,
    ruleKey: rule.rule_key,
    version: rule.version,
    ruleType: rule.rule_type,
    name: rule.name,
    applied: matchedOrders.length > 0,
    amount,
    reason:
      matchedOrders.length > 0
        ? 'Applied zone rate to delivered orders in the configured zone'
        : 'No delivered orders matched the configured zone',
    details: {
      zoneId,
      unitValue: value,
      matchedOrderCount: matchedOrders.length,
      orderIds: matchedOrders.map((order) => order.orderId),
    },
  };
}

function buildPerKmComponent(
  rule: PaymentRuleRecord,
  value: number,
  metrics: PaymentMetrics,
): PaymentBreakdownComponent {
  const amount = roundMoney(value * metrics.totalDistanceKm);

  return {
    ruleId: rule.id,
    ruleKey: rule.rule_key,
    version: rule.version,
    ruleType: rule.rule_type,
    name: rule.name,
    applied: metrics.totalDistanceKm > 0,
    amount,
    reason:
      metrics.totalDistanceKm > 0
        ? 'Applied rate per completed route kilometer'
        : 'No completed route distance found in the period',
    details: {
      totalDistanceKm: metrics.totalDistanceKm,
      ratePerKm: value,
    },
  };
}

function buildPerOrderComponent(
  rule: PaymentRuleRecord,
  value: number,
  metrics: PaymentMetrics,
): PaymentBreakdownComponent {
  const amount = roundMoney(value * metrics.deliveredOrdersCount);

  return {
    ruleId: rule.id,
    ruleKey: rule.rule_key,
    version: rule.version,
    ruleType: rule.rule_type,
    name: rule.name,
    applied: metrics.deliveredOrdersCount > 0,
    amount,
    reason:
      metrics.deliveredOrdersCount > 0
        ? 'Applied rate per delivered order'
        : 'No delivered orders found in the period',
    details: {
      deliveredOrdersCount: metrics.deliveredOrdersCount,
      ratePerOrder: value,
      orderIds: metrics.deliveredOrders.map((order) => order.orderId),
    },
  };
}

function buildBonusComponent(
  rule: PaymentRuleRecord,
  value: number,
  conditions: Record<string, unknown> | null,
  metrics: PaymentMetrics,
): PaymentBreakdownComponent {
  const metric = readMetric(conditions?.['metric']);
  const threshold = readNumber(conditions?.['threshold']) ?? 0;
  const metricValue = readMetricValue(metric, metrics);
  const applied = metricValue >= threshold;

  return {
    ruleId: rule.id,
    ruleKey: rule.rule_key,
    version: rule.version,
    ruleType: rule.rule_type,
    name: rule.name,
    applied,
    amount: applied ? roundMoney(value) : 0,
    reason: applied ? 'Bonus threshold reached' : 'Bonus threshold not reached',
    details: {
      metric,
      metricValue,
      threshold,
      bonusValue: value,
    },
  };
}

function buildPenaltyComponent(
  rule: PaymentRuleRecord,
  value: number,
  conditions: Record<string, unknown> | null,
  metrics: PaymentMetrics,
): PaymentBreakdownComponent {
  const metric = readMetric(conditions?.['metric']);
  const threshold = readNumber(conditions?.['threshold']) ?? 0;
  const metricValue = readMetricValue(metric, metrics);
  const applied = metricValue < threshold;

  return {
    ruleId: rule.id,
    ruleKey: rule.rule_key,
    version: rule.version,
    ruleType: rule.rule_type,
    name: rule.name,
    applied,
    amount: applied ? roundMoney(-value) : 0,
    reason: applied
      ? 'Penalty threshold breached'
      : 'Penalty threshold not breached',
    details: {
      metric,
      metricValue,
      threshold,
      penaltyValue: value,
    },
  };
}

function buildMinimumGuaranteeComponent(
  rule: PaymentRuleRecord,
  value: number,
  conditions: Record<string, unknown> | null,
  periodStart: Date,
  periodEnd: Date,
  runningSubtotal: number,
): PaymentBreakdownComponent {
  const period = readGuaranteePeriod(conditions?.['period']);
  const matchesPeriod = matchesGuaranteePeriod(period, periodStart, periodEnd);
  const amount =
    matchesPeriod && runningSubtotal < value
      ? roundMoney(value - runningSubtotal)
      : 0;

  return {
    ruleId: rule.id,
    ruleKey: rule.rule_key,
    version: rule.version,
    ruleType: rule.rule_type,
    name: rule.name,
    applied: amount > 0,
    amount,
    reason:
      amount > 0
        ? 'Applied minimum guarantee top-up'
        : matchesPeriod
          ? 'Current subtotal already satisfies the minimum guarantee'
          : 'Requested period does not match the guarantee period',
    details: {
      period,
      runningSubtotal: roundMoney(runningSubtotal),
      guaranteedAmount: value,
      matchesPeriod,
    },
  };
}

function isRuleEffectiveForPeriod(
  effectiveFrom: Date | null,
  effectiveTo: Date | null,
  periodStart: Date,
  periodEnd: Date,
): boolean {
  if (effectiveFrom && effectiveFrom > periodEnd) {
    return false;
  }

  if (effectiveTo && effectiveTo < periodStart) {
    return false;
  }

  return isRuleEffectiveNow(effectiveFrom, effectiveTo, periodEnd);
}

function matchesGuaranteePeriod(
  period: GuaranteePeriod,
  periodStart: Date,
  periodEnd: Date,
): boolean {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  switch (period) {
    case 'daily':
      return isSameUtcDay(start, end);
    case 'weekly':
      return dayDiff(start, end) === 6;
    case 'monthly':
      return (
        start.getUTCFullYear() === end.getUTCFullYear() &&
        start.getUTCMonth() === end.getUTCMonth() &&
        start.getUTCDate() === 1 &&
        end.getUTCDate() ===
          daysInUtcMonth(start.getUTCFullYear(), start.getUTCMonth())
      );
    default:
      return false;
  }
}

function isSameUtcDay(left: Date, right: Date): boolean {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

function dayDiff(start: Date, end: Date): number {
  const startDate = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  );
  const endDate = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );

  return Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000));
}

function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function readMetric(value: unknown): SupportedMetric {
  if (
    value === 'completed_orders' ||
    value === 'completed_routes' ||
    value === 'distance_km'
  ) {
    return value;
  }

  throw new BadRequestException('Unsupported bonus/penalty metric');
}

function readGuaranteePeriod(value: unknown): GuaranteePeriod {
  if (value === 'daily' || value === 'weekly' || value === 'monthly') {
    return value;
  }

  throw new BadRequestException('Unsupported minimum guarantee period');
}

function readMetricValue(
  metric: SupportedMetric,
  metrics: PaymentMetrics,
): number {
  switch (metric) {
    case 'completed_orders':
      return metrics.deliveredOrdersCount;
    case 'completed_routes':
      return metrics.completedRoutesCount;
    case 'distance_km':
      return metrics.totalDistanceKm;
    default:
      return 0;
  }
}

function readRouteDistanceMeters(
  optimizationData: Prisma.JsonValue | null,
): number {
  if (
    typeof optimizationData !== 'object' ||
    optimizationData === null ||
    Array.isArray(optimizationData)
  ) {
    return 0;
  }

  const value = optimizationData['distanceMeters'];
  return readNumber(value) ?? 0;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function roundMetric(value: number): number {
  return Number(value.toFixed(3));
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

function toRecord(
  value: Prisma.JsonValue | null,
): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is Record<string, unknown> =>
      typeof entry === 'object' && entry !== null && !Array.isArray(entry),
  );
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value as Prisma.InputJsonValue;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) =>
      toInputJsonValue(entry),
    ) as Prisma.InputJsonArray;
  }

  if (typeof value === 'object') {
    const inputObject: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) {
        continue;
      }

      inputObject[key] = toInputJsonValue(entry);
    }

    return inputObject as Prisma.InputJsonObject;
  }

  return stringifyUnknown(value);
}
