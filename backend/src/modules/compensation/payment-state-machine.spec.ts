import { PaymentStatus } from '@prisma/client';
import { canTransitionPayment } from './payment-state-machine';

describe('canTransitionPayment', () => {
  const expectedTransitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
    [PaymentStatus.draft]: [PaymentStatus.calculated],
    [PaymentStatus.calculated]: [PaymentStatus.approved],
    [PaymentStatus.approved]: [PaymentStatus.paid],
    [PaymentStatus.paid]: [PaymentStatus.disputed],
    [PaymentStatus.disputed]: [],
  };

  it.each(
    Object.entries(expectedTransitions) as [PaymentStatus, PaymentStatus[]][],
  )('allows only valid transitions from %s', (fromStatus, allowedStatuses) => {
    for (const toStatus of Object.values(PaymentStatus)) {
      expect(canTransitionPayment(fromStatus, toStatus)).toBe(
        allowedStatuses.includes(toStatus),
      );
    }
  });

  it('rejects self-transitions for every payment status', () => {
    for (const status of Object.values(PaymentStatus)) {
      expect(canTransitionPayment(status, status)).toBe(false);
    }
  });

  it('rejects all transitions from terminal payment states', () => {
    for (const toStatus of Object.values(PaymentStatus)) {
      expect(canTransitionPayment(PaymentStatus.disputed, toStatus)).toBe(
        false,
      );
    }
  });
});
