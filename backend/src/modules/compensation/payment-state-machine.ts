import { PaymentStatus } from '@prisma/client';

const ALLOWED_PAYMENT_TRANSITIONS: Record<
  PaymentStatus,
  readonly PaymentStatus[]
> = {
  [PaymentStatus.draft]: [PaymentStatus.calculated],
  [PaymentStatus.calculated]: [PaymentStatus.approved],
  [PaymentStatus.approved]: [PaymentStatus.paid],
  [PaymentStatus.paid]: [PaymentStatus.disputed],
  [PaymentStatus.disputed]: [],
};

export function canTransitionPayment(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
): boolean {
  return ALLOWED_PAYMENT_TRANSITIONS[currentStatus].includes(nextStatus);
}
