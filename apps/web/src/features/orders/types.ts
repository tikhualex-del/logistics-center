import type { SlaStatus } from '@/constants/sla-statuses'

export type OrderStatus = 'new' | 'assigned' | 'picked_up' | 'delivered' | 'failed' | 'cancelled'

export interface OrderHistoryEntry {
  id: string
  event: string
  createdAt: string
}

// Matches backend OrderResponse exactly
export interface Order {
  id: string
  companyId: string
  source: string
  externalId: string | null
  externalSource: string | null
  status: OrderStatus
  slaStatus: SlaStatus
  courierId: string | null
  customerName: string
  customerPhone: string
  pickupAddress: string
  deliveryAddress: string
  pickupLat: number | null
  pickupLng: number | null
  deliveryLat: number | null
  deliveryLng: number | null
  scheduledPickupAt: string | null
  deadline: string | null
  notes: string | null
  cancelReason: string | null
  failureReason: string | null
  createdByUserId: string | null
  assignedAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  failedAt: string | null
  createdAt: string
  updatedAt: string
  statusHistory?: OrderHistoryEntry[]
}

export interface CreateOrderInput {
  customerName: string
  customerPhone: string
  pickupAddress: string
  deliveryAddress: string
  scheduledPickupAt?: string
  deadline?: string
  notes?: string
  pickupLat?: number
  pickupLng?: number
  deliveryLat?: number
  deliveryLng?: number
}

export interface UpdateOrderDeadlineInput {
  deadline: string | null
}

export interface OrdersFilters {
  status?: OrderStatus
  slaStatus?: SlaStatus
  courierId?: string
}
