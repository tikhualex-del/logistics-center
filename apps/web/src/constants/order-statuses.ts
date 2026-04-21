// Canonical order status vocabulary — mirrors backend
export const ORDER_STATUSES = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  assigned: 'Назначен',
  picked_up: 'Забран',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
  failed: 'Провален',
}

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['new', 'assigned', 'picked_up']
export const TERMINAL_ORDER_STATUSES: OrderStatus[] = ['delivered', 'cancelled', 'failed']
