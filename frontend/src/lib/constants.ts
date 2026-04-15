/**
 * Application-wide constants.
 * All environment variables are accessed exclusively from here.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:3000'
export const WS_URL = import.meta.env.VITE_WS_URL as string || 'http://localhost:3000'
export const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string || ''

/** API version prefix for all REST calls */
export const API_VERSION = '/api/v1'

/** TanStack Query stale times */
export const QUERY_STALE_TIME = {
  /** Short-lived data: courier locations, live order status */
  REALTIME: 0,
  /** Medium-lived data: order list, courier list */
  DEFAULT: 30_000,
  /** Long-lived data: company settings, zones */
  LONG: 5 * 60_000,
} as const

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
} as const

/** Application routes */
export const ROUTES = {
  LOGIN: '/login',
  DISPATCHER: '/dispatcher',
  NOT_FOUND: '*',
} as const
