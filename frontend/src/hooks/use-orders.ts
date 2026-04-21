import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { QUERY_KEYS } from '@/api/query-keys'
import { QUERY_STALE_TIME } from '@/lib/constants'
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  type Order,
  type OrderFilters,
  type CreateOrderDto,
  type UpdateOrderDto,
  type UpdateOrderStatusDto,
} from '@/api/orders.api'

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches paginated orders with optional filters.
 * Used by: dispatcher order list panel, map markers.
 *
 * StaleTime: DEFAULT (30s) — orders change frequently but not real-time.
 * Real-time updates arrive via WebSocket (FEAT-043/044).
 */
export function useOrders(
  filters?: OrderFilters,
  options?: Partial<UseQueryOptions<Order[]>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.orders.list(
      filters as Record<string, unknown> | undefined,
    ),
    queryFn: () => getOrders(filters),
    staleTime: QUERY_STALE_TIME.DEFAULT,
    ...options,
  })
}

/**
 * Fetches a single order by ID.
 * Used by: order detail panel, status update forms.
 *
 * Only runs when id is defined (enabled guard).
 */
export function useOrder(
  id: string | null,
  options?: Partial<UseQueryOptions<Order>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.orders.detail(id ?? ''),
    queryFn: () => getOrder(id!),
    enabled: id !== null && id.length > 0,
    staleTime: QUERY_STALE_TIME.DEFAULT,
    ...options,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Creates a new order.
 * Invalidates the full orders list on success.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrderDto) => createOrder(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.all })
    },
  })
}

/**
 * Updates order fields (not status — use useUpdateOrderStatus for transitions).
 * Invalidates both the list and the specific order detail cache.
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderDto }) =>
      updateOrder(id, data),
    onSuccess: (updatedOrder) => {
      // Invalidate list — order data may affect sort/filter
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.all })
      // Update detail cache immediately with response data
      queryClient.setQueryData(
        QUERY_KEYS.orders.detail(updatedOrder.id),
        updatedOrder,
      )
    },
  })
}

/**
 * Transitions order to a new status via state machine (server-validated).
 * Invalidates all order caches to reflect the status change immediately.
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateOrderStatusDto
    }) => updateOrderStatus(id, data),
    onSuccess: (updatedOrder) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.all })
      queryClient.setQueryData(
        QUERY_KEYS.orders.detail(updatedOrder.id),
        updatedOrder,
      )
    },
  })
}
