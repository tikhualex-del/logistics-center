// Placeholder — map data is sourced from orders/couriers/routes APIs.
// This module will hold any map-specific endpoints (e.g., geocoding, route geometry).

import { apiClient } from '@/lib/api/client'
import type { MapMarker } from './types'

export const mapApi = {
  getMarkers: (): Promise<MapMarker[]> =>
    apiClient.get('/map/markers'),
}
