import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { QUERY_KEYS } from '@/api/query-keys'
import { QUERY_STALE_TIME } from '@/lib/constants'
import {
  getCouriers,
  getCourier,
  updateCourierStatus,
  updateCourierLocation,
  type Courier,
  type UpdateCourierStatusDto,
  type UpdateCourierLocationDto,
} from '@/api/couriers.api'

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches paginated courier list with optional filters.
 * Used by: dispatcher courier layer, couriers page.
 *
 * StaleTime: DEFAULT (30s) — status (online/offline) changes occasionally.
 * Live location updates arrive via WebSocket (courier:location_updated).
 */
export function useCouriers(
  options?: Partial<UseQueryOptions<Courier[]>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.couriers.list(),
    queryFn: getCouriers,
    staleTime: QUERY_STALE_TIME.DEFAULT,
    ...options,
  })
}

/**
 * Fetches a single courier by ID.
 * Used by: courier detail card.
 *
 * StaleTime: REALTIME (0) — detail view shows live location, always fresh.
 * Only runs when id is defined.
 */
export function useCourier(
  id: string | null,
  options?: Partial<UseQueryOptions<Courier>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.couriers.detail(id ?? ''),
    queryFn: () => getCourier(id!),
    enabled: id !== null && id.length > 0,
    staleTime: QUERY_STALE_TIME.REALTIME,
    ...options,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Toggles courier online/offline status.
 * Invalidates list and updates detail cache.
 */
export function useUpdateCourierStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateCourierStatusDto
    }) => updateCourierStatus(id, data),
    onSuccess: (updatedCourier) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.couriers.all,
      })
      queryClient.setQueryData(
        QUERY_KEYS.couriers.detail(updatedCourier.id),
        updatedCourier,
      )
    },
  })
}

/**
 * Updates courier GPS location.
 * StaleTime for location queries is REALTIME — fresh on every access.
 * Used primarily for the mobile app (Phase 2), but available for manual updates.
 *
 * Does NOT invalidate list to avoid refetch noise — WS handles live positions.
 */
export function useUpdateCourierLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateCourierLocationDto
    }) => updateCourierLocation(id, data),
    onSuccess: (updatedCourier) => {
      // Update only the detail cache — list doesn't show raw coordinates
      queryClient.setQueryData(
        QUERY_KEYS.couriers.detail(updatedCourier.id),
        updatedCourier,
      )
    },
  })
}
