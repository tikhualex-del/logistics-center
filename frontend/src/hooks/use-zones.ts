import {
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { QUERY_KEYS } from '@/api/query-keys'
import { QUERY_STALE_TIME } from '@/lib/constants'
import { getZones, getZone, type Zone } from '@/api/zones.api'

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches all geo-zones for the current company.
 * Used by: dispatcher map (zone polygons), order creation form.
 *
 * StaleTime: LONG (5min) — zones rarely change, no need to refetch often.
 */
export function useZones(options?: Partial<UseQueryOptions<Zone[]>>) {
  return useQuery({
    queryKey: QUERY_KEYS.zones.list(),
    queryFn: getZones,
    staleTime: QUERY_STALE_TIME.LONG,
    ...options,
  })
}

/**
 * Fetches a single zone by ID.
 * Used by: zone detail view, zone editing form (admin).
 *
 * Only runs when id is defined.
 */
export function useZone(
  id: string | null,
  options?: Partial<UseQueryOptions<Zone>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.zones.detail(id ?? ''),
    queryFn: () => getZone(id!),
    enabled: id !== null && id.length > 0,
    staleTime: QUERY_STALE_TIME.LONG,
    ...options,
  })
}
