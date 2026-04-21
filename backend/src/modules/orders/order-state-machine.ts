import { OrderStatus } from '@prisma/client';

export const ORDER_STATUS_TRANSITIONS: Readonly<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  [OrderStatus.new]: [OrderStatus.confirmed],
  [OrderStatus.confirmed]: [OrderStatus.assigned],
  [OrderStatus.assigned]: [OrderStatus.handed_over],
  [OrderStatus.handed_over]: [OrderStatus.in_transit],
  [OrderStatus.in_transit]: [
    OrderStatus.delivered,
    OrderStatus.undelivered,
    OrderStatus.returned,
    OrderStatus.cancelled,
  ],
  [OrderStatus.delivered]: [],
  [OrderStatus.undelivered]: [],
  [OrderStatus.returned]: [],
  [OrderStatus.cancelled]: [],
};

export function canTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
): boolean {
  return ORDER_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}

export function getAllowedOrderTransitions(
  fromStatus: OrderStatus,
): readonly OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[fromStatus];
}
