import httpClient from './http-client'
import type { ApiResponse } from './http-client'

// ─── Domain types ─────────────────────────────────────────────────────────────

/**
 * Order status values per state machine (CLAUDE.md Section 11).
 * new → confirmed → assigned → handed_over → in_transit
 *     → delivered | undelivered | returned | cancelled
 */
export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'assigned'
  | 'handed_over'
  | 'in_transit'
  | 'delivered'
  | 'undelivered'
  | 'returned'
  | 'cancelled'

export interface Order {
  id: string
  companyId: string
  status: OrderStatus
  externalId: string | null
  orderNumber: string | null
  customerName: string | null
  customerPhone: string | null
  deliveryAddress: string
  deliveryLatitude: number | null
  deliveryLongitude: number | null
  comment: string | null
  scheduledDate: string | null
  timeWindowFrom: string | null
  timeWindowTo: string | null
  zoneId: string | null
  assignedCourierId: string | null
  createdByUserId: string | null
  assignedByUserId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface OrderFilters {
  status?: OrderStatus
  zoneId?: string
  date?: string
}

export interface CreateOrderDto {
  deliveryAddress: string
  externalId?: string
  orderNumber?: string
  customerName?: string
  customerPhone?: string
  deliveryLatitude?: number | null
  deliveryLongitude?: number | null
  comment?: string
  scheduledDate?: string | null
  timeWindowFrom?: string | null
  timeWindowTo?: string | null
  zoneId?: string
  assignedCourierId?: string
  metadata?: Record<string, unknown>
}

export interface UpdateOrderDto {
  externalId?: string | null
  orderNumber?: string | null
  customerName?: string | null
  customerPhone?: string | null
  deliveryAddress?: string
  deliveryLatitude?: number | null
  deliveryLongitude?: number | null
  comment?: string | null
  scheduledDate?: string | null
  timeWindowFrom?: string | null
  timeWindowTo?: string | null
  zoneId?: string | null
  assignedCourierId?: string | null
  metadata?: Record<string, unknown> | null
}

export interface UpdateOrderStatusDto {
  status: OrderStatus
  reason?: string
  metadata?: Record<string, unknown>
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/orders
 * Returns paginated list of orders for the current company (companyId from JWT).
 */
export async function getOrders(
  filters?: OrderFilters,
): Promise<Order[]> {
  const response = await httpClient.get<ApiResponse<Order[]>>(
    '/orders',
    { params: filters },
  )
  return response.data.data
}

/**
 * GET /api/v1/orders/:id
 */
export async function getOrder(id: string): Promise<Order> {
  const response = await httpClient.get<ApiResponse<Order>>(`/orders/${id}`)
  return response.data.data
}

/**
 * POST /api/v1/orders
 */
export async function createOrder(data: CreateOrderDto): Promise<Order> {
  const response = await httpClient.post<ApiResponse<Order>>('/orders', data)
  return response.data.data
}

/**
 * PATCH /api/v1/orders/:id
 */
export async function updateOrder(
  id: string,
  data: UpdateOrderDto,
): Promise<Order> {
  const response = await httpClient.patch<ApiResponse<Order>>(
    `/orders/${id}`,
    data,
  )
  return response.data.data
}

/**
 * PATCH /api/v1/orders/:id/status
 * Triggers state machine transition on backend (validated server-side).
 */
export async function updateOrderStatus(
  id: string,
  data: UpdateOrderStatusDto,
): Promise<Order> {
  const response = await httpClient.patch<ApiResponse<Order>>(
    `/orders/${id}/status`,
    data,
  )
  return response.data.data
}
