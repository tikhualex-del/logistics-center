import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PUBLIC_ROUTE_KEY } from '../../../common/decorators/public.decorator';
import { REQUIRE_PERMISSION_KEY } from '../../../common/decorators/require-permission.decorator';
import type { AuthenticatedUser, RequestWithUser } from '../auth-request.types';
import {
  hasPermission,
  type PermissionName,
} from '../permissions/permission-matrix';
import { shouldBypassAccessGuards } from './auth-route-access';

@Injectable()
export class PermissionsGuard implements CanActivate {
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

    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionName[]
    >(REQUIRE_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions?.length) {
      return true;
    }

    const userRole = request.user?.role;
    if (!userRole) {
      throw new ForbiddenException('Missing user role');
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(userRole, permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
