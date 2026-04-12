import { apiClient } from '@/lib/api/client'
import type { Courier, CreateCourierInput, UpdateCourierInput } from './types'

export const couriersApi = {
  list: (): Promise<Courier[]> =>
    apiClient.get('/couriers'),

  get: (id: string): Promise<Courier> =>
    apiClient.get(`/couriers/${id}`),

  create: (input: CreateCourierInput): Promise<Courier> =>
    apiClient.post('/couriers', input),

  update: (id: string, input: UpdateCourierInput): Promise<Courier> =>
    apiClient.patch(`/couriers/${id}`, input),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/couriers/${id}`),
}
