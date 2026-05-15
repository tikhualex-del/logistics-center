import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditActorRole, OrderStatus, Prisma, RouteStatus } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { stringifyUnknown } from '../../common/utils/stringify-unknown';
import { getTenantContextRequestId } from '../../prisma/tenant-context.service';
import { PrismaService } from '../../prisma/prisma.service';
import { canTransition } from '../orders/order-state-machine';
import type { OrderStatusChangedEvent } from '../orders/orders.events';
import { BuildRouteDto } from './dto/build-route.dto';
import { ListRoutesQueryDto } from './dto/list-routes.query.dto';
import { RoutePointResponseDto } from './dto/route-point-response.dto';
import { RoutePreviewResponseDto } from './dto/route-preview-response.dto';
import { RouteResponseDto } from './dto/route-response.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { InvalidRouteStateTransitionException } from './exceptions/invalid-route-state-transition.exception';
import {
  ROUTING_PROVIDER,
  type Coordinates,
  type RouteOptions as ProviderRouteOptions,
  type RoutePoint as ProviderRoutePoint,
  type RouteResult as ProviderRouteResult,
  type RoutingProvider,
} from './providers/routing-provider.interface';
import { canTransitionRoute } from './route-state-machine';
import type {
  RouteBuiltEvent,
  RouteCancelledEvent,
  RouteUpdatedEvent,
} from './routing.events';

const JSON_NULL = Prisma.JsonNull;
const ACTIVE_ROUTE_STATUSES = [
  RouteStatus.draft,
  RouteStatus.planned,
  RouteStatus.in_progress,
] as const;
const TERMINAL_ORDER_STATUSES = new Set<OrderStatus>([
  OrderStatus.delivered,
  OrderStatus.undelivered,
  OrderStatus.returned,
  OrderStatus.cancelled,
]);

const orderForRouteSelect = {
  id: true,
  company_id: true,
  status: true,
  customer_name: true,
  delivery_address: true,
  delivery_latitude: true,
  delivery_longitude: true,
  scheduled_date: true,
  zone_id: true,
  assigned_courier_id: true,
} satisfies Prisma.OrderSelect;

const orderForAssignmentSelect = {
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

const routePointSelect = {
  id: true,
  route_id: true,
  order_id: true,
  sequence: true,
  planned_eta: true,
  actual_eta: true,
  order: {
    select: orderForRouteSelect,
  },
} satisfies Prisma.RoutePointSelect;

const routeSelect = {
  id: true,
  company_id: true,
  courier_id: true,
  status: true,
  version: true,
  route_date: true,
  created_by_user_id: true,
  optimization_data: true,
  metadata: true,
  created_at: true,
  updated_at: true,
  route_points: {
    orderBy: { sequence: 'asc' },
    select: routePointSelect,
  },
} satisfies Prisma.RouteSelect;

const courierForRouteSelect = {
  id: true,
  company_id: true,
  latitude: true,
  longitude: true,
} satisfies Prisma.CourierSelect;

type RouteRecord = Prisma.RouteGetPayload<{ select: typeof routeSelect }>;
type RouteOrderRecord = Prisma.OrderGetPayload<{
  select: typeof orderForRouteSelect;
}>;
type RouteCourierRecord = Prisma.CourierGetPayload<{
  select: typeof courierForRouteSelect;
}>;
type OrderAssignmentRecord = Prisma.OrderGetPayload<{
  select: typeof orderForAssignmentSelect;
}>;

@Injectable()
export class RoutingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
    @Inject(ROUTING_PROVIDER)
    private readonly routingProvider: RoutingProvider,
  ) {
    this.logger.setContext(RoutingService.name);
  }

  async buildRoute(
    companyId: string,
    actorUserId: string,
    dto: BuildRouteDto,
    actorRole: AuditActorRole = AuditActorRole.system,
  ): Promise<RouteResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const options = buildProviderOptions(dto);
      const resolvedPlan = await this.resolveRoutePlan(
        companyId,
        dto.orderIds,
        dto.courierId ?? null,
        options,
      );
      const routeResult = await this.routingProvider.buildRoute(
        resolvedPlan.providerPoints,
        options,
      );

      const routeBuildResult = await this.prisma.$transaction(async (tx) => {
        const createdRoute = await tx.route.create({
          data: {
            company_id: companyId,
            courier_id: dto.courierId ?? null,
            status: RouteStatus.draft,
            version: 1,
            route_date: dto.routeDate,
            created_by_user_id: actorUserId,
            optimization_data: serializeOptimizationData(routeResult, options),
            metadata:
              dto.metadata === undefined
                ? JSON_NULL
                : ((dto.metadata ?? JSON_NULL) as Prisma.InputJsonValue),
          } satisfies Prisma.RouteUncheckedCreateInput,
          select: { id: true },
        });

        await tx.routePoint.createMany({
          data: buildRoutePointCreateData(
            companyId,
            createdRoute.id,
            resolvedPlan.orders,
            routeResult,
          ),
        });

        const orderStatusChangedEvents =
          await this.syncRouteOrdersWithCourier({
            tx,
            companyId,
            actorUserId,
            actorRole,
            routeId: createdRoute.id,
            courierId: dto.courierId ?? null,
            orders: resolvedPlan.orders,
          });

        const savedRoute = await tx.route.findFirst({
          where: {
            id: createdRoute.id,
            company_id: companyId,
          },
          select: routeSelect,
        });

        if (!savedRoute) {
          throw new NotFoundException('Route not found after creation');
        }

        return {
          route: savedRoute,
          orderStatusChangedEvents,
        };
      });

      this.logger.info(
        {
          routeId: routeBuildResult.route.id,
          companyId,
          createdByUserId: actorUserId,
          courierId: dto.courierId ?? null,
        },
        'Route built',
      );

      const route = mapRoute(routeBuildResult.route);

      await this.emitRouteBuilt({
        routeId: route.id,
        companyId,
        actorUserId,
        requestId: getTenantContextRequestId() ?? null,
        route,
      });
      await this.emitOrderStatusChangedEvents(
        routeBuildResult.orderStatusChangedEvents,
      );

      return route;
    });
  }

  async previewRoute(
    companyId: string,
    dto: BuildRouteDto,
  ): Promise<RoutePreviewResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const options = buildProviderOptions(dto);
      const resolvedPlan = await this.resolveRoutePlan(
        companyId,
        dto.orderIds,
        dto.courierId ?? null,
        options,
      );
      const routeResult = await this.routingProvider.buildRoute(
        resolvedPlan.providerPoints,
        options,
      );

      return mapRoutePreview(routeResult);
    });
  }

  async listRoutes(
    companyId: string,
    query: ListRoutesQueryDto,
  ): Promise<RouteResponseDto[]> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const where: Prisma.RouteWhereInput = {
        deleted_at: null,
      };

      if (query.status) {
        where.status = query.status;
      }

      if (query.courierId) {
        where.courier_id = query.courierId;
      }

      if (query.date) {
        const { start, end } = buildDateRange(query.date);
        where.route_date = {
          gte: start,
          lt: end,
        };
      }

      const routes = await this.prisma.route.findMany({
        where,
        orderBy: [{ route_date: 'desc' }, { created_at: 'desc' }],
        select: routeSelect,
      });

      return routes.map(mapRoute);
    });
  }

  async getRoute(
    companyId: string,
    routeId: string,
  ): Promise<RouteResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const route = await this.prisma.route.findFirst({
        where: {
          id: routeId,
          deleted_at: null,
        },
        select: routeSelect,
      });

      if (!route) {
        throw new NotFoundException('Route not found');
      }

      return mapRoute(route);
    });
  }

  async updateRoute(
    companyId: string,
    actorUserId: string,
    routeId: string,
    dto: UpdateRouteDto,
    actorRole: AuditActorRole = AuditActorRole.system,
  ): Promise<RouteResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const currentRoute = await this.prisma.route.findFirst({
        where: {
          id: routeId,
          deleted_at: null,
        },
        select: routeSelect,
      });

      if (!currentRoute) {
        throw new NotFoundException('Route not found');
      }

      const hasRoutePlanChangesFlag = routeHasPlanChanges(dto, currentRoute);

      if (hasRoutePlanChangesFlag) {
        ensureRouteEditable(currentRoute.status);
      }

      const targetStatus = dto.status ?? currentRoute.status;

      if (
        dto.status !== undefined &&
        dto.status !== currentRoute.status &&
        !canTransitionRoute(currentRoute.status, dto.status)
      ) {
        throw new InvalidRouteStateTransitionException(
          currentRoute.status,
          dto.status,
        );
      }

      if (
        hasRoutePlanChangesFlag &&
        targetStatus !== RouteStatus.draft &&
        targetStatus !== RouteStatus.planned
      ) {
        throw new BadRequestException(
          'Route points can be edited only while route remains draft or planned',
        );
      }

      let updatedRoute: RouteRecord;
      let orderStatusChangedEvents: OrderStatusChangedEvent[] = [];

      if (hasRoutePlanChangesFlag) {
        const currentOptions = extractStoredRouteOptions(
          currentRoute.optimization_data,
          currentRoute.route_date,
        );
        const nextOrderIds =
          dto.orderIds ??
          currentRoute.route_points.map((point) => point.order_id);
        const nextCourierId =
          dto.courierId !== undefined ? dto.courierId : currentRoute.courier_id;
        const nextOptions = buildUpdatedRouteOptions(currentOptions, dto);
        const resolvedPlan = await this.resolveRoutePlan(
          companyId,
          nextOrderIds,
          nextCourierId ?? null,
          nextOptions,
          routeId,
        );
        const routeResult = await this.routingProvider.buildRoute(
          resolvedPlan.providerPoints,
          nextOptions,
        );

        updatedRoute = await this.prisma.$transaction(async (tx) => {
          await tx.route.update({
            where: { id: routeId },
            data: {
              courier_id: nextCourierId ?? null,
              route_date: dto.routeDate ?? currentRoute.route_date,
              status: targetStatus,
              version: currentRoute.version + 1,
              optimization_data: serializeOptimizationData(
                routeResult,
                nextOptions,
              ),
              ...(dto.metadata !== undefined
                ? {
                    metadata: (dto.metadata ??
                      JSON_NULL) as Prisma.InputJsonValue,
                  }
                : {}),
            } satisfies Prisma.RouteUncheckedUpdateInput,
          });

          await tx.routePoint.deleteMany({
            where: { route_id: routeId },
          });

          await tx.routePoint.createMany({
            data: buildRoutePointCreateData(
              companyId,
              routeId,
              resolvedPlan.orders,
              routeResult,
            ),
          });

          orderStatusChangedEvents = await this.syncRouteOrdersWithCourier({
            tx,
            companyId,
            actorUserId,
            actorRole,
            routeId,
            courierId: nextCourierId ?? null,
            orders: resolvedPlan.orders,
          });

          const savedRoute = await tx.route.findFirst({
            where: {
              id: routeId,
              company_id: companyId,
            },
            select: routeSelect,
          });

          if (!savedRoute) {
            throw new NotFoundException('Route not found after update');
          }

          return savedRoute;
        });
      } else {
        const updateData: Prisma.RouteUncheckedUpdateInput = {};

        if (dto.status !== undefined) {
          updateData.status = dto.status;
        }

        if (dto.metadata !== undefined) {
          updateData.metadata = (dto.metadata ??
            JSON_NULL) as Prisma.InputJsonValue;
        }

        updatedRoute = await this.prisma.route.update({
          where: { id: routeId },
          data: updateData,
          select: routeSelect,
        });
      }

      this.logger.info(
        {
          routeId,
          companyId,
          updatedByUserId: actorUserId,
          status: updatedRoute.status,
          version: updatedRoute.version,
        },
        'Route updated',
      );

      const route = mapRoute(updatedRoute);
      const requestId = getTenantContextRequestId() ?? null;

      if (
        currentRoute.status !== RouteStatus.cancelled &&
        updatedRoute.status === RouteStatus.cancelled
      ) {
        await this.emitRouteCancelled({
          routeId,
          companyId,
          actorUserId,
          fromStatus: currentRoute.status,
          toStatus: RouteStatus.cancelled,
          requestId,
          route,
        });
      } else {
        await this.emitRouteUpdated({
          routeId,
          companyId,
          actorUserId,
          fromStatus: currentRoute.status,
          toStatus: updatedRoute.status,
          requestId,
          route,
        });
      }
      await this.emitOrderStatusChangedEvents(orderStatusChangedEvents);

      return route;
    });
  }

  async deleteRoute(
    companyId: string,
    actorUserId: string,
    routeId: string,
  ): Promise<RouteResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const currentRoute = await this.prisma.route.findFirst({
        where: {
          id: routeId,
          deleted_at: null,
        },
        select: routeSelect,
      });

      if (!currentRoute) {
        throw new NotFoundException('Route not found');
      }

      ensureRouteDeletable(currentRoute.status);

      if (!canTransitionRoute(currentRoute.status, RouteStatus.cancelled)) {
        throw new InvalidRouteStateTransitionException(
          currentRoute.status,
          RouteStatus.cancelled,
        );
      }

      const deletedRoute = await this.prisma.route.update({
        where: { id: routeId },
        data: {
          status: RouteStatus.cancelled,
          deleted_at: new Date(),
        },
        select: routeSelect,
      });

      this.logger.info(
        {
          routeId,
          companyId,
          deletedByUserId: actorUserId,
        },
        'Route deleted',
      );

      const route = mapRoute(deletedRoute);

      await this.emitRouteCancelled({
        routeId,
        companyId,
        actorUserId,
        fromStatus: currentRoute.status,
        toStatus: RouteStatus.cancelled,
        requestId: getTenantContextRequestId() ?? null,
        route,
      });

      return route;
    });
  }

  private async resolveRoutePlan(
    companyId: string,
    orderIds: string[],
    courierId: string | null,
    options: ProviderRouteOptions,
    excludeRouteId?: string,
  ): Promise<ResolvedRoutePlan> {
    const uniqueOrderIds = [...new Set(orderIds)];

    if (uniqueOrderIds.length !== orderIds.length) {
      throw new BadRequestException('Route contains duplicate order ids');
    }

    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: uniqueOrderIds },
      },
      select: orderForRouteSelect,
    });

    if (orders.length !== uniqueOrderIds.length) {
      const foundOrderIds = new Set(orders.map((order) => order.id));
      const missingOrderIds = uniqueOrderIds.filter(
        (id) => !foundOrderIds.has(id),
      );
      throw new NotFoundException(
        `Orders not found: ${missingOrderIds.join(', ')}`,
      );
    }

    const orderedOrders = uniqueOrderIds.map((orderId) => {
      const order = orders.find((item) => item.id === orderId);

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      return order;
    });

    orderedOrders.forEach((order) => {
      if (TERMINAL_ORDER_STATUSES.has(order.status)) {
        throw new BadRequestException(
          `Order ${order.id} has terminal status and cannot be routed`,
        );
      }
    });

    await this.ensureOrdersNotAssignedToActiveRoutes(
      uniqueOrderIds,
      excludeRouteId,
    );

    const ordersWithCoordinates =
      await this.resolveOrderCoordinates(orderedOrders);
    const courier = courierId
      ? await this.getCourierOrThrow(companyId, courierId)
      : null;
    const providerPoints = buildProviderPoints(
      ordersWithCoordinates,
      courier,
      options,
      courierId,
    );

    return {
      orders: ordersWithCoordinates,
      providerPoints,
      courier,
    };
  }

  private async resolveOrderCoordinates(
    orders: RouteOrderRecord[],
  ): Promise<RouteOrderRecord[]> {
    const resolvedOrders: RouteOrderRecord[] = [];

    for (const order of orders) {
      if (order.delivery_latitude && order.delivery_longitude) {
        resolvedOrders.push(order);
        continue;
      }

      const coordinates = await this.routingProvider.geocode(
        order.delivery_address,
      );

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          delivery_latitude: new Prisma.Decimal(coordinates.latitude),
          delivery_longitude: new Prisma.Decimal(coordinates.longitude),
        },
      });

      resolvedOrders.push({
        ...order,
        delivery_latitude: new Prisma.Decimal(coordinates.latitude),
        delivery_longitude: new Prisma.Decimal(coordinates.longitude),
      });
    }

    return resolvedOrders;
  }

  private async ensureOrdersNotAssignedToActiveRoutes(
    orderIds: string[],
    excludeRouteId?: string,
  ): Promise<void> {
    const conflictingRoutePoints = await this.prisma.routePoint.findMany({
      where: {
        order_id: { in: orderIds },
        ...(excludeRouteId ? { route_id: { not: excludeRouteId } } : {}),
        route: {
          deleted_at: null,
          status: {
            in: [...ACTIVE_ROUTE_STATUSES],
          },
        },
      },
      select: {
        order_id: true,
        route_id: true,
      },
    });

    if (conflictingRoutePoints.length > 0) {
      const conflict = conflictingRoutePoints[0];
      throw new ConflictException(
        `Order ${conflict.order_id} is already assigned to active route ${conflict.route_id}`,
      );
    }
  }

  private async getCourierOrThrow(
    companyId: string,
    courierId: string,
  ): Promise<RouteCourierRecord> {
    const courier = await this.prisma.courier.findFirst({
      where: {
        id: courierId,
      },
      select: courierForRouteSelect,
    });

    if (!courier || courier.company_id !== companyId) {
      throw new NotFoundException(`Courier ${courierId} not found`);
    }

    return courier;
  }

  private async syncRouteOrdersWithCourier({
    tx,
    companyId,
    actorUserId,
    actorRole,
    routeId,
    courierId,
    orders,
  }: {
    tx: Prisma.TransactionClient;
    companyId: string;
    actorUserId: string;
    actorRole: AuditActorRole;
    routeId: string;
    courierId: string | null;
    orders: RouteOrderRecord[];
  }): Promise<OrderStatusChangedEvent[]> {
    if (!courierId) {
      return [];
    }

    const statusChangedEvents: OrderStatusChangedEvent[] = [];

    for (const order of orders) {
      if (order.company_id !== companyId) {
        throw new NotFoundException(`Order ${order.id} not found`);
      }

      if (TERMINAL_ORDER_STATUSES.has(order.status)) {
        continue;
      }

      const shouldTransitionToAssigned =
        order.status !== OrderStatus.assigned &&
        canTransition(order.status, OrderStatus.assigned);
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          assigned_courier_id: courierId,
          assigned_by_user_id: actorUserId,
          ...(shouldTransitionToAssigned ? { status: OrderStatus.assigned } : {}),
        },
        select: orderForAssignmentSelect,
      });

      if (!shouldTransitionToAssigned) {
        continue;
      }

      const metadata = {
        source: 'route.assignment',
        routeId,
        courierId,
      } satisfies Prisma.InputJsonObject;

      await tx.orderStatusHistory.create({
        data: {
          company_id: companyId,
          order_id: order.id,
          from_status: order.status,
          to_status: OrderStatus.assigned,
          changed_by_user_id: actorUserId,
          reason: 'Assigned to route courier',
          metadata,
        },
      });

      await tx.auditLog.create({
        data: {
          company_id: companyId,
          actor_id: actorUserId,
          actor_role: actorRole,
          action: DOMAIN_EVENTS.ORDER.STATUS_CHANGED,
          entity_type: 'order',
          entity_id: order.id,
          request_id: getTenantContextRequestId() ?? null,
          before: {
            status: order.status,
            assignedCourierId: order.assigned_courier_id,
          },
          after: {
            status: OrderStatus.assigned,
            assignedCourierId: courierId,
            reason: 'Assigned to route courier',
          },
          metadata,
        },
      });

      statusChangedEvents.push({
        orderId: updatedOrder.id,
        companyId,
        actorUserId,
        actorRole,
        fromStatus: order.status,
        toStatus: OrderStatus.assigned,
        reason: 'Assigned to route courier',
        requestId: getTenantContextRequestId() ?? null,
        order: mapOrderForStatusEvent(updatedOrder),
      });
    }

    return statusChangedEvents;
  }

  private async emitRouteBuilt(payload: RouteBuiltEvent): Promise<void> {
    try {
      await this.eventEmitter.emitAsync(DOMAIN_EVENTS.ROUTE.BUILT, payload);
    } catch (error) {
      this.logger.warn(
        {
          routeId: payload.routeId,
          companyId: payload.companyId,
          actorUserId: payload.actorUserId,
          error,
        },
        'Route built event emission failed',
      );
    }
  }

  private async emitRouteUpdated(payload: RouteUpdatedEvent): Promise<void> {
    try {
      await this.eventEmitter.emitAsync(DOMAIN_EVENTS.ROUTE.UPDATED, payload);
    } catch (error) {
      this.logger.warn(
        {
          routeId: payload.routeId,
          companyId: payload.companyId,
          actorUserId: payload.actorUserId,
          fromStatus: payload.fromStatus,
          toStatus: payload.toStatus,
          error,
        },
        'Route updated event emission failed',
      );
    }
  }

  private async emitRouteCancelled(
    payload: RouteCancelledEvent,
  ): Promise<void> {
    try {
      await this.eventEmitter.emitAsync(DOMAIN_EVENTS.ROUTE.CANCELLED, payload);
    } catch (error) {
      this.logger.warn(
        {
          routeId: payload.routeId,
          companyId: payload.companyId,
          actorUserId: payload.actorUserId,
          fromStatus: payload.fromStatus,
          toStatus: payload.toStatus,
          error,
        },
        'Route cancelled event emission failed',
      );
    }
  }

  private async emitOrderStatusChangedEvents(
    events: OrderStatusChangedEvent[],
  ): Promise<void> {
    for (const event of events) {
      try {
        await this.eventEmitter.emitAsync(
          DOMAIN_EVENTS.ORDER.STATUS_CHANGED,
          event,
        );
      } catch (error) {
        this.logger.warn(
          {
            orderId: event.orderId,
            companyId: event.companyId,
            fromStatus: event.fromStatus,
            toStatus: event.toStatus,
            error,
          },
          'Order status-changed event emission failed',
        );
      }
    }
  }
}

interface ResolvedRoutePlan {
  orders: RouteOrderRecord[];
  providerPoints: ProviderRoutePoint[];
  courier: RouteCourierRecord | null;
}

function mapRoute(route: RouteRecord): RouteResponseDto {
  const optimizationData = isPlainObject(route.optimization_data)
    ? (route.optimization_data as Record<string, unknown>)
    : null;
  const provider =
    typeof optimizationData?.['provider'] === 'string'
      ? optimizationData['provider']
      : null;
  const totalDistanceMeters = readNumber(optimizationData?.['distanceMeters']);
  const totalDurationSeconds = readNumber(
    optimizationData?.['durationSeconds'],
  );
  const polyline = readCoordinatesArray(optimizationData?.['polyline']);

  return {
    id: route.id,
    companyId: route.company_id,
    courierId: route.courier_id,
    status: route.status,
    version: route.version,
    routeDate: route.route_date,
    createdByUserId: route.created_by_user_id,
    totalDistanceMeters,
    totalDurationSeconds,
    provider,
    polyline,
    routePoints: route.route_points.map(mapRoutePoint),
    optimizationData,
    metadata: isPlainObject(route.metadata)
      ? (route.metadata as Record<string, unknown>)
      : null,
    createdAt: route.created_at,
    updatedAt: route.updated_at,
  };
}

function mapRoutePreview(
  routeResult: ProviderRouteResult,
): RoutePreviewResponseDto {
  return {
    totalDistanceMeters: routeResult.distanceMeters,
    totalDurationSeconds: routeResult.durationSeconds,
    provider: routeResult.provider,
    polyline: routeResult.polyline.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    })),
  };
}

function mapRoutePoint(
  point: RouteRecord['route_points'][number],
): RoutePointResponseDto {
  return {
    id: point.id,
    routeId: point.route_id,
    orderId: point.order_id,
    sequence: point.sequence,
    plannedEta: point.planned_eta,
    actualEta: point.actual_eta,
    deliveryAddress: point.order.delivery_address,
    deliveryLatitude: decimalToNumber(point.order.delivery_latitude),
    deliveryLongitude: decimalToNumber(point.order.delivery_longitude),
    customerName: point.order.customer_name,
    orderStatus: point.order.status,
    scheduledDate: point.order.scheduled_date,
    zoneId: point.order.zone_id,
  };
}

function mapOrderForStatusEvent(order: OrderAssignmentRecord) {
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

function buildProviderOptions(dto: BuildRouteDto): ProviderRouteOptions {
  return {
    mode: dto.mode ?? 'driving',
    optimizeWaypoints: dto.optimizeWaypoints ?? true,
    avoidTolls: false,
    avoidUnpaved: false,
    departureTime: dto.routeDate,
    returnToStart: dto.returnToStart ?? false,
    locale: dto.locale ?? null,
  };
}

function buildUpdatedRouteOptions(
  currentOptions: ProviderRouteOptions,
  dto: UpdateRouteDto,
): ProviderRouteOptions {
  return {
    mode: dto.mode ?? currentOptions.mode,
    optimizeWaypoints:
      dto.optimizeWaypoints ??
      (dto.orderIds !== undefined ? false : currentOptions.optimizeWaypoints),
    avoidTolls: currentOptions.avoidTolls,
    avoidUnpaved: currentOptions.avoidUnpaved,
    departureTime: dto.routeDate ?? currentOptions.departureTime,
    returnToStart: dto.returnToStart ?? currentOptions.returnToStart,
    locale: dto.locale ?? currentOptions.locale,
  };
}

function buildProviderPoints(
  orders: RouteOrderRecord[],
  courier: RouteCourierRecord | null,
  options: ProviderRouteOptions,
  courierId: string | null,
): ProviderRoutePoint[] {
  const providerPoints: ProviderRoutePoint[] = [];

  if (courier && courier.latitude && courier.longitude) {
    providerPoints.push({
      id: `courier:${courier.id}`,
      orderId: null,
      address: null,
      coordinates: {
        latitude: courier.latitude.toNumber(),
        longitude: courier.longitude.toNumber(),
      },
      type: 'courier',
      metadata: {
        courierId: courier.id,
      },
    });
  }

  providerPoints.push(
    ...orders.map((order) => ({
      id: order.id,
      orderId: order.id,
      address: order.delivery_address,
      coordinates: {
        latitude: decimalToRequiredNumber(
          order.delivery_latitude,
          `Order ${order.id} latitude is required`,
        ),
        longitude: decimalToRequiredNumber(
          order.delivery_longitude,
          `Order ${order.id} longitude is required`,
        ),
      },
      type: 'dropoff' as const,
      metadata: {
        zoneId: order.zone_id,
        orderStatus: order.status,
      },
    })),
  );

  if (providerPoints.length < 2) {
    throw new BadRequestException(
      courierId
        ? 'Route build requires at least two points or courier with known location'
        : 'Route build requires at least two orders when courier is not provided',
    );
  }

  if (options.returnToStart && providerPoints[0]?.type !== 'courier') {
    throw new BadRequestException(
      'returnToStart requires an assigned courier with known location',
    );
  }

  return providerPoints;
}

function buildRoutePointCreateData(
  companyId: string,
  routeId: string,
  orders: RouteOrderRecord[],
  routeResult: ProviderRouteResult,
): Prisma.RoutePointCreateManyInput[] {
  const orderMap = new Map(orders.map((order) => [order.id, order]));
  const etaByPointId = new Map(
    routeResult.stops.map((stop) => [stop.pointId, stop.eta ?? null]),
  );
  const orderedOrderIds = routeResult.orderedPoints
    .filter((point) => point.orderId !== null)
    .map((point) => point.orderId!);

  if (orderedOrderIds.length !== orders.length) {
    throw new BadRequestException(
      'Routing provider returned incomplete order sequence',
    );
  }

  return orderedOrderIds.map((orderId, index) => {
    const order = orderMap.get(orderId);

    if (!order) {
      throw new BadRequestException(
        `Routing provider returned unknown order ${orderId}`,
      );
    }

    return {
      company_id: companyId,
      route_id: routeId,
      order_id: order.id,
      sequence: index + 1,
      planned_eta: etaByPointId.get(orderId) ?? null,
      actual_eta: null,
    };
  });
}

function serializeOptimizationData(
  routeResult: ProviderRouteResult,
  options: ProviderRouteOptions,
): Prisma.InputJsonValue {
  return {
    provider: routeResult.provider,
    distanceMeters: routeResult.distanceMeters,
    durationSeconds: routeResult.durationSeconds,
    polyline: routeResult.polyline.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    })),
    orderedPointIds: routeResult.orderedPoints.map((point) => point.id),
    stops: routeResult.stops.map((stop) => ({
      pointId: stop.pointId,
      sequence: stop.sequence,
      eta: stop.eta?.toISOString() ?? null,
    })),
    legs: routeResult.legs.map((leg) => ({
      fromPointId: leg.fromPointId,
      toPointId: leg.toPointId,
      distanceMeters: leg.distanceMeters,
      durationSeconds: leg.durationSeconds,
      geometry: leg.geometry.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      })),
    })),
    metadata: toInputJsonValue(routeResult.metadata ?? null),
    options: {
      mode: options.mode,
      optimizeWaypoints: options.optimizeWaypoints,
      avoidTolls: options.avoidTolls,
      avoidUnpaved: options.avoidUnpaved,
      departureTime: options.departureTime?.toISOString() ?? null,
      returnToStart: options.returnToStart,
      locale: options.locale,
    },
  } satisfies Prisma.InputJsonObject;
}

function extractStoredRouteOptions(
  optimizationData: Prisma.JsonValue | null,
  routeDate: Date,
): ProviderRouteOptions {
  const options = isPlainObject(optimizationData)
    ? readObject(optimizationData['options'])
    : null;

  return {
    mode: readMode(options?.['mode']) ?? 'driving',
    optimizeWaypoints: readBoolean(options?.['optimizeWaypoints']) ?? false,
    avoidTolls: readBoolean(options?.['avoidTolls']) ?? false,
    avoidUnpaved: readBoolean(options?.['avoidUnpaved']) ?? false,
    departureTime: readDate(options?.['departureTime']) ?? routeDate,
    returnToStart: readBoolean(options?.['returnToStart']) ?? false,
    locale: readString(options?.['locale']) ?? null,
  };
}

function routeHasPlanChanges(
  dto: UpdateRouteDto,
  currentRoute: RouteRecord,
): boolean {
  return (
    dto.orderIds !== undefined ||
    dto.routeDate !== undefined ||
    dto.mode !== undefined ||
    dto.optimizeWaypoints !== undefined ||
    dto.returnToStart !== undefined ||
    dto.locale !== undefined ||
    (dto.courierId !== undefined && dto.courierId !== currentRoute.courier_id)
  );
}

function ensureRouteEditable(status: RouteStatus): void {
  if (!isRouteEditableStatus(status)) {
    throw new BadRequestException(
      `Route with status "${status}" can no longer be manually edited`,
    );
  }
}

function ensureRouteDeletable(status: RouteStatus): void {
  if (!isRouteEditableStatus(status)) {
    throw new BadRequestException(
      `Route with status "${status}" can no longer be deleted`,
    );
  }
}

function isRouteEditableStatus(status: RouteStatus): boolean {
  return status === RouteStatus.draft || status === RouteStatus.planned;
}

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  return value ? value.toNumber() : null;
}

function decimalToRequiredNumber(
  value: Prisma.Decimal | null,
  errorMessage: string,
): number {
  if (!value) {
    throw new BadRequestException(errorMessage);
  }

  return value.toNumber();
}

function buildDateRange(date: string): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function isPlainObject(
  value: Prisma.JsonValue | null,
): value is Prisma.JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
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

function readDate(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readCoordinatesArray(value: unknown): Coordinates[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const point = readObject(entry);
      const latitude = readNumber(point?.['latitude']);
      const longitude = readNumber(point?.['longitude']);

      if (latitude === null || longitude === null) {
        return null;
      }

      return {
        latitude,
        longitude,
      };
    })
    .filter((entry): entry is Coordinates => entry !== null);
}

function readMode(value: unknown): ProviderRouteOptions['mode'] | null {
  return value === 'driving' || value === 'walking' || value === 'cycling'
    ? value
    : null;
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
