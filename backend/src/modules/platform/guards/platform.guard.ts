import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  isPlatformAdminUser,
  type AuthenticatedUser,
  type RequestWithUser,
} from '../../auth/auth-request.types';

@Injectable()
export class PlatformGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithUser<AuthenticatedUser> & Request>();

    if (!isPlatformAdminUser(request.user)) {
      throw new ForbiddenException('Platform admin access is required');
    }

    return true;
  }
}
