import { getTenantPrisma } from '../../lib/prisma-tenant';
import { AppError } from '../../middlewares/error.middleware';
import { computeSlaStatus, computeSlaSummary, type SlaSummary } from '../../lib/sla';
import { ROUTE_ORDER_TERMINAL_STATUSES } from './routes.types';
import type {
  RouteResponse,
  RouteDetailResponse,
  CreateRouteInput,
  UpdateRouteInput,
  AddOrderToRouteInput,
  ReorderRouteOrderInput,
  AssignRouteInput,
} from './routes.types';

// ─── Selectors ────────────────────────────────────────────────────────────────

const ROUTE_SELECT = {
  id: true,
  companyId: true,
  courierId: true,
  status: true,
  scheduledDate: true,
  notes: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const ORDER_SELECT = {
  id: true,
  companyId: true,
  source: true,
  externalId: true,
  externalSource: true,
  status: true,
  courierId: true,
  customerName: true,
  customerPhone: true,
  pickupAddress: true,
  deliveryAddress: true,
  pickupLat: true,
  pickupLng: true,
  deliveryLat: true,
  deliveryLng: true,
  scheduledPickupAt: true,
  deadline: true,
  notes: true,
  cancelReason: true,
  failureReason: true,
  createdByUserId: true,
  assignedAt: true,
  pickedUpAt: true,
  deliveredAt: true,
  cancelledAt: true,
  failedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Minimal order fields needed for SLA computation in list view
const ORDER_SLA_SELECT = {
  status: true,
  deadline: true,
  deliveredAt: true,
  failedAt: true,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Actor = { actorType: string; actorId: string | null };

async function writeOrderHistory(
  tx: any,
  opts: { orderId: string; fromStatus: string; toStatus: string; actor: Actor; reason?: string },
): Promise<void> {
  await tx.orderStatusHistory.create({
    data: {
      orderId: opts.orderId,
      fromStatus: opts.fromStatus,
      toStatus: opts.toStatus,
      actorType: opts.actor.actorType,
      actorId: opts.actor.actorId,
      reason: opts.reason ?? null,
    },
  });
}

function toRouteResponse(row: any, orderCount: number, slaSummary: SlaSummary): RouteResponse {
  return {
    id: row.id,
    companyId: row.companyId,
    courierId: row.courierId,
    status: row.status,
    scheduledDate: row.scheduledDate,
    notes: row.notes,
    createdByUserId: row.createdByUserId,
    orderCount,
    slaSummary,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listRoutes(
  companyId: string,
  filters: { status?: string; courierId?: string; scheduledDate?: string } = {},
): Promise<RouteResponse[]> {
  const now = new Date();
  const tenantPrisma = getTenantPrisma(companyId);
  const rows = await (tenantPrisma as any).route.findMany({
    where: {
      companyId,
      ...(filters.status && { status: filters.status }),
      ...(filters.courierId && { courierId: filters.courierId }),
      ...(filters.scheduledDate && { scheduledDate: filters.scheduledDate }),
    },
    select: {
      ...ROUTE_SELECT,
      _count: { select: { routeOrders: true } },
      // Slim order join for slaSummary computation — only SLA-relevant fields
      routeOrders: {
        select: { order: { select: ORDER_SLA_SELECT } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r: any) => {
    const orderData = r.routeOrders.map((ro: any) => ro.order);
    const slaSummary = computeSlaSummary(orderData, now);
    return toRouteResponse(r, r._count.routeOrders, slaSummary);
  });
}

// ─── Get single ──────────────────────────────────────────────────────────────

export async function getRoute(companyId: string, routeId: string): Promise<RouteDetailResponse> {
  const now = new Date();
  const tenantPrisma = getTenantPrisma(companyId);
  const row = await (tenantPrisma as any).route.findUnique({
    where: { id: routeId },
    select: {
      ...ROUTE_SELECT,
      routeOrders: {
        select: {
          id: true,
          routeId: true,
          orderId: true,
          sequence: true,
          createdAt: true,
          order: { select: ORDER_SELECT },
        },
        orderBy: { sequence: 'asc' },
      },
    },
  });
  if (!row || row.companyId !== companyId) throw new AppError(404, 'Route not found');

  const { routeOrders, ...rest } = row;

  // Compute slaSummary from raw order data (before enrichment)
  const rawOrders = routeOrders.map((ro: any) => ro.order);
  const slaSummary = computeSlaSummary(rawOrders, now);

  // Enrich each order with slaStatus
  const enrichedOrders = routeOrders.map((ro: any) => ({
    ...ro,
    order: {
      ...ro.order,
      slaStatus: computeSlaStatus(ro.order, now),
    },
  }));

  return {
    ...rest,
    slaSummary,
    orders: enrichedOrders,
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createRoute(
  companyId: string,
  input: CreateRouteInput,
  actor: Actor,
): Promise<RouteResponse> {
  const tenantPrisma = getTenantPrisma(companyId);
  const row = await (tenantPrisma as any).route.create({
    data: {
      companyId,
      status: 'draft',
      scheduledDate: input.scheduledDate ?? null,
      notes: input.notes ?? null,
      createdByUserId: actor.actorId,
    },
    select: ROUTE_SELECT,
  });
  return toRouteResponse(row, 0, computeSlaSummary([], new Date()));
}

// ─── Update (draft only) ──────────────────────────────────────────────────────

export async function updateRoute(
  companyId: string,
  routeId: string,
  input: UpdateRouteInput,
): Promise<RouteResponse> {
  const tenantPrisma = getTenantPrisma(companyId);
  const existing = await (tenantPrisma as any).route.findUnique({
    where: { id: routeId },
    select: { id: true, companyId: true, status: true, _count: { select: { routeOrders: true } } },
  });
  if (!existing || existing.companyId !== companyId) throw new AppError(404, 'Route not found');
  if (existing.status !== 'draft') throw new AppError(400, `Cannot update route in '${existing.status}' status`);

  const row = await (tenantPrisma as any).route.update({
    where: { id: routeId },
    data: {
      ...(input.scheduledDate !== undefined && { scheduledDate: input.scheduledDate }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
    select: ROUTE_SELECT,
  });
  // Re-fetch slaSummary for the updated route
  const now = new Date();
  const memberOrders = await (tenantPrisma as any).routeOrder.findMany({
    where: { routeId },
    select: { order: { select: ORDER_SLA_SELECT } },
  });
  const slaSummary = computeSlaSummary(memberOrders.map((ro: any) => ro.order), now);
  return toRouteResponse(row, existing._count.routeOrders, slaSummary);
}

// ─── Add order to route ───────────────────────────────────────────────────────

export async function addOrderToRoute(
  companyId: string,
  routeId: string,
  input: AddOrderToRouteInput,
): Promise<RouteDetailResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  await (tenantPrisma as any).$transaction(async (tx: any) => {
    // Verify route exists, belongs to company, is draft
    const route = await tx.route.findUnique({
      where: { id: routeId },
      select: { id: true, companyId: true, status: true },
    });
    if (!route || route.companyId !== companyId) throw new AppError(404, 'Route not found');
    if (route.status !== 'draft') throw new AppError(400, 'Cannot add orders to a route that is not in draft');

    // Verify order: exists, belongs to company, new, unassigned
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      select: { id: true, companyId: true, status: true, courierId: true },
    });
    if (!order || order.companyId !== companyId) throw new AppError(404, 'Order not found');
    if (order.status !== 'new' || order.courierId !== null) {
      throw new AppError(400, "Order must be unassigned and in 'new' status to be added to a route");
    }

    // Check not already in another route
    const existingMembership = await tx.routeOrder.findUnique({
      where: { orderId: input.orderId },
      select: { routeId: true },
    });
    if (existingMembership) {
      if (existingMembership.routeId === routeId) throw new AppError(400, 'Order is already in this route');
      throw new AppError(409, 'Order is already part of a route');
    }

    // Determine sequence position
    const count = await tx.routeOrder.count({ where: { routeId } });
    const maxSequence = count + 1; // appended position if no sequence given

    let targetSequence: number;
    if (input.sequence === undefined) {
      targetSequence = maxSequence;
    } else {
      if (input.sequence < 1 || input.sequence > maxSequence) {
        throw new AppError(400, `sequence must be between 1 and ${maxSequence}`);
      }
      targetSequence = input.sequence;
    }

    // Shift existing rows to make room
    if (targetSequence < maxSequence) {
      await tx.routeOrder.updateMany({
        where: { routeId, sequence: { gte: targetSequence } },
        data: { sequence: { increment: 1 } },
      });
    }

    await tx.routeOrder.create({
      data: { routeId, orderId: input.orderId, sequence: targetSequence },
    });
  });

  return getRoute(companyId, routeId);
}

// ─── Remove order from route ──────────────────────────────────────────────────

export async function removeOrderFromRoute(
  companyId: string,
  routeId: string,
  orderId: string,
): Promise<RouteDetailResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  await (tenantPrisma as any).$transaction(async (tx: any) => {
    const route = await tx.route.findUnique({
      where: { id: routeId },
      select: { id: true, companyId: true, status: true },
    });
    if (!route || route.companyId !== companyId) throw new AppError(404, 'Route not found');
    if (route.status !== 'draft') throw new AppError(400, 'Cannot remove orders from a route that is not in draft');

    const membership = await tx.routeOrder.findUnique({
      where: { orderId },
      select: { id: true, routeId: true, sequence: true },
    });
    if (!membership || membership.routeId !== routeId) throw new AppError(404, 'Order not found in this route');

    const removedSeq = membership.sequence;
    await tx.routeOrder.delete({ where: { id: membership.id } });

    // Close the gap
    await tx.routeOrder.updateMany({
      where: { routeId, sequence: { gt: removedSeq } },
      data: { sequence: { decrement: 1 } },
    });
  });

  return getRoute(companyId, routeId);
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export async function reorderRouteOrder(
  companyId: string,
  routeId: string,
  orderId: string,
  input: ReorderRouteOrderInput,
): Promise<RouteDetailResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  await (tenantPrisma as any).$transaction(async (tx: any) => {
    const route = await tx.route.findUnique({
      where: { id: routeId },
      select: { id: true, companyId: true, status: true },
    });
    if (!route || route.companyId !== companyId) throw new AppError(404, 'Route not found');
    if (route.status !== 'draft') throw new AppError(400, 'Cannot reorder a route that is not in draft');

    const membership = await tx.routeOrder.findUnique({
      where: { orderId },
      select: { id: true, routeId: true, sequence: true },
    });
    if (!membership || membership.routeId !== routeId) throw new AppError(404, 'Order not found in this route');

    const count = await tx.routeOrder.count({ where: { routeId } });
    const newSeq = input.sequence;
    if (newSeq < 1 || newSeq > count) throw new AppError(400, `sequence must be between 1 and ${count}`);

    const oldSeq = membership.sequence;
    if (oldSeq === newSeq) return; // no-op

    // Two-pass shift to avoid unique constraint collisions during intermediate state.
    // Pass 1: move target to a safe out-of-range value (count + 1000)
    await tx.routeOrder.update({
      where: { id: membership.id },
      data: { sequence: count + 1000 },
    });

    // Pass 2: shift the affected range to close/open the gap
    if (newSeq < oldSeq) {
      // Moving up: rows between [newSeq, oldSeq-1] shift down by 1
      await tx.routeOrder.updateMany({
        where: { routeId, sequence: { gte: newSeq, lte: oldSeq - 1 } },
        data: { sequence: { increment: 1 } },
      });
    } else {
      // Moving down: rows between [oldSeq+1, newSeq] shift up by 1
      await tx.routeOrder.updateMany({
        where: { routeId, sequence: { gte: oldSeq + 1, lte: newSeq } },
        data: { sequence: { decrement: 1 } },
      });
    }

    // Settle target at new position
    await tx.routeOrder.update({
      where: { id: membership.id },
      data: { sequence: newSeq },
    });
  });

  return getRoute(companyId, routeId);
}

// ─── Assign courier ───────────────────────────────────────────────────────────

export async function assignRoute(
  companyId: string,
  routeId: string,
  input: AssignRouteInput,
  actor: Actor,
): Promise<RouteDetailResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  // Courier check outside transaction — read-only, no race risk
  const courier = await (tenantPrisma as any).courier.findUnique({
    where: { id: input.courierId },
    select: { id: true, status: true },
  });
  if (!courier) throw new AppError(404, 'Courier not found');
  if (courier.status !== 'active') throw new AppError(400, 'Courier is not active');

  await (tenantPrisma as any).$transaction(async (tx: any) => {
    const route = await tx.route.findUnique({
      where: { id: routeId },
      select: { id: true, companyId: true, status: true },
    });
    if (!route || route.companyId !== companyId) throw new AppError(404, 'Route not found');
    if (route.status !== 'draft') throw new AppError(400, `Cannot assign a route in '${route.status}' status`);

    const memberships = await tx.routeOrder.findMany({
      where: { routeId },
      select: { orderId: true, sequence: true },
      orderBy: { sequence: 'asc' },
    });
    if (memberships.length === 0) throw new AppError(400, 'Cannot assign a route with no orders');

    // Pre-flight: all orders must be new + unassigned (all-or-nothing)
    const orderIds = memberships.map((m: any) => m.orderId);
    const orders = await tx.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, status: true, courierId: true },
    });

    for (const o of orders) {
      if (o.status !== 'new' || o.courierId !== null) {
        throw new AppError(400, `Order ${o.id} is not assignable (status: ${o.status})`);
      }
    }

    const now = new Date();

    // Atomically assign every order
    for (const o of orders) {
      await tx.order.update({
        where: { id: o.id },
        data: { status: 'assigned', courierId: input.courierId, assignedAt: now },
      });
      await writeOrderHistory(tx, {
        orderId: o.id,
        fromStatus: 'new',
        toStatus: 'assigned',
        actor,
        reason: `assigned via route ${routeId}`,
      });
    }

    await tx.route.update({
      where: { id: routeId },
      data: { status: 'assigned', courierId: input.courierId },
    });
  });

  return getRoute(companyId, routeId);
}

// ─── Complete ─────────────────────────────────────────────────────────────────

export async function completeRoute(
  companyId: string,
  routeId: string,
): Promise<RouteDetailResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  await (tenantPrisma as any).$transaction(async (tx: any) => {
    const route = await tx.route.findUnique({
      where: { id: routeId },
      select: { id: true, companyId: true, status: true },
    });
    if (!route || route.companyId !== companyId) throw new AppError(404, 'Route not found');
    if (route.status !== 'assigned') throw new AppError(400, `Cannot complete a route in '${route.status}' status`);

    const memberships = await tx.routeOrder.findMany({
      where: { routeId },
      select: { orderId: true },
    });

    if (memberships.length > 0) {
      const orderIds = memberships.map((m: any) => m.orderId);
      const orders = await tx.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, status: true },
      });

      const terminalSet = new Set(ROUTE_ORDER_TERMINAL_STATUSES as readonly string[]);
      for (const o of orders) {
        if (!terminalSet.has(o.status)) {
          throw new AppError(400, `Route cannot be completed: order ${o.id} is still in progress (status: ${o.status})`);
        }
      }
    }

    // All orders are terminal — close membership and complete route
    await tx.routeOrder.deleteMany({ where: { routeId } });
    await tx.route.update({ where: { id: routeId }, data: { status: 'completed' } });
  });

  return getRoute(companyId, routeId);
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export async function cancelRoute(
  companyId: string,
  routeId: string,
  actor: Actor,
): Promise<RouteDetailResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  await (tenantPrisma as any).$transaction(async (tx: any) => {
    const route = await tx.route.findUnique({
      where: { id: routeId },
      select: { id: true, companyId: true, status: true },
    });
    if (!route || route.companyId !== companyId) throw new AppError(404, 'Route not found');
    if (route.status === 'completed' || route.status === 'cancelled') {
      throw new AppError(400, `Cannot cancel a route in '${route.status}' status`);
    }

    const memberships = await tx.routeOrder.findMany({
      where: { routeId },
      select: { orderId: true },
    });

    if (memberships.length > 0 && route.status === 'assigned') {
      const orderIds = memberships.map((m: any) => m.orderId);
      const orders = await tx.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, status: true },
      });

      // Revert only orders still in 'assigned' — others have progressed past reversibility
      for (const o of orders) {
        if (o.status === 'assigned') {
          await tx.order.update({
            where: { id: o.id },
            data: { status: 'new', courierId: null, assignedAt: null },
          });
          await writeOrderHistory(tx, {
            orderId: o.id,
            fromStatus: 'assigned',
            toStatus: 'new',
            actor,
            reason: `unassigned via route cancellation ${routeId}`,
          });
        }
      }
    }

    // Delete all RouteOrder rows — membership ends on cancel
    await tx.routeOrder.deleteMany({ where: { routeId } });
    await tx.route.update({ where: { id: routeId }, data: { status: 'cancelled' } });
  });

  return getRoute(companyId, routeId);
}
