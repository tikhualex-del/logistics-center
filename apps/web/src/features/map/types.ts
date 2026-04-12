export interface MapViewport {
  lat: number
  lng: number
  zoom: number
}

export interface MapMarker {
  id: string
  lat: number
  lng: number
  type: 'order' | 'courier' | 'depot'
  label?: string
}

export type MapTimeValue = string

// All filter state — single source of truth in MapShell
export interface MapOrderFilters {
  status: string      // '' = all; passed to backend
  slaStatus: string   // '' = all; passed to backend
  search: string      // client-side, debounced
  date: string        // 'YYYY-MM-DD' or '' = no date filter; client-side

  // New flexible time range for logistics filtering
  timeFrom: MapTimeValue
  timeTo: MapTimeValue


}
