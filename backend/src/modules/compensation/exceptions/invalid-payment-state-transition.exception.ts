import { BadRequestException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';

export class InvalidPaymentStateTransitionException extends BadRequestException {
  constructor(fromStatus: PaymentStatus, toStatus: PaymentStatus) {
    super(`Cannot transition payment from "${fromStatus}" to "${toStatus}"`);
  }
}
