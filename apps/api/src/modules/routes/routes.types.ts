import type { OrderResponse } from '../orders/order.types';
import type { SlaSummary } from '../../lib/sla';

export type { SlaSummary };

// ─── Route status vocabulary ──────────────────────────────────────────────────

export const ROUTE_STATUSES = ['draft', 'assigned', 'completed', 'cancelled'] as const;
export type RouteStatus = typeof ROUTE_STATUSES[number];

// Terminal states for the complete guard
export const ROUTE_ORDER_TERMINAL_STATUSES = ['delivered', 'cancelled', 'failed'] as const;

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface RouteOrderEntry {
  id: string;
  routeId: string;
  orderId: string;
  sequence: number;
  createdAt: Date;
}

// Used in list — orders not hydrated
export interface RouteResponse {
  id: string;
  companyId: string;
  courierId: string | null;
  status: string;
  scheduledDate: string | null;
  notes: string | null;
  createdByUserId: string | null;
  orderCount: number;
  slaSummary: SlaSummary;
  createdAt: Date;
  updatedAt: Date;
}

// Used in GET /:id — orders fully hydrated and sequenced
export interface RouteDetailResponse extends Omit<RouteResponse, 'orderCount'> {
  orders: Array<RouteOrderEntry & { order: OrderResponse }>;
}

// ─── Input shapes ─────────────────────────────────────────────────────────────

export interface CreateRouteInput {
  scheduledDate?: string;
  notes?: string;
}

export interface UpdateRouteInput {
  scheduledDate?: string | null;
  notes?: string | null;
}

export interface AddOrderToRouteInput {
  orderId: string;
  sequence?: number;
}

export interface ReorderRouteOrderInput {
  sequence: number;
}

export interface AssignRouteInput {
  courierId: string;
}
