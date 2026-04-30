import type { ReactElement } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, MinusCircle } from 'lucide-react'
import type { Order } from '@/api'
import { cn } from '@/lib/utils'
import {
  getOrderDeadline,
  getOrderSlaStatus,
  type SlaStatus,
} from './sla-utils'

const STATUS_STYLES: Record<
  SlaStatus,
  {
    label: string
    className: string
    Icon: typeof CheckCircle2
  }
> = {
  no_deadline: {
    label: 'Без SLA',
    className: 'bg-slate-500/10 text-slate-600 ring-slate-500/20',
    Icon: MinusCircle,
  },
  on_track: {
    label: 'По плану',
    className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
    Icon: CheckCircle2,
  },
  at_risk: {
    label: 'Под риском',
    className: 'bg-amber-500/10 text-amber-800 ring-amber-500/20',
    Icon: Clock3,
  },
  overdue: {
    label: 'Просрочен',
    className: 'bg-red-500/10 text-red-700 ring-red-500/20',
    Icon: AlertTriangle,
  },
}

export function SlaStatusBadge({
  status,
  className,
}: {
  status: SlaStatus
  className?: string
}): ReactElement {
  const config = STATUS_STYLES[status]
  const Icon = config.Icon

  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-semibold ring-1',
        config.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </span>
  )
}

export function DeadlineBadge({
  order,
  baseDate,
}: {
  order: Order
  baseDate: string
}): ReactElement {
  const deadline = getOrderDeadline(order.timeWindowTo, baseDate)
  const status = getOrderSlaStatus(order, baseDate)

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
      {deadline === null ? 'Окно не задано' : formatDeadline(deadline)}
      <SlaStatusBadge status={status} />
    </span>
  )
}

export function SlaSummaryWidget({
  orders,
  baseDate,
}: {
  orders: readonly Order[]
  baseDate: string
}): ReactElement {
  const counts = countBySlaStatus(orders, baseDate)

  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {(['on_track', 'at_risk', 'overdue', 'no_deadline'] as const).map(
        (status) => (
          <div
            key={status}
            className="rounded-lg border border-border bg-card p-3"
          >
            <SlaStatusBadge status={status} />
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {counts[status]}
            </p>
          </div>
        ),
      )}
    </div>
  )
}

function countBySlaStatus(
  orders: readonly Order[],
  baseDate: string,
): Record<SlaStatus, number> {
  return orders.reduce<Record<SlaStatus, number>>(
    (acc, order) => {
      acc[getOrderSlaStatus(order, baseDate)] += 1
      return acc
    },
    {
      no_deadline: 0,
      on_track: 0,
      at_risk: 0,
      overdue: 0,
    },
  )
}

function formatDeadline(deadline: Date): string {
  return deadline.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
