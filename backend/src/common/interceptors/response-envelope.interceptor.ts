import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { TenantContextService } from '../../prisma/tenant-context.service';
import { resolveRequestId, type RequestWithId } from '../http/request-id';

interface ResponseEnvelopeMeta {
  requestId: string;
  timestamp: string;
}

interface ResponseEnvelope<T> {
  data: T;
  meta: ResponseEnvelopeMeta;
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<unknown>> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithId>();

    return next.handle().pipe(
      map((data: unknown) => ({
        data: normalizeData(data),
        meta: {
          requestId:
            this.tenantContext.getRequestId() ?? resolveRequestId(request),
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}

function normalizeData(data: unknown): unknown {
  return data === undefined ? null : data;
}
