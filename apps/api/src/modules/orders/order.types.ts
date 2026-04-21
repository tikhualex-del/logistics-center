import type { SlaStatus } from '../../lib/sla';

// ─── Status vocabulary ────────────────────────────────────────────────────────
// Canonical Order status vocabulary — Wave 2 source of truth.
// Supersedes all prior vocabulary.
export const ORDER_STATUSES = ['new', 'assigned', 'picked_up', 'delivered', 'cancelled', 'failed'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'cancelled'];

// ─── Allowed transitions ──────────────────────────────────────────────────────
// Key: fromStatus. Values: allowed toStatuses via status-advance operations only.
// Assignment operations (new→assigned, assigned→new, assigned→assigned) are
// handled separately in the assignment service functions.
export const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  assigned:   ['picked_up'],
  picked_up:  ['delivered', 'failed'],
  failed:     ['new'],
};

// Cancel is allowed from: new, assigned
export const CANCELLABLE_STATUSES: OrderStatus[] = ['new', 'assigned'];

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface OrderStatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  actorType: string;
  actorId: string | null;
  reason: string | null;
  createdAt: Date;
}

export interface OrderResponse {
  id: string;
  companyId: string;
  source: string;
  externalId: string | null;
  externalSource: string | null;
  status: string;
  slaStatus: SlaStatus;
  courierId: string | null;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  scheduledPickupAt: Date | null;
  deadline: Date | null;
  notes: string | null;
  cancelReason: string | null;
  failureReason: string | null;
  createdByUserId: string | null;
  assignedAt: Date | null;
  pickedUpAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  statusHistory?: OrderStatusHistoryEntry[];
}

// ─── Input shapes ─────────────────────────────────────────────────────────────

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledPickupAt?: Date;
  deadline?: Date;
  notes?: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
}

export interface UpdateOrderInput {
  deadline?: Date | null;
}

export interface AssignOrderInput {
  courierId: string;
}

export interface CancelOrderInput {
  reason?: string;
}

export interface FailOrderInput {
  reason: string; // required for fail
}
