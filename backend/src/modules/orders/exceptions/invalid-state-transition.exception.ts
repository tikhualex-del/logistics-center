import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

export class InvalidStateTransitionException extends BadRequestException {
  constructor(fromStatus: OrderStatus, toStatus: OrderStatus) {
    super(`Cannot transition order from "${fromStatus}" to "${toStatus}"`);
  }
}
