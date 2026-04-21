import httpClient from './http-client'
import type { ApiResponse } from './http-client'

// ─── Domain types ─────────────────────────────────────────────────────────────

export type CourierStatus =
  | 'inactive'
  | 'available'
  | 'busy'
  | 'offline'
  | 'suspended'

export type CourierAvailabilityStatus = 'online' | 'offline'

export interface Courier {
  id: string
  companyId: string
  userId: string
  status: CourierStatus
  isOnline: boolean
  email: string
  phone: string | null
  firstName: string
  lastName: string | null
  isActive: boolean
  latitude: number | null
  longitude: number | null
  lastSeenAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateCourierStatusDto {
  status: CourierAvailabilityStatus
}

export interface UpdateCourierLocationDto {
  latitude: number
  longitude: number
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/couriers
 * Returns all couriers for the current company.
 */
export async function getCouriers(): Promise<Courier[]> {
  const response = await httpClient.get<ApiResponse<Courier[]>>('/couriers')
  return response.data.data
}

/**
 * GET /api/v1/couriers/:id
 */
export async function getCourier(id: string): Promise<Courier> {
  const response = await httpClient.get<ApiResponse<Courier>>(
    `/couriers/${id}`,
  )
  return response.data.data
}

/**
 * PATCH /api/v1/couriers/:id/status
 * Toggles courier online/offline state.
 */
export async function updateCourierStatus(
  id: string,
  data: UpdateCourierStatusDto,
): Promise<Courier> {
  const response = await httpClient.patch<ApiResponse<Courier>>(
    `/couriers/${id}/status`,
    data,
  )
  return response.data.data
}

/**
 * PATCH /api/v1/couriers/:id/location
 * Updates GPS coordinates. Emits courier.location-updated event on backend.
 */
export async function updateCourierLocation(
  id: string,
  data: UpdateCourierLocationDto,
): Promise<Courier> {
  const response = await httpClient.patch<ApiResponse<Courier>>(
    `/couriers/${id}/location`,
    data,
  )
  return response.data.data
}
