import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Response } from 'express';
import { STATUS_CODES } from 'node:http';
import { PinoLogger } from 'nestjs-pino';
import { TenantContextService } from '../../prisma/tenant-context.service';
import { resolveRequestId, type RequestWithId } from '../http/request-id';
const INTERNAL_ERROR_MESSAGE = 'Internal server error';

interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  requestId: string;
}

interface RequestUser {
  id?: string;
  userId?: string;
  companyId?: string;
}

type RequestWithContext = RequestWithId & {
  user?: RequestUser;
};

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: PinoLogger,
    private readonly tenantContext: TenantContextService,
  ) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();

    const requestId =
      this.tenantContext.getRequestId() ?? resolveRequestId(request);
    const errorResponse = buildErrorResponse(exception, requestId);
    const userId = request.user?.id ?? request.user?.userId;
    const companyId =
      request.user?.companyId ?? this.tenantContext.getCompanyId();

    this.logger.error(
      {
        err: exception instanceof Error ? exception : undefined,
        exception,
        stack: exception instanceof Error ? exception.stack : undefined,
        requestId,
        userId,
        companyId,
        method: request.method,
        url: request.originalUrl ?? request.url,
        statusCode: errorResponse.statusCode,
      },
      'Unhandled HTTP exception',
    );

    response.status(errorResponse.statusCode).json(errorResponse);
  }
}

function buildErrorResponse(
  exception: unknown,
  requestId: string,
): ApiErrorResponse {
  if (!(exception instanceof HttpException)) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: INTERNAL_ERROR_MESSAGE,
      error: getStatusText(HttpStatus.INTERNAL_SERVER_ERROR),
      requestId,
    };
  }

  const statusCode = exception.getStatus();
  const payload = exception.getResponse();
  const fallbackError = getStatusText(statusCode);

  if (typeof payload === 'string') {
    return {
      statusCode,
      message: payload,
      error: fallbackError,
      requestId,
    };
  }

  if (isApiErrorPayload(payload)) {
    return {
      statusCode,
      message: normalizeMessage(payload.message, exception.message),
      error: normalizeError(payload.error, fallbackError),
      requestId,
    };
  }

  return {
    statusCode,
    message: exception.message || fallbackError,
    error: fallbackError,
    requestId,
  };
}

function normalizeMessage(value: unknown, fallback: string): string | string[] {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    const messages = value.filter(
      (entry): entry is string =>
        typeof entry === 'string' && entry.trim().length > 0,
    );

    if (messages.length === value.length) {
      return messages;
    }
  }

  return fallback;
}

function normalizeError(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return fallback;
}

function isApiErrorPayload(
  value: unknown,
): value is { error?: unknown; message?: unknown } {
  return typeof value === 'object' && value !== null;
}

function getStatusText(statusCode: number): string {
  return STATUS_CODES[statusCode] ?? 'Error';
}
