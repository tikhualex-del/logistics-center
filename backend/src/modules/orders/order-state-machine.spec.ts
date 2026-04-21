import { OrderStatus } from '@prisma/client';
import {
  canTransition,
  getAllowedOrderTransitions,
} from './order-state-machine';

describe('order-state-machine', () => {
  const expectedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
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

  it.each(
    Object.entries(expectedTransitions) as [OrderStatus, OrderStatus[]][],
  )('allows only valid transitions from %s', (fromStatus, allowedStatuses) => {
    for (const toStatus of Object.values(OrderStatus)) {
      expect(canTransition(fromStatus, toStatus)).toBe(
        allowedStatuses.includes(toStatus),
      );
    }
  });

  it('rejects self-transitions for every order status', () => {
    for (const status of Object.values(OrderStatus)) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  it('rejects all transitions from terminal order states', () => {
    const terminalStatuses = [
      OrderStatus.delivered,
      OrderStatus.undelivered,
      OrderStatus.returned,
      OrderStatus.cancelled,
    ];

    for (const fromStatus of terminalStatuses) {
      for (const toStatus of Object.values(OrderStatus)) {
        expect(canTransition(fromStatus, toStatus)).toBe(false);
      }
    }
  });

  it('exposes allowed terminal transitions from in_transit', () => {
    expect(getAllowedOrderTransitions(OrderStatus.in_transit)).toEqual([
      OrderStatus.delivered,
      OrderStatus.undelivered,
      OrderStatus.returned,
      OrderStatus.cancelled,
    ]);
  });
});
