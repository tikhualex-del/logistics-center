/**
 * Shared API types used across all domain API modules.
 *
 * These types are aligned with the backend's standard response shapes.
 * Per CLAUDE.md Section 16: pagination via ?page=1&limit=20.
 */

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Query params for paginated list endpoints */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Standard paginated list response wrapper.
 * Backend returns items + total for all list endpoints.
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}
