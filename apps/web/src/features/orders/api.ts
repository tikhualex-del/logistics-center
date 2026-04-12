import { apiClient } from '@/lib/api/client'
import type { Order, CreateOrderInput, UpdateOrderDeadlineInput, OrdersFilters, OrderHistoryEntry } from './types'

export const ordersApi = {
  list: (filters?: OrdersFilters): Promise<Order[]> => {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.slaStatus) params.set('slaStatus', filters.slaStatus)
    if (filters?.courierId) params.set('courierId', filters.courierId)
    const qs = params.toString()
    return apiClient.get(`/orders${qs ? `?${qs}` : ''}`)
  },

  get: (id: string): Promise<Order> =>
    apiClient.get(`/orders/${id}`),

  create: (input: CreateOrderInput): Promise<Order> =>
    apiClient.post('/orders', input),

  updateStatus: (id: string, status: string): Promise<Order> =>
    apiClient.patch(`/orders/${id}/status`, { status }),

  updateDeadline: (id: string, input: UpdateOrderDeadlineInput): Promise<Order> =>
    apiClient.patch(`/orders/${id}`, input),

  getHistory: (id: string): Promise<OrderHistoryEntry[]> =>
    apiClient.get(`/orders/${id}/history`),
}
