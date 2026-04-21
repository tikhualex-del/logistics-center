import type { MapViewport, MapOrderFilters } from './types'

export const DEFAULT_VIEWPORT: MapViewport = {
  lat: 55.751244,
  lng: 37.618423,
  zoom: 11,
}

export const EMPTY_MAP_FILTERS: MapOrderFilters = {
  status: '',
  slaStatus: '',
  search: '',
  date: '',
  timeFrom: '00:00',
  timeTo: '23:00',
}