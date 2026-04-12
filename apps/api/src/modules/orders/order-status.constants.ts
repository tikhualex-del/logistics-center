export const ORDER_STATUSES = [
  'pending',      // created, not yet assigned to a courier
  'assigned',     // courier assigned, pickup not started
  'in_transit',   // courier picked up, on the way
  'delivered',    // successfully completed
  'failed',       // delivery attempt failed
  'cancelled',    // order cancelled before delivery
  'returned',     // returned after failed or refused delivery
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isValidOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
