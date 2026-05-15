import { useMemo, useState, type FormEvent, type ReactElement } from 'react'
import {
  CheckCircle2,
  FileClock,
  PackagePlus,
  RefreshCw,
  Search,
} from 'lucide-react'
import type { CreateOrderDto, Order, OrderStatus } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateOrder,
  useOrders,
  usePermissions,
  useUpdateOrderStatus,
} from '@/hooks'
import { DeadlineBadge, SlaSummaryWidget } from '@/features/sla'
import { cn } from '@/lib/utils'
import { getStatusLabel } from '@/lib/order-utils'
import { useUiStore } from '@/store'
import { NEXT_ORDER_STATUSES } from './order-status-transitions'

const EMPTY_ORDERS: readonly Order[] = []
const STATUS_STYLES: Record<OrderStatus, string> = {
  new: 'bg-slate-500/10 text-slate-700 ring-slate-500/20',
  confirmed: 'bg-sky-500/10 text-sky-700 ring-sky-500/20',
  assigned: 'bg-violet-500/10 text-violet-700 ring-violet-500/20',
  handed_over: 'bg-amber-500/10 text-amber-800 ring-amber-500/20',
  in_transit: 'bg-blue-500/10 text-blue-700 ring-blue-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
  undelivered: 'bg-red-500/10 text-red-700 ring-red-500/20',
  returned: 'bg-orange-500/10 text-orange-800 ring-orange-500/20',
  cancelled: 'bg-zinc-500/10 text-zinc-700 ring-zinc-500/20',
}

interface OrderFormState {
  orderNumber: string
  externalId: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  timeWindowFrom: string
  timeWindowTo: string
  comment: string
}

const EMPTY_ORDER_FORM: OrderFormState = {
  orderNumber: '',
  externalId: '',
  customerName: '',
  customerPhone: '',
  deliveryAddress: '',
  timeWindowFrom: '',
  timeWindowTo: '',
  comment: '',
}

export function OrdersWorkspace(): ReactElement {
  const selectedDate = useUiStore((state) => state.selectedDate)
  const searchQuery = useUiStore((state) => state.searchQuery)
  const statusFilter = useUiStore((state) => state.statusFilter)
  const ordersQuery = useOrders({
    date: selectedDate,
    status: statusFilter ?? undefined,
  })
  const createOrderMutation = useCreateOrder()
  const updateStatusMutation = useUpdateOrderStatus()
  const { can } = usePermissions()

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState<OrderFormState>(EMPTY_ORDER_FORM)

  const orders = ordersQuery.data ?? EMPTY_ORDERS
  const visibleOrders = useMemo(
    () => filterOrders(orders, searchQuery),
    [orders, searchQuery],
  )
  const selectedOrder =
    visibleOrders.find((order) => order.id === selectedOrderId) ??
    visibleOrders[0] ??
    null
  const canEditOrders = can('edit:orders')

  function updateForm<Key extends keyof OrderFormState>(
    key: Key,
    value: OrderFormState[Key],
  ): void {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submitOrder(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    const payload = formToCreateOrderDto(form, selectedDate)
    if (payload === null) return

    createOrderMutation.mutate(payload, {
      onSuccess: (order) => {
        setSelectedOrderId(order.id)
        setForm(EMPTY_ORDER_FORM)
        setIsCreateOpen(false)
      },
    })
  }

  function transitionOrder(order: Order, status: OrderStatus): void {
    updateStatusMutation.mutate({
      id: order.id,
      data: {
        status,
        reason: 'Changed from canonical orders workspace',
      },
    })
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto bg-background p-4 md:p-6">
      <div className="flex flex-col gap-3 border-b border-border pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Заказы
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            Рабочий список заказов
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Детали, SLA, история и быстрые действия на {selectedDate}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void ordersQuery.refetch()}
          >
            <RefreshCw aria-hidden="true" />
            Обновить
          </Button>
          {canEditOrders && (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsCreateOpen((open) => !open)}
            >
              <PackagePlus aria-hidden="true" />
              Новый заказ
            </Button>
          )}
        </div>
      </div>

      <SlaSummaryWidget orders={orders} baseDate={selectedDate} />

      {isCreateOpen && (
        <form
          onSubmit={submitOrder}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TextField
              id="order-number"
              label="Номер заказа"
              value={form.orderNumber}
              onChange={(value) => updateForm('orderNumber', value)}
            />
            <TextField
              id="order-external-id"
              label="Внешний ID"
              value={form.externalId}
              onChange={(value) => updateForm('externalId', value)}
            />
            <TextField
              id="order-customer"
              label="Клиент"
              value={form.customerName}
              onChange={(value) => updateForm('customerName', value)}
            />
            <TextField
              id="order-phone"
              label="Телефон"
              value={form.customerPhone}
              onChange={(value) => updateForm('customerPhone', value)}
            />
            <div className="md:col-span-2">
              <TextField
                id="order-address"
                label="Адрес доставки"
                value={form.deliveryAddress}
                onChange={(value) => updateForm('deliveryAddress', value)}
                required
              />
            </div>
            <TextField
              id="order-window-from"
              label="Окно с"
              type="time"
              value={form.timeWindowFrom}
              onChange={(value) => updateForm('timeWindowFrom', value)}
            />
            <TextField
              id="order-window-to"
              label="Окно до"
              type="time"
              value={form.timeWindowTo}
              onChange={(value) => updateForm('timeWindowTo', value)}
            />
            <div className="md:col-span-2 xl:col-span-4">
              <TextField
                id="order-comment"
                label="Комментарий"
                value={form.comment}
                onChange={(value) => updateForm('comment', value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={
                createOrderMutation.isPending ||
                form.deliveryAddress.trim().length === 0
              }
            >
              Создать
            </Button>
          </div>
        </form>
      )}

      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Заказы на дату
              </h2>
              <p className="text-xs text-muted-foreground">
                {visibleOrders.length} из {orders.length}
              </p>
            </div>
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Заказ</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Адрес</th>
                  <th className="px-4 py-3">SLA</th>
                </tr>
              </thead>
              <tbody>
                {ordersQuery.isLoading && (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={4}>
                      Загрузка заказов...
                    </td>
                  </tr>
                )}
                {!ordersQuery.isLoading &&
                  visibleOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={cn(
                        'cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/50',
                        selectedOrder?.id === order.id && 'bg-muted',
                      )}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">
                          {order.orderNumber ?? order.externalId ?? order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customerName ?? 'Клиент не указан'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="max-w-xs px-4 py-3 text-muted-foreground">
                        <span>{order.deliveryAddress}</span>
                      </td>
                      <td className="px-4 py-3">
                        <DeadlineBadge order={order} baseDate={selectedDate} />
                      </td>
                    </tr>
                  ))}
                {!ordersQuery.isLoading && visibleOrders.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={4}>
                      Нет заказов по выбранным фильтрам.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <OrderDetailPanel
          order={selectedOrder}
          selectedDate={selectedDate}
          canEdit={canEditOrders}
          isStatusPending={updateStatusMutation.isPending}
          onTransition={transitionOrder}
        />
      </div>
    </section>
  )
}

function OrderDetailPanel({
  order,
  selectedDate,
  canEdit,
  isStatusPending,
  onTransition,
}: {
  order: Order | null
  selectedDate: string
  canEdit: boolean
  isStatusPending: boolean
  onTransition: (order: Order, status: OrderStatus) => void
}): ReactElement {
  if (order === null) {
    return (
      <aside className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        Выберите заказ, чтобы увидеть детали, историю и действия.
      </aside>
    )
  }

  const nextStatuses = NEXT_ORDER_STATUSES[order.status]

  return (
    <aside className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Карточка заказа
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">
          {order.orderNumber ?? order.externalId ?? order.id.slice(0, 8)}
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <OrderStatusBadge status={order.status} />
        <DeadlineBadge order={order} baseDate={selectedDate} />
      </div>
      <dl className="space-y-3 text-sm">
        <DetailRow label="Клиент" value={order.customerName ?? 'Не указан'} />
        <DetailRow label="Телефон" value={order.customerPhone ?? 'Не указан'} />
        <DetailRow label="Адрес" value={order.deliveryAddress} />
        <DetailRow label="Комментарий" value={order.comment ?? 'Нет'} />
      </dl>

      {canEdit && nextStatuses.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Действия
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                type="button"
                variant="outline"
                size="sm"
                disabled={isStatusPending}
                onClick={() => onTransition(order, status)}
              >
                <CheckCircle2 aria-hidden="true" />
                {getStatusLabel(status)}
              </Button>
            ))}
          </div>
        </div>
      )}

      <OrderHistoryList order={order} />
    </aside>
  )
}

function OrderHistoryList({ order }: { order: Order }): ReactElement {
  const items = [
    {
      label: 'Создан',
      value: formatDateTime(order.createdAt),
    },
    {
      label: 'Обновлен',
      value: formatDateTime(order.updatedAt),
    },
    {
      label: 'Текущий статус',
      value: getStatusLabel(order.status),
    },
  ]

  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        История
      </p>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex gap-3 text-sm">
            <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              <FileClock className="h-3 w-3" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OrderStatusBadge({ status }: { status: OrderStatus }): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center rounded-md px-2 text-xs font-semibold ring-1',
        STATUS_STYLES[status],
      )}
    >
      {getStatusLabel(status)}
    </span>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}): ReactElement {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2"
      />
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string
}): ReactElement {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  )
}

function filterOrders(
  orders: readonly Order[],
  searchQuery: string,
): Order[] {
  const normalized = searchQuery.trim().toLowerCase()
  if (!normalized) return [...orders]

  return orders.filter((order) =>
    [
      order.orderNumber,
      order.externalId,
      order.customerName,
      order.customerPhone,
      order.deliveryAddress,
    ]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalized)),
  )
}

function formToCreateOrderDto(
  form: OrderFormState,
  selectedDate: string,
): CreateOrderDto | null {
  const deliveryAddress = form.deliveryAddress.trim()
  if (!deliveryAddress) return null

  return {
    deliveryAddress,
    orderNumber: optionalString(form.orderNumber),
    externalId: optionalString(form.externalId),
    customerName: optionalString(form.customerName),
    customerPhone: optionalString(form.customerPhone),
    comment: optionalString(form.comment),
    scheduledDate: `${selectedDate}T00:00:00.000Z`,
    timeWindowFrom: form.timeWindowFrom
      ? `${selectedDate}T${form.timeWindowFrom}:00.000Z`
      : undefined,
    timeWindowTo: form.timeWindowTo
      ? `${selectedDate}T${form.timeWindowTo}:00.000Z`
      : undefined,
    metadata: {
      source: 'canonical-orders-workspace',
    },
  }
}

function optionalString(value: string): string | undefined {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}
