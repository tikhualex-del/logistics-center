import { BadRequestException } from '@nestjs/common';
import { RouteStatus } from '@prisma/client';

export class InvalidRouteStateTransitionException extends BadRequestException {
  constructor(fromStatus: RouteStatus, toStatus: RouteStatus) {
    super(`Invalid route status transition from "${fromStatus}" to "${toStatus}"`);
  }
}
