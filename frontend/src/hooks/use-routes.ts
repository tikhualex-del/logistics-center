import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { QUERY_KEYS } from '@/api/query-keys'
import { QUERY_STALE_TIME } from '@/lib/constants'
import {
  getRoutes,
  getRoute,
  buildRoutes,
  updateRoute,
  type Route,
  type RouteFilters,
  type BuildRoutesDto,
  type UpdateRouteDto,
} from '@/api/routes.api'

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches paginated routes with optional filters.
 * Used by: dispatcher map (route polylines), route management panel.
 *
 * StaleTime: DEFAULT (30s).
 */
export function useRoutes(
  filters?: RouteFilters,
  options?: Partial<UseQueryOptions<Route[]>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.routes.list(
      filters as Record<string, unknown> | undefined,
    ),
    queryFn: () => getRoutes(filters),
    staleTime: QUERY_STALE_TIME.DEFAULT,
    ...options,
  })
}

/**
 * Fetches a single route by ID including all route points.
 * Used by: route detail view, route editing panel.
 *
 * Only runs when id is defined.
 */
export function useRoute(
  id: string | null,
  options?: Partial<UseQueryOptions<Route>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.routes.detail(id ?? ''),
    queryFn: () => getRoute(id!),
    enabled: id !== null && id.length > 0,
    staleTime: QUERY_STALE_TIME.DEFAULT,
    ...options,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Triggers auto route building via RoutingProvider (YandexRoutingProvider).
 * Returns the newly created route.
 * Invalidates full routes cache on success.
 */
export function useBuildRoutes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BuildRoutesDto) => buildRoutes(data),
    onSuccess: () => {
      // Invalidate all routes — building may create multiple new route records
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.routes.all })
    },
  })
}

/**
 * Updates a route (courier assignment, point reorder, status transition).
 * Invalidates list and updates detail cache with server response.
 */
export function useUpdateRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRouteDto }) =>
      updateRoute(id, data),
    onSuccess: (updatedRoute) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.routes.all })
      queryClient.setQueryData(
        QUERY_KEYS.routes.detail(updatedRoute.id),
        updatedRoute,
      )
    },
  })
}
