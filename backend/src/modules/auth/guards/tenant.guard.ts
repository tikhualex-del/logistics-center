import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PUBLIC_ROUTE_KEY } from '../../../common/decorators/public.decorator';
import type { AuthenticatedUser, RequestWithUser } from '../auth-request.types';
import { shouldBypassAccessGuards } from './auth-route-access';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithUser<AuthenticatedUser> & Request>();

    if (shouldBypassAccessGuards(request)) {
      return true;
    }

    const companyId = request.user?.companyId?.trim();
    if (!companyId) {
      throw new ForbiddenException('Missing tenant context');
    }

    return true;
  }
}
