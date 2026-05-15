import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditActorRole, OrderStatus, Prisma } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { getTenantContextRequestId } from '../../prisma/tenant-context.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { InvalidStateTransitionException } from './exceptions/invalid-state-transition.exception';
import { canTransition } from './order-state-machine';
import type {
  OrderCreatedEvent,
  OrderStatusChangedEvent,
} from './orders.events';

const JSON_NULL = Prisma.JsonNull;
const TIME_ONLY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const orderSelect = {
  id: true,
  company_id: true,
  status: true,
  external_id: true,
  order_number: true,
  customer_name: true,
  customer_phone: true,
  delivery_address: true,
  delivery_latitude: true,
  delivery_longitude: true,
  comment: true,
  scheduled_date: true,
  time_window_from: true,
  time_window_to: true,
  zone_id: true,
  assigned_courier_id: true,
  created_by_user_id: true,
  assigned_by_user_id: true,
  metadata: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.OrderSelect;

type OrderRecord = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(OrdersService.name);
  }

  async createOrder(
    companyId: string,
    actorUserId: string | null,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      validateTimeWindow(dto.timeWindowFrom, dto.timeWindowTo);
      await this.ensureUniqueOrderKeys(dto);
      await this.ensureReferences({
        zoneId: dto.zoneId,
        assignedCourierId: dto.assignedCourierId,
      });

      const order = await this.prisma.order.create({
        data: {
          company_id: companyId,
          status: OrderStatus.new,
          external_id: dto.externalId ?? null,
          order_number: dto.orderNumber ?? null,
          customer_name: dto.customerName ?? null,
          customer_phone: dto.customerPhone ?? null,
          delivery_address: dto.deliveryAddress,
          delivery_latitude: toDecimal(dto.deliveryLatitude),
          delivery_longitude: toDecimal(dto.deliveryLongitude),
          comment: dto.comment ?? null,
          scheduled_date: dto.scheduledDate ?? null,
          time_window_from: dto.timeWindowFrom ?? null,
          time_window_to: dto.timeWindowTo ?? null,
          zone_id: dto.zoneId ?? null,
          assigned_courier_id: dto.assignedCourierId ?? null,
          created_by_user_id: actorUserId,
          assigned_by_user_id: dto.assignedCourierId ? actorUserId : null,
          metadata:
            dto.metadata === undefined
              ? JSON_NULL
              : (dto.metadata as Prisma.InputJsonValue),
        } satisfies Prisma.OrderUncheckedCreateInput,
        select: orderSelect,
      });

      this.logger.info(
        {
          orderId: order.id,
          companyId,
          createdByUserId: actorUserId,
        },
        'Order created',
      );

      const orderDto = mapOrder(order);

      await this.emitOrderCreated({
        orderId: order.id,
        companyId,
        createdByUserId: actorUserId,
        requestId: getTenantContextRequestId() ?? null,
        order: orderDto,
      });

      return orderDto;
    });
  }

  async listOrders(
    companyId: string,
    filters: ListOrdersQueryDto,
  ): Promise<OrderResponseDto[]> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const where: Prisma.OrderWhereInput = { company_id: companyId };
      const andFilters: Prisma.OrderWhereInput[] = [];

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.zoneId) {
        where.zone_id = filters.zoneId;
      }

      if (filters.date) {
        const { start, end } = buildDateRange(filters.date);
        where.scheduled_date = {
          gte: start,
          lt: end,
        };
      }

      if (filters.search) {
        where.OR = [
          { external_id: { contains: filters.search, mode: 'insensitive' } },
          { order_number: { contains: filters.search, mode: 'insensitive' } },
          { customer_name: { contains: filters.search, mode: 'insensitive' } },
          { customer_phone: { contains: filters.search, mode: 'insensitive' } },
          {
            delivery_address: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        ];
      }

      andFilters.push(...buildTimeWindowOverlapFilters(filters));
      if (andFilters.length > 0) {
        where.AND = andFilters;
      }

      const orders = await this.prisma.order.findMany({
        where,
        orderBy: { created_at: 'desc' },
        select: orderSelect,
      });

      return orders.map(mapOrder);
    });
  }

  async getOrder(
    companyId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const order = await this.prisma.order.findFirst({
        where: { id: orderId },
        select: orderSelect,
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return mapOrder(order);
    });
  }

  async updateOrder(
    companyId: string,
    actorUserId: string,
    orderId: string,
    dto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      validateTimeWindow(dto.timeWindowFrom, dto.timeWindowTo);

      const currentOrder = await this.prisma.order.findFirst({
        where: { id: orderId },
        select: orderSelect,
      });

      if (!currentOrder) {
        throw new NotFoundException('Order not found');
      }

      await this.ensureUniqueOrderKeys(dto, orderId);
      await this.ensureReferences({
        zoneId: dto.zoneId,
        assignedCourierId: dto.assignedCourierId,
      });

      const assignmentChanged =
        dto.assignedCourierId !== undefined &&
        dto.assignedCourierId !== currentOrder.assigned_courier_id;

      const data: Prisma.OrderUncheckedUpdateInput = {};

      if (dto.externalId !== undefined) data.external_id = dto.externalId;
      if (dto.orderNumber !== undefined) data.order_number = dto.orderNumber;
      if (dto.customerName !== undefined) data.customer_name = dto.customerName;
      if (dto.customerPhone !== undefined)
        data.customer_phone = dto.customerPhone;
      if (dto.deliveryAddress !== undefined) {
        data.delivery_address = dto.deliveryAddress;
      }
      if (dto.deliveryLatitude !== undefined) {
        data.delivery_latitude = toDecimal(dto.deliveryLatitude);
      }
      if (dto.deliveryLongitude !== undefined) {
        data.delivery_longitude = toDecimal(dto.deliveryLongitude);
      }
      if (dto.comment !== undefined) data.comment = dto.comment;
      if (dto.scheduledDate !== undefined)
        data.scheduled_date = dto.scheduledDate;
      if (dto.timeWindowFrom !== undefined) {
        data.time_window_from = dto.timeWindowFrom;
      }
      if (dto.timeWindowTo !== undefined)
        data.time_window_to = dto.timeWindowTo;
      if (dto.zoneId !== undefined) data.zone_id = dto.zoneId;
      if (dto.assignedCourierId !== undefined) {
        data.assigned_courier_id = dto.assignedCourierId;
      }
      if (dto.metadata !== undefined) {
        data.metadata =
          dto.metadata === null
            ? JSON_NULL
            : (dto.metadata as Prisma.InputJsonValue);
      }
      if (assignmentChanged) {
        data.assigned_by_user_id = dto.assignedCourierId ? actorUserId : null;
      }

      const order = await this.prisma.order.update({
        where: { id: orderId },
        data,
        select: orderSelect,
      });

      this.logger.info(
        {
          orderId,
          companyId,
          updatedByUserId: actorUserId,
        },
        'Order updated',
      );

      return mapOrder(order);
    });
  }

  async transitionOrderStatus(
    companyId: string,
    actorUserId: string,
    actorRole: AuditActorRole,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const transitionResult = await this.prisma.$transaction(async (tx) => {
        const currentOrder = await tx.order.findFirst({
          where: {
            id: orderId,
            company_id: companyId,
          },
          select: orderSelect,
        });

        if (!currentOrder) {
          throw new NotFoundException('Order not found');
        }

        if (!canTransition(currentOrder.status, dto.status)) {
          throw new InvalidStateTransitionException(
            currentOrder.status,
            dto.status,
          );
        }

        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status: dto.status,
          },
          select: orderSelect,
        });

        await tx.orderStatusHistory.create({
          data: {
            company_id: companyId,
            order_id: orderId,
            from_status: currentOrder.status,
            to_status: dto.status,
            changed_by_user_id: actorUserId,
            reason: dto.reason ?? null,
            metadata:
              dto.metadata === undefined
                ? JSON_NULL
                : (dto.metadata as Prisma.InputJsonValue),
          },
        });

        await tx.auditLog.create({
          data: {
            company_id: companyId,
            actor_id: actorUserId,
            actor_role: actorRole,
            action: 'order.status-changed',
            entity_type: 'order',
            entity_id: orderId,
            request_id: getTenantContextRequestId() ?? null,
            before: {
              status: currentOrder.status,
            },
            after: {
              status: dto.status,
              reason: dto.reason ?? null,
            },
            metadata:
              dto.metadata === undefined
                ? JSON_NULL
                : (dto.metadata as Prisma.InputJsonValue),
          },
        });

        this.logger.info(
          {
            orderId,
            companyId,
            fromStatus: currentOrder.status,
            toStatus: dto.status,
            actorUserId,
            actorRole,
          },
          'Order status transitioned',
        );

        return {
          order: mapOrder(updatedOrder),
          fromStatus: currentOrder.status,
        };
      });

      await this.emitOrderStatusChanged({
        orderId,
        companyId,
        actorUserId,
        actorRole,
        fromStatus: transitionResult.fromStatus,
        toStatus: dto.status,
        reason: dto.reason ?? null,
        requestId: getTenantContextRequestId() ?? null,
        order: transitionResult.order,
      });

      return transitionResult.order;
    });
  }

  private async ensureUniqueOrderKeys(
    dto: {
      externalId?: string | null;
      orderNumber?: string | null;
    },
    excludeOrderId?: string,
  ): Promise<void> {
    if (dto.externalId) {
      const existingByExternalId = await this.prisma.order.findFirst({
        where: {
          external_id: dto.externalId,
          ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
        },
        select: { id: true },
      });

      if (existingByExternalId) {
        throw new ConflictException(
          'Order with this externalId already exists in this company',
        );
      }
    }

    if (dto.orderNumber) {
      const existingByOrderNumber = await this.prisma.order.findFirst({
        where: {
          order_number: dto.orderNumber,
          ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
        },
        select: { id: true },
      });

      if (existingByOrderNumber) {
        throw new ConflictException(
          'Order with this orderNumber already exists in this company',
        );
      }
    }
  }

  private async ensureReferences(options: {
    zoneId?: string | null;
    assignedCourierId?: string | null;
  }): Promise<void> {
    const { zoneId, assignedCourierId } = options;

    if (zoneId) {
      const zone = await this.prisma.zone.findFirst({
        where: { id: zoneId },
        select: { id: true },
      });

      if (!zone) {
        throw new NotFoundException('Zone not found');
      }
    }

    if (assignedCourierId) {
      const courier = await this.prisma.courier.findFirst({
        where: { id: assignedCourierId },
        select: { id: true },
      });

      if (!courier) {
        throw new NotFoundException('Assigned courier not found');
      }
    }
  }

  private async emitOrderCreated(payload: OrderCreatedEvent): Promise<void> {
    try {
      await this.eventEmitter.emitAsync(DOMAIN_EVENTS.ORDER.CREATED, payload);
    } catch (error) {
      this.logger.warn(
        {
          orderId: payload.orderId,
          companyId: payload.companyId,
          error,
        },
        'Order created event emission failed',
      );
    }
  }

  private async emitOrderStatusChanged(
    payload: OrderStatusChangedEvent,
  ): Promise<void> {
    try {
      await this.eventEmitter.emitAsync(
        DOMAIN_EVENTS.ORDER.STATUS_CHANGED,
        payload,
      );
    } catch (error) {
      this.logger.warn(
        {
          orderId: payload.orderId,
          companyId: payload.companyId,
          fromStatus: payload.fromStatus,
          toStatus: payload.toStatus,
          error,
        },
        'Order status-changed event emission failed',
      );
    }
  }
}

function mapOrder(order: OrderRecord): OrderResponseDto {
  return {
    id: order.id,
    companyId: order.company_id,
    status: order.status,
    externalId: order.external_id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    deliveryAddress: order.delivery_address,
    deliveryLatitude: decimalToNumber(order.delivery_latitude),
    deliveryLongitude: decimalToNumber(order.delivery_longitude),
    comment: order.comment,
    scheduledDate: order.scheduled_date,
    timeWindowFrom: order.time_window_from,
    timeWindowTo: order.time_window_to,
    zoneId: order.zone_id,
    assignedCourierId: order.assigned_courier_id,
    createdByUserId: order.created_by_user_id,
    assignedByUserId: order.assigned_by_user_id,
    metadata: isPlainObject(order.metadata)
      ? (order.metadata as Record<string, unknown>)
      : null,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

function validateTimeWindow(
  timeWindowFrom?: Date | null,
  timeWindowTo?: Date | null,
): void {
  if (timeWindowFrom && timeWindowTo && timeWindowFrom > timeWindowTo) {
    throw new BadRequestException(
      'timeWindowFrom must be earlier than or equal to timeWindowTo',
    );
  }
}

function buildDateRange(date: string): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function buildTimeWindowOverlapFilters(
  filters: ListOrdersQueryDto,
): Prisma.OrderWhereInput[] {
  const filterFrom = filters.timeWindowFrom
    ? parseListTimeWindow(filters.timeWindowFrom, filters.date)
    : null;
  const filterTo = filters.timeWindowTo
    ? parseListTimeWindow(filters.timeWindowTo, filters.date)
    : null;

  if (!filterFrom && !filterTo) {
    return [];
  }

  if (filterFrom && filterTo && filterFrom > filterTo) {
    throw new BadRequestException(
      'timeWindowFrom must be earlier than or equal to timeWindowTo',
    );
  }

  const where: Prisma.OrderWhereInput[] = [];

  if (filterTo) {
    where.push({ time_window_from: { lt: filterTo } });
  }

  if (filterFrom) {
    where.push({ time_window_to: { gt: filterFrom } });
  }

  return where;
}

function parseListTimeWindow(value: string, selectedDate?: string): Date {
  const normalized = value.trim();

  if (TIME_ONLY_PATTERN.test(normalized)) {
    if (!selectedDate) {
      throw new BadRequestException(
        'date is required when timeWindow filters use HH:mm format',
      );
    }

    return new Date(`${selectedDate}T${normalized}:00.000Z`);
  }

  const timestamp = Date.parse(normalized);

  if (Number.isNaN(timestamp)) {
    throw new BadRequestException(
      'timeWindow filters must use HH:mm or a valid date-time value',
    );
  }

  return new Date(timestamp);
}

function toDecimal(
  value: number | null | undefined,
): Prisma.Decimal | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return new Prisma.Decimal(value);
}

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (!value) {
    return null;
  }

  return value.toNumber();
}

function isPlainObject(
  value: Prisma.JsonValue | null,
): value is Prisma.JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
