import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import { TenantContextService } from '../../prisma/tenant-context.service';
import {
  assignRequestId,
  REQUEST_ID_HEADER,
  resolveRequestId,
  type RequestWithId,
} from '../http/request-id';

interface RequestUser {
  companyId?: string;
}

type RequestWithContext = RequestWithId & {
  user?: RequestUser;
};

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions()
    options: ThrottlerModuleOptions,
    @InjectThrottlerStorage()
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly tenantContext: TenantContextService,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const { req, res } = this.getRequestResponse(context);
    const request = req as RequestWithContext;
    const requestId = resolveRequestId(request);

    assignRequestId(request, requestId);
    this.tenantContext.setRequestId(requestId);
    if (request.user?.companyId) {
      this.tenantContext.setCompanyId(request.user.companyId);
    }
    if (typeof res?.setHeader === 'function') {
      res.setHeader(REQUEST_ID_HEADER, requestId);
    }

    return await super.canActivate(context);
  }
}
