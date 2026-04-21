import type { SlaSummary } from '@/features/sla/types'
import type { Order } from '@/features/orders/types'

export type RouteStatus = 'draft' | 'assigned' | 'completed' | 'cancelled'

export interface RouteCourier {
  id: string
  name: string
}

export interface RouteOrder {
  orderId: string
  position: number
  order: Order
}

export interface Route {
  id: string
  name: string
  status: RouteStatus
  courier?: RouteCourier | null
  orderCount: number
  slaSummary: SlaSummary
  orders?: RouteOrder[]
  createdAt: string
  updatedAt: string
}

export interface CreateRouteInput {
  name: string
}

export interface AssignCourierInput {
  courierId: string
}

export interface AddOrderInput {
  orderId: string
}
