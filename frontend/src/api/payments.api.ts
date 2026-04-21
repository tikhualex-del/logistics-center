import httpClient from './http-client'
import type { ApiResponse } from './http-client'
// ─── Domain types ─────────────────────────────────────────────────────────────

export type PaymentRuleType =
  | 'zone_rate'
  | 'per_km'
  | 'per_order'
  | 'bonus'
  | 'penalty'
  | 'minimum_guarantee'

export interface PaymentRule {
  id: string
  companyId: string
  ruleKey: string
  name: string
  ruleType: PaymentRuleType
  version: number
  value: number
  conditions: Record<string, unknown> | null
  isActive: boolean
  effectiveFrom: string | null
  effectiveTo: string | null
  changedByUserId: string | null
  changeReason: string | null
  createdAt: string
  updatedAt: string
}

export interface UpsertPaymentRuleDto {
  name: string
  ruleType: PaymentRuleType
  value: number
  conditions?: Record<string, unknown> | null
  isActive?: boolean
  changeReason?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
}

/**
 * Payment status per state machine (CLAUDE.md Section 11).
 * draft → calculated → approved → paid → disputed
 */
export type PaymentStatus =
  | 'draft'
  | 'calculated'
  | 'approved'
  | 'paid'
  | 'disputed'

export interface PaymentBreakdownItem {
  ruleId: string
  ruleKey?: string
  version?: number
  ruleName?: string
  name?: string
  ruleType: PaymentRuleType
  applied?: boolean
  amount: number
  reason?: string
  details: Record<string, unknown>
}

export interface PaymentBreakdown {
  currency?: string
  period?: {
    start?: string
    end?: string
  }
  summary?: {
    completedRoutesCount?: number
    deliveredOrdersCount?: number
    totalDistanceKm?: number
    subtotalBeforeGuarantee?: number
    minimumGuaranteeTopUp?: number
    totalAmount?: number
    appliedRuleCount?: number
    componentCount?: number
  }
  metrics?: Record<string, unknown>
  routes?: Array<Record<string, unknown>>
  orders?: Array<Record<string, unknown>>
  components?: PaymentBreakdownItem[]
  appliedRuleVersionIds?: string[]
  [key: string]: unknown
}

export interface Payment {
  id: string
  companyId: string
  courierId: string
  paymentRuleVersionId: string | null
  status: PaymentStatus
  periodStart: string
  periodEnd: string
  currency: string
  amount: string
  breakdown: PaymentBreakdown
  approvedByUserId: string | null
  approvedAt: string | null
  paidAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface PaymentFilters {
  status?: PaymentStatus
  courierId?: string
  periodStartFrom?: string
  periodEndTo?: string
  limit?: number
}

export interface UpdatePaymentStatusDto {
  status: PaymentStatus
  reason?: string
  metadata?: Record<string, unknown>
}

export interface CalculatePaymentDto {
  courierId: string
  periodStart: string
  periodEnd: string
}

export type PaymentCalculationResult = Payment

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/payment-rules
 * Returns all payment rules for the current company.
 */
export async function getPaymentRules(): Promise<PaymentRule[]> {
  const response = await httpClient.get<ApiResponse<PaymentRule[]>>(
    '/payment-rules',
  )
  return response.data.data
}

/**
 * POST /api/v1/payment-rules
 * Creates the first version of a payment rule.
 */
export async function createPaymentRule(
  data: UpsertPaymentRuleDto,
): Promise<PaymentRule> {
  const response = await httpClient.post<ApiResponse<PaymentRule>>(
    '/payment-rules',
    data,
  )
  return response.data.data
}

/**
 * PATCH /api/v1/payment-rules/:id
 * Creates a new version of an existing payment rule.
 */
export async function updatePaymentRule(
  id: string,
  data: Partial<UpsertPaymentRuleDto>,
): Promise<PaymentRule> {
  const response = await httpClient.patch<ApiResponse<PaymentRule>>(
    `/payment-rules/${id}`,
    data,
  )
  return response.data.data
}

/**
 * GET /api/v1/payments
 */
export async function getPayments(
  filters?: PaymentFilters,
): Promise<Payment[]> {
  const response = await httpClient.get<ApiResponse<Payment[]>>(
    '/payments',
    { params: filters },
  )
  return response.data.data
}

/**
 * GET /api/v1/payments/:id
 */
export async function getPayment(id: string): Promise<Payment> {
  const response = await httpClient.get<ApiResponse<Payment>>(
    `/payments/${id}`,
  )
  return response.data.data
}

/**
 * POST /api/v1/payments/calculate
 * Runs payment calculation engine for a courier over a period.
 * Creates a new payment record (append-only per CLAUDE.md Section 13).
 */
export async function calculatePayment(
  data: CalculatePaymentDto,
): Promise<PaymentCalculationResult> {
  const response = await httpClient.post<ApiResponse<PaymentCalculationResult>>(
    '/payments/calculate',
    data,
  )
  return response.data.data
}

/**
 * PATCH /api/v1/payments/:id/status
 * Advances payment state through the backend state machine.
 */
export async function updatePaymentStatus(
  id: string,
  data: UpdatePaymentStatusDto,
): Promise<Payment> {
  const response = await httpClient.patch<ApiResponse<Payment>>(
    `/payments/${id}/status`,
    data,
  )
  return response.data.data
}
