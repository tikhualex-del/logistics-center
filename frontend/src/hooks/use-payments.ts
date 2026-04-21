import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { QUERY_KEYS } from '@/api/query-keys'
import { QUERY_STALE_TIME } from '@/lib/constants'
import {
  getPaymentRules,
  createPaymentRule,
  updatePaymentRule,
  getPayments,
  getPayment,
  calculatePayment,
  updatePaymentStatus,
  type PaymentRule,
  type Payment,
  type PaymentFilters,
  type UpsertPaymentRuleDto,
  type UpdatePaymentStatusDto,
  type CalculatePaymentDto,
  type PaymentCalculationResult,
} from '@/api/payments.api'

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches all active payment rules for the current company.
 * Used by: payment rules constructor (admin), payment calculation preview.
 *
 * StaleTime: LONG (5min) — rules are rarely changed.
 */
export function usePaymentRules(
  options?: Partial<UseQueryOptions<PaymentRule[]>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.paymentRules.list(),
    queryFn: getPaymentRules,
    staleTime: QUERY_STALE_TIME.LONG,
    ...options,
  })
}

export function useCreatePaymentRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpsertPaymentRuleDto) => createPaymentRule(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.paymentRules.all,
      })
    },
  })
}

export function useUpdatePaymentRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<UpsertPaymentRuleDto>
    }) => updatePaymentRule(id, data),
    onSuccess: (updatedRule) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.paymentRules.all,
      })
      queryClient.setQueryData(QUERY_KEYS.paymentRules.detail(updatedRule.id), updatedRule)
    },
  })
}

/**
 * Fetches paginated payments with optional filters.
 * Used by: payments page table.
 *
 * StaleTime: DEFAULT (30s).
 */
export function usePayments(
  filters?: PaymentFilters,
  options?: Partial<UseQueryOptions<Payment[]>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.payments.list(
      filters as Record<string, unknown> | undefined,
    ),
    queryFn: () => getPayments(filters),
    staleTime: QUERY_STALE_TIME.DEFAULT,
    ...options,
  })
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdatePaymentStatusDto
    }) => updatePaymentStatus(id, data),
    onSuccess: (updatedPayment) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.payments.all,
      })
      queryClient.setQueryData(
        QUERY_KEYS.payments.detail(updatedPayment.id),
        updatedPayment,
      )
    },
  })
}

/**
 * Fetches a single payment by ID with full breakdown.
 * Used by: payment detail modal.
 *
 * Only runs when id is defined.
 */
export function usePayment(
  id: string | null,
  options?: Partial<UseQueryOptions<Payment>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.payments.detail(id ?? ''),
    queryFn: () => getPayment(id!),
    enabled: id !== null && id.length > 0,
    staleTime: QUERY_STALE_TIME.DEFAULT,
    ...options,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Triggers payment calculation for a courier over a period.
 * Creates a new payment record (append-only — backend never overwrites).
 * Invalidates payments list so the new record appears immediately.
 */
export function useCalculatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CalculatePaymentDto) => calculatePayment(data),
    onSuccess: (_result: PaymentCalculationResult) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.payments.all,
      })
    },
  })
}
