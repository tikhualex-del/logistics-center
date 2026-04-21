import { getTenantPrisma } from '../../lib/prisma-tenant';
import { AppError } from '../../middlewares/error.middleware';
import {
  computeSlaStatus,
  buildSlaDbFilter,
  SLA_STATUSES,
  type SlaStatus,
} from '../../lib/sla';
import {
  ORDER_STATUSES,
  TERMINAL_STATUSES,
  ALLOWED_TRANSITIONS,
  CANCELLABLE_STATUSES,
  type OrderStatus,
  type OrderResponse,
  type CreateOrderInput,
  type UpdateOrderInput,
  type AssignOrderInput,
  type CancelOrderInput,
  type FailOrderInput,
} from './order.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const HISTORY_SELECT = {
  id: true,
  fromStatus: true,
  toStatus: true,
  actorType: true,
  actorId: true,
  reason: true,
  createdAt: true,
} as const;

function toOrderResponse(row: any, history?: any[], now: Date = new Date()): OrderResponse {
  const slaStatus = computeSlaStatus(
    { status: row.status, deadline: row.deadline, deliveredAt: row.deliveredAt, failedAt: row.failedAt },
    now,
  );
  const response: OrderResponse = { ...row, slaStatus };
  if (history !== undefined) response.statusHistory = history;
  return response;
}

type Actor = { actorType: string; actorId: string | null };

async function writeHistory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  opts: {
    orderId: string;
    fromStatus: string | null;
    toStatus: string;
    actor: Actor;
    reason?: string;
  },
): Promise<void> {
  await (tx as any).orderStatusHistory.create({
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

// ─── Service functions ────────────────────────────────────────────────────────

export async function listOrders(
  companyId: string,
  filters: { status?: string; courierId?: string; slaStatus?: string } = {},
): Promise<OrderResponse[]> {
  // Validate slaStatus filter value before querying
  if (filters.slaStatus && !(SLA_STATUSES as readonly string[]).includes(filters.slaStatus)) {
    throw new AppError(400, `Invalid slaStatus '${filters.slaStatus}'. Valid values: ${SLA_STATUSES.join(', ')}`);
  }

  const now = new Date();
  const tenantPrisma = getTenantPrisma(companyId);

  const slaFilter = filters.slaStatus
    ? buildSlaDbFilter(filters.slaStatus as SlaStatus, now)
    : {};

  const rows = await tenantPrisma.order.findMany({
    where: {
      companyId,
      ...(filters.status && { status: filters.status }),
      ...(filters.courierId && { courierId: filters.courierId }),
      ...slaFilter,
    },
    select: ORDER_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  const mapped = rows.map((r) => toOrderResponse(r, undefined, now));

  // met and breached DB filters are approximate (cross-field comparison not
  // possible in Prisma). Apply in-memory refinement to remove false positives.
  if (filters.slaStatus === 'met' || filters.slaStatus === 'breached') {
    return mapped.filter((r) => r.slaStatus === filters.slaStatus);
  }

  return mapped;
}

export async function getOrder(companyId: string, orderId: string): Promise<OrderResponse> {
  const now = new Date();
  const tenantPrisma = getTenantPrisma(companyId);
  const row = await tenantPrisma.order.findUnique({
    where: { id: orderId },
    select: {
      ...ORDER_SELECT,
      statusHistory: { select: HISTORY_SELECT, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!row) throw new AppError(404, 'Order not found');
  const { statusHistory, ...rest } = row;
  return toOrderResponse(rest, statusHistory, now);
}

// ─── Update order (deadline mutation) ─────────────────────────────────────────
// Only deadline is mutable in Step 12.
// Setting deadline to null removes the SLA target (order becomes no_deadline).

export async function updateOrder(
  companyId: string,
  orderId: string,
  input: UpdateOrderInput,
): Promise<OrderResponse> {
  const now = new Date();
  const tenantPrisma = getTenantPrisma(companyId);

  const existing = await tenantPrisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });
  if (!existing) throw new AppError(404, 'Order not found');

  // Only active orders can have their deadline mutated
  const ACTIVE_STATUSES = ['new', 'assigned', 'picked_up'];
  if (!ACTIVE_STATUSES.includes(existing.status)) {
    throw new AppError(400, `Cannot update deadline on an order in '${existing.status}' status`);
  }

  const row = await (tenantPrisma as any).order.update({
    where: { id: orderId },
    data: { deadline: input.deadline ?? null },
    select: ORDER_SELECT,
  });

  return toOrderResponse(row, undefined, now);
}

export async function createOrder(
  companyId: string,
  input: CreateOrderInput,
  actor: Actor,
): Promise<OrderResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  const order = await tenantPrisma.$transaction(async (tx) => {
    const created = await (tx as any).order.create({
      data: {
        companyId,
        source: 'manual',
        status: 'new',
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        pickupAddress: input.pickupAddress,
        deliveryAddress: input.deliveryAddress,
        scheduledPickupAt: input.scheduledPickupAt ?? null,
        deadline: input.deadline ?? null,
        notes: input.notes ?? null,
        pickupLat: input.pickupLat ?? null,
        pickupLng: input.pickupLng ?? null,
        deliveryLat: input.deliveryLat ?? null,
        deliveryLng: input.deliveryLng ?? null,
        createdByUserId: actor.actorId,
      },
      select: ORDER_SELECT,
    });

    await writeHistory(tx, {
      orderId: created.id,
      fromStatus: null,
      toStatus: 'new',
      actor,
    });

    return created;
  });

  return toOrderResponse(order);
}

export async function assignOrder(
  companyId: string,
  orderId: string,
  input: AssignOrderInput,
  actor: Actor,
): Promise<OrderResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  // Verify courier exists and is active.
  const courier = await tenantPrisma.courier.findUnique({
    where: { id: input.courierId },
    select: { id: true, status: true },
  });
  if (!courier) throw new AppError(404, 'Courier not found');
  if (courier.status !== 'active') throw new AppError(400, 'Courier is not active');

  const order = await tenantPrisma.$transaction(async (tx) => {
    const existing = await (tx as any).order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, courierId: true },
    });
    if (!existing) throw new AppError(404, 'Order not found');

    const isReassign = existing.status === 'assigned';

    if (!isReassign && existing.status !== 'new') {
      throw new AppError(400, `Cannot assign order from status '${existing.status}'`);
    }

    // Guard: prevent direct assignment of an order that belongs to a draft route
    if (existing.status === 'new') {
      const routeMembership = await (tx as any).routeOrder.findUnique({
        where: { orderId },
        select: { routeId: true },
      });
      if (routeMembership) {
        throw new AppError(400, 'Order is part of a route — assign the route instead');
      }
    }

    const now = new Date();
    const updated = await (tx as any).order.update({
      where: { id: orderId },
      data: { status: 'assigned', courierId: input.courierId, assignedAt: now },
      select: ORDER_SELECT,
    });

    await writeHistory(tx, {
      orderId,
      fromStatus: existing.status,
      toStatus: 'assigned',
      actor,
      reason: isReassign ? `reassigned from courier ${existing.courierId}` : undefined,
    });

    return updated;
  });

  return toOrderResponse(order);
}

export async function unassignOrder(
  companyId: string,
  orderId: string,
  actor: Actor,
): Promise<OrderResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  const order = await tenantPrisma.$transaction(async (tx) => {
    const existing = await (tx as any).order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError(404, 'Order not found');
    if (existing.status !== 'assigned') {
      throw new AppError(400, `Cannot unassign order from status '${existing.status}'`);
    }

    const updated = await (tx as any).order.update({
      where: { id: orderId },
      data: { status: 'new', courierId: null, assignedAt: null },
      select: ORDER_SELECT,
    });

    await writeHistory(tx, {
      orderId,
      fromStatus: 'assigned',
      toStatus: 'new',
      actor,
    });

    return updated;
  });

  return toOrderResponse(order);
}

export async function advanceOrderStatus(
  companyId: string,
  orderId: string,
  targetStatus: OrderStatus,
  actor: Actor,
  reason?: string,
): Promise<OrderResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  const order = await tenantPrisma.$transaction(async (tx) => {
    const existing = await (tx as any).order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError(404, 'Order not found');

    const currentStatus = existing.status as OrderStatus;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];

    if (!allowed.includes(targetStatus)) {
      throw new AppError(400, `Cannot transition order from '${currentStatus}' to '${targetStatus}'`);
    }

    const now = new Date();
    const timestampField: Partial<Record<OrderStatus, string>> = {
      picked_up: 'pickedUpAt',
      delivered: 'deliveredAt',
      failed: 'failedAt',
    };

    const updated = await (tx as any).order.update({
      where: { id: orderId },
      data: {
        status: targetStatus,
        ...(timestampField[targetStatus] && { [timestampField[targetStatus]!]: now }),
        ...(targetStatus === 'failed' && reason && { failureReason: reason }),
      },
      select: ORDER_SELECT,
    });

    await writeHistory(tx, { orderId, fromStatus: currentStatus, toStatus: targetStatus, actor, reason });

    return updated;
  });

  return toOrderResponse(order);
}

export async function cancelOrder(
  companyId: string,
  orderId: string,
  input: CancelOrderInput,
  actor: Actor,
): Promise<OrderResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  const order = await tenantPrisma.$transaction(async (tx) => {
    const existing = await (tx as any).order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError(404, 'Order not found');

    const currentStatus = existing.status as OrderStatus;
    if (!CANCELLABLE_STATUSES.includes(currentStatus)) {
      throw new AppError(400, `Cannot cancel order from status '${currentStatus}'`);
    }

    const now = new Date();
    const updated = await (tx as any).order.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        cancelledAt: now,
        courierId: null,
        assignedAt: null,
        ...(input.reason && { cancelReason: input.reason }),
      },
      select: ORDER_SELECT,
    });

    await writeHistory(tx, {
      orderId,
      fromStatus: currentStatus,
      toStatus: 'cancelled',
      actor,
      reason: input.reason,
    });

    return updated;
  });

  return toOrderResponse(order);
}

export async function requeueOrder(
  companyId: string,
  orderId: string,
  actor: Actor,
): Promise<OrderResponse> {
  return advanceOrderStatus(companyId, orderId, 'new', actor);
}
