import httpClient from './http-client'
import type { ApiResponse } from './http-client'

// ─── Domain types ─────────────────────────────────────────────────────────────

/**
 * GeoJSON polygon geometry for zone boundaries.
 * Coordinates: array of [lng, lat] pairs (GeoJSON standard).
 */
export interface GeoJsonPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface Zone {
  id: string
  companyId: string
  name: string
  color: string | null
  baseRate: string | null
  polygon: GeoJsonPolygon
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/zones
 * Returns all zones for the current company (no pagination — typically small set).
 */
export async function getZones(): Promise<Zone[]> {
  const response = await httpClient.get<ApiResponse<Zone[]>>('/zones')
  return response.data.data
}

/**
 * GET /api/v1/zones/:id
 */
export async function getZone(id: string): Promise<Zone> {
  const response = await httpClient.get<ApiResponse<Zone>>(`/zones/${id}`)
  return response.data.data
}
