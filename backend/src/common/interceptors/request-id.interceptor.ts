import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Observable } from 'rxjs';
import {
  assignRequestId,
  REQUEST_ID_HEADER,
  resolveRequestId,
  type RequestWithId,
} from '../http/request-id';
import { TenantContextService } from '../../prisma/tenant-context.service';

interface RequestUser {
  companyId?: string;
}

type RequestWithContext = RequestWithId & {
  user?: RequestUser;
};

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();
    const requestId = resolveRequestId(request);

    assignRequestId(request, requestId);
    this.tenantContext.setRequestId(requestId);
    if (request.user?.companyId) {
      this.tenantContext.setCompanyId(request.user.companyId);
    }
    response.setHeader(REQUEST_ID_HEADER, requestId);

    return next.handle();
  }
}
