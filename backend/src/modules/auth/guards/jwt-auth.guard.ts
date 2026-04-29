import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { PUBLIC_ROUTE_KEY } from '../../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth-request.types';
import { shouldBypassAccessGuards } from './auth-route-access';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const request = context.switchToHttp().getRequest<Request>();
    if (shouldBypassAccessGuards(request)) {
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }

  handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: TUser | false | null | undefined,
  ): TUser {
    if (err instanceof Error) {
      throw err;
    }

    if (err) {
      throw new UnauthorizedException('Not authenticated');
    }

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    return user;
  }
}
