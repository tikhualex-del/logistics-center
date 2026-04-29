import httpClient from './http-client'
import type { ApiResponse } from './http-client'

// ─── Domain types ─────────────────────────────────────────────────────────────

/**
 * Route status per state machine (CLAUDE.md Section 11).
 * draft → planned → in_progress → completed | cancelled
 */
export type RouteStatus =
  | 'draft'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface RouteCoordinate {
  latitude: number
  longitude: number
}

export interface RoutePoint {
  id: string
  routeId: string
  orderId: string
  sequence: number
  plannedEta: string | null
  actualEta: string | null
  deliveryAddress: string
  deliveryLatitude: number | null
  deliveryLongitude: number | null
  customerName: string | null
  orderStatus: string
  scheduledDate: string | null
  zoneId: string | null
}

export interface Route {
  id: string
  companyId: string
  courierId: string | null
  status: RouteStatus
  version: number
  routeDate: string
  createdByUserId: string | null
  totalDistanceMeters: number | null
  totalDurationSeconds: number | null
  provider: string | null
  polyline: RouteCoordinate[]
  routePoints: RoutePoint[]
  optimizationData: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface RouteFilters {
  status?: RouteStatus
  courierId?: string
  date?: string
}

export interface RoutePreview {
  totalDistanceMeters: number | null
  totalDurationSeconds: number | null
  provider: string | null
  polyline: RouteCoordinate[]
}

export interface BuildRoutesDto {
  orderIds: string[]
  courierId?: string | null
  routeDate: string
  mode?: 'driving' | 'walking' | 'cycling'
  optimizeWaypoints?: boolean
  returnToStart?: boolean
  locale?: string | null
  metadata?: Record<string, unknown> | null
}

export interface UpdateRouteDto {
  orderIds?: string[]
  courierId?: string | null
  status?: RouteStatus
  routeDate?: string
  mode?: 'driving' | 'walking' | 'cycling'
  optimizeWaypoints?: boolean
  returnToStart?: boolean
  locale?: string | null
  metadata?: Record<string, unknown> | null
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/routes
 * Returns routes for the current company.
 */
export async function getRoutes(
  filters?: RouteFilters,
): Promise<Route[]> {
  const response = await httpClient.get<ApiResponse<Route[]>>(
    '/routes',
    { params: filters },
  )
  return response.data.data
}

/**
 * GET /api/v1/routes/:id
 */
export async function getRoute(id: string): Promise<Route> {
  const response = await httpClient.get<ApiResponse<Route>>(`/routes/${id}`)
  return response.data.data
}

/**
 * POST /api/v1/routes/build
 * Triggers route auto-building via YandexRoutingProvider (or dev mock).
 */
export async function buildRoutes(data: BuildRoutesDto): Promise<Route> {
  const response = await httpClient.post<ApiResponse<Route>>(
    '/routes/build',
    data,
  )
  return response.data.data
}

/**
 * POST /api/v1/routes/preview
 * Returns preview road geometry without creating a route.
 */
export async function previewRoute(data: BuildRoutesDto): Promise<RoutePreview> {
  const response = await httpClient.post<ApiResponse<RoutePreview>>(
    '/routes/preview',
    data,
  )
  return response.data.data
}

/**
 * PATCH /api/v1/routes/:id
 * Allows manual route editing (courier assignment, point reorder, status change).
 */
export async function updateRoute(
  id: string,
  data: UpdateRouteDto,
): Promise<Route> {
  const response = await httpClient.patch<ApiResponse<Route>>(
    `/routes/${id}`,
    data,
  )
  return response.data.data
}

/**
 * DELETE /api/v1/routes/:id
 * Soft-deletes an editable route and releases it from dispatcher lists.
 */
export async function deleteRoute(id: string): Promise<Route> {
  const response = await httpClient.delete<ApiResponse<Route>>(`/routes/${id}`)
  return response.data.data
}
