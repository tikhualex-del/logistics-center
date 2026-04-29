import { useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Banknote,
  CheckCircle2,
  ChevronRight,
  FileText,
  RefreshCw,
  Scale,
  X,
} from 'lucide-react'
import type {
  Courier,
  Payment,
  PaymentBreakdownItem,
  PaymentFilters,
  PaymentStatus,
} from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import i18n from '@/i18n'
import {
  useCouriers,
  usePayment,
  usePayments,
  usePermissions,
  useUpdatePaymentStatus,
} from '@/hooks'
import { cn } from '@/lib/utils'

const PAYMENT_STATUS_VALUES: PaymentStatus[] = [
  'draft',
  'calculated',
  'approved',
  'paid',
  'disputed',
]

const STATUS_STYLES: Record<PaymentStatus, string> = {
  draft: 'bg-slate-500/10 text-slate-700 ring-slate-500/20',
  calculated: 'bg-sky-500/10 text-sky-700 ring-sky-500/20',
  approved: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
  paid: 'bg-violet-500/10 text-violet-700 ring-violet-500/20',
  disputed: 'bg-red-500/10 text-red-700 ring-red-500/20',
}

export function PaymentsLedger(): ReactElement {
  const { t } = useTranslation()
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('')
  const [courierFilter, setCourierFilter] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [transitionReason, setTransitionReason] = useState('')

  const filters = useMemo<PaymentFilters>(
    () => ({
      limit: 100,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(courierFilter ? { courierId: courierFilter } : {}),
      ...(periodStart ? { periodStartFrom: dateInputToIso(periodStart, false) } : {}),
      ...(periodEnd ? { periodEndTo: dateInputToIso(periodEnd, true) } : {}),
    }),
    [courierFilter, periodEnd, periodStart, statusFilter],
  )

  const paymentsQuery = usePayments(filters)
  const couriersQuery = useCouriers()
  const paymentQuery = usePayment(selectedPaymentId)
  const updateStatusMutation = useUpdatePaymentStatus()
  const { can } = usePermissions()

  const payments = useMemo(() => paymentsQuery.data ?? [], [paymentsQuery.data])
  const couriers = useMemo(() => couriersQuery.data ?? [], [couriersQuery.data])
  const couriersById = useMemo(() => mapCouriersById(couriers), [couriers])
  const selectedPayment =
    paymentQuery.data ??
    payments.find((payment) => payment.id === selectedPaymentId) ??
    null
  const canApprove = can('approve:motivation-rules')

  function resetFilters(): void {
    setStatusFilter('')
    setCourierFilter('')
    setPeriodStart('')
    setPeriodEnd('')
  }

  function updatePaymentStatus(payment: Payment, status: PaymentStatus): void {
    updateStatusMutation.mutate(
      {
        id: payment.id,
        data: {
          status,
          reason: transitionReason.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setTransitionReason('')
        },
      },
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t('payments.ledger.title')}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {t('payments.ledger.subtitle')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void paymentsQuery.refetch()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent"
              aria-label={t('payments.ledger.refresh')}
            >
              <RefreshCw
                className={cn('h-4 w-4', paymentsQuery.isFetching && 'animate-spin')}
              />
            </button>
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              {t('payments.ledger.resetFilters')}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="payment-status">{t('payments.ledger.filters.status')}</Label>
            <select
              id="payment-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as PaymentStatus | '')
              }
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t('payments.ledger.allStatuses')}</option>
              {PAYMENT_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {t(`payments.status.${status}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="payment-courier">{t('payments.ledger.filters.courier')}</Label>
            <select
              id="payment-courier"
              value={courierFilter}
              onChange={(event) => setCourierFilter(event.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t('payments.ledger.allCouriers')}</option>
              {couriers.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {formatCourierName(courier)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="payment-start">{t('payments.ledger.filters.periodFrom')}</Label>
            <Input
              id="payment-start"
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="payment-end">{t('payments.ledger.filters.periodTo')}</Label>
            <Input
              id="payment-end"
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      <div className="grid min-h-[420px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <PaymentsTable
          payments={payments}
          couriersById={couriersById}
          selectedPaymentId={selectedPaymentId}
          isLoading={paymentsQuery.isLoading}
          isError={paymentsQuery.isError}
          onRetry={() => void paymentsQuery.refetch()}
          onSelect={setSelectedPaymentId}
        />

        <PaymentDetailPanel
          payment={selectedPayment}
          couriersById={couriersById}
          isLoading={paymentQuery.isLoading}
          canApprove={canApprove}
          reason={transitionReason}
          isUpdating={updateStatusMutation.isPending}
          updateError={updateStatusMutation.error}
          onReasonChange={setTransitionReason}
          onClose={() => setSelectedPaymentId(null)}
          onApprove={(payment) => updatePaymentStatus(payment, 'approved')}
          onDispute={(payment) => updatePaymentStatus(payment, 'disputed')}
        />
      </div>
    </section>
  )
}

function PaymentsTable({
  payments,
  couriersById,
  selectedPaymentId,
  isLoading,
  isError,
  onRetry,
  onSelect,
}: {
  payments: Payment[]
  couriersById: Map<string, Courier>
  selectedPaymentId: string | null
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onSelect: (paymentId: string) => void
}): ReactElement {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="space-y-3 p-5">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
        <FileText className="h-9 w-9 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold text-foreground">
          {t('payments.ledger.loadError')}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-4">
          {t('payments.ledger.loadErrorRetry')}
        </Button>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
        <Banknote className="h-9 w-9 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold text-foreground">
          {t('payments.ledger.empty')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('payments.ledger.emptyHint')}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="hidden min-w-[900px] grid-cols-[minmax(200px,1fr)_180px_140px_140px_minmax(220px,1fr)_48px] gap-4 border-b border-border bg-muted/40 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground md:grid"
        role="row"
      >
        <span>{t('payments.ledger.columns.courier')}</span>
        <span>{t('payments.ledger.columns.period')}</span>
        <span>{t('payments.ledger.columns.amount')}</span>
        <span>{t('payments.ledger.columns.status')}</span>
        <span>{t('payments.ledger.columns.breakdown')}</span>
        <span />
      </div>
      <div className="min-w-0 divide-y divide-border md:min-w-[900px]">
        {payments.map((payment) => (
          <button
            key={payment.id}
            type="button"
            onClick={() => onSelect(payment.id)}
            className={cn(
              'grid w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-accent',
              'md:grid-cols-[minmax(200px,1fr)_180px_140px_140px_minmax(220px,1fr)_48px] md:items-center md:gap-4',
              selectedPaymentId === payment.id &&
                'bg-primary/5 ring-1 ring-inset ring-primary/20',
            )}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {formatCourierName(couriersById.get(payment.courierId))}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {payment.courierId}
              </p>
            </div>
            <p className="text-sm text-foreground">
              {formatPeriod(payment.periodStart, payment.periodEnd)}
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {formatMoney(payment.amount, payment.currency)}
            </p>
            <PaymentStatusBadge status={payment.status} />
            <p className="truncate text-xs text-muted-foreground">
              {formatBreakdownSummary(payment)}
            </p>
            <ChevronRight className="h-4 w-4 text-muted-foreground md:justify-self-end" />
          </button>
        ))}
      </div>
    </div>
  )
}

function PaymentDetailPanel({
  payment,
  couriersById,
  isLoading,
  canApprove,
  reason,
  isUpdating,
  updateError,
  onReasonChange,
  onClose,
  onApprove,
  onDispute,
}: {
  payment: Payment | null
  couriersById: Map<string, Courier>
  isLoading: boolean
  canApprove: boolean
  reason: string
  isUpdating: boolean
  updateError: Error | null
  onReasonChange: (value: string) => void
  onClose: () => void
  onApprove: (payment: Payment) => void
  onDispute: (payment: Payment) => void
}): ReactElement {
  const { t } = useTranslation()

  if (payment === null) {
    return (
      <aside className="border-t border-border bg-background p-5 xl:border-l xl:border-t-0">
        <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
          <Scale className="h-9 w-9 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            {t('payments.detail.selectPayment')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('payments.detail.selectPaymentHint')}
          </p>
        </div>
      </aside>
    )
  }

  const components = getBreakdownComponents(payment)
  const summary = payment.breakdown.summary
  const canApprovePayment = canApprove && payment.status === 'calculated'
  const canDisputePayment = canApprove && payment.status === 'paid'

  return (
    <aside className="border-t border-border bg-background xl:border-l xl:border-t-0">
      <div className="flex items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('payments.detail.title')}
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {formatCourierName(couriersById.get(payment.courierId))}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent"
          aria-label={t('payments.detail.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-5 p-5">
        {isLoading && (
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            {t('payments.detail.refreshing')}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <DetailMetric
            label={t('payments.detail.amount')}
            value={formatMoney(payment.amount, payment.currency)}
          />
          <DetailMetric
            label={t('payments.detail.status')}
            value={t(`payments.status.${payment.status}`)}
          />
          <DetailMetric
            label={t('payments.detail.period')}
            value={formatPeriod(payment.periodStart, payment.periodEnd)}
          />
          <DetailMetric
            label={t('payments.detail.rules')}
            value={summary?.appliedRuleCount ?? components.length}
          />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {t('payments.detail.breakdown')}
          </h4>
          {components.length === 0 ? (
            <p className="mt-2 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
              {t('payments.detail.breakdownEmpty')}
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {components.map((component, index) => (
                <div
                  key={`${component.ruleId}-${index}`}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {component.name ?? component.ruleName ?? component.ruleId}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRuleType(component.ruleType)}
                        {component.reason ? ` · ${component.reason}` : ''}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        component.amount < 0 ? 'text-destructive' : 'text-foreground',
                      )}
                    >
                      {formatMoney(component.amount, payment.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="payment-transition-reason">
            {t('payments.detail.transitionReason')}
          </Label>
          <textarea
            id="payment-transition-reason"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            maxLength={500}
            rows={3}
            className="mt-2 w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={t('payments.detail.transitionHint')}
          />
        </div>

        {updateError !== null && (
          <p className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {updateError.message}
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            disabled={!canApprovePayment || isUpdating}
            onClick={() => onApprove(payment)}
          >
            <CheckCircle2 />
            {t('payments.detail.approve')}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!canDisputePayment || isUpdating}
            onClick={() => onDispute(payment)}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Scale />
            {t('payments.detail.dispute')}
          </Button>
        </div>

        {!canApprove && (
          <p className="text-xs text-muted-foreground">
            {t('payments.detail.hiddenActions')}
          </p>
        )}
      </div>
    </aside>
  )
}

function DetailMetric({
  label,
  value,
}: {
  label: string
  value: string | number
}): ReactElement {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground tabular-nums">
        {value}
      </p>
    </div>
  )
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }): ReactElement {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset',
        STATUS_STYLES[status],
      )}
    >
      {t(`payments.status.${status}`)}
    </span>
  )
}

function mapCouriersById(couriers: Courier[]): Map<string, Courier> {
  return new Map(couriers.map((courier) => [courier.id, courier]))
}

function formatCourierName(courier: Courier | undefined): string {
  if (!courier) return i18n.t('payments.detail.unknownCourier')

  const name = `${courier.firstName} ${courier.lastName ?? ''}`.trim()
  return name || courier.email
}

function formatPeriod(start: string, end: string): string {
  return `${formatDate(start)} - ${formatDate(end)}`
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return i18n.t('payments.detail.unknown')

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

function formatMoney(value: string | number, currency: string): string {
  const amount = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(amount)) return `${value} ${currency}`

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatRuleType(value: string): string {
  const key = toCamelCase(value)
  const translated = i18n.t(`payments.rules.types.${key}`, { defaultValue: '' })
  if (translated) return translated

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toCamelCase(value: string): string {
  const parts = value.split('_')
  if (parts.length === 1) return parts[0]
  return (
    parts[0] +
    parts
      .slice(1)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  )
}

function getBreakdownComponents(payment: Payment): PaymentBreakdownItem[] {
  return payment.breakdown.components ?? []
}

function formatBreakdownSummary(payment: Payment): string {
  const summary = payment.breakdown.summary
  if (!summary) return i18n.t('payments.detail.noSummary')

  return i18n.t('payments.detail.summary', {
    orders: summary.deliveredOrdersCount ?? 0,
    distance: summary.totalDistanceKm ?? 0,
    rules: summary.appliedRuleCount ?? 0,
  })
}

function dateInputToIso(value: string, endOfDay: boolean): string {
  const suffix = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000'
  return new Date(`${value}${suffix}`).toISOString()
}
