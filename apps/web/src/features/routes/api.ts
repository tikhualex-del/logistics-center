import { apiClient } from '@/lib/api/client'
import type { Route, CreateRouteInput, AssignCourierInput, AddOrderInput } from './types'

export const routesApi = {
  list: (): Promise<Route[]> =>
    apiClient.get('/routes'),

  get: (id: string): Promise<Route> =>
    apiClient.get(`/routes/${id}`),

  create: (input: CreateRouteInput): Promise<Route> =>
    apiClient.post('/routes', input),

  updateStatus: (id: string, status: string): Promise<Route> =>
    apiClient.patch(`/routes/${id}/status`, { status }),

  assignCourier: (id: string, input: AssignCourierInput): Promise<Route> =>
    apiClient.patch(`/routes/${id}/courier`, input),

  addOrder: (id: string, input: AddOrderInput): Promise<Route> =>
    apiClient.post(`/routes/${id}/orders`, input),

  removeOrder: (id: string, orderId: string): Promise<Route> =>
    apiClient.delete(`/routes/${id}/orders/${orderId}`),
}
