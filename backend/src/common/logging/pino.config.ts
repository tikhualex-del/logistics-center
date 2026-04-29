import type { DestinationStream } from 'pino';
import type { Params } from 'nestjs-pino';
import type { Options } from 'pino-http';
import {
  getTenantContextCompanyId,
  getTenantContextRequestId,
} from '../../prisma/tenant-context.service';
import {
  assignRequestId,
  resolveRequestId,
  type RequestWithId,
} from '../http/request-id';

interface LoggerModuleParamsOptions {
  level?: string;
  stream?: DestinationStream;
  usePrettyTransport?: boolean;
}

interface RequestWithTenant extends RequestWithId {
  user?: {
    companyId?: string;
  };
}

export function createLoggerModuleParams(
  options: LoggerModuleParamsOptions = {},
): Params {
  const pinoHttpOptions = createPinoHttpOptions(options);

  return {
    assignResponse: true,
    pinoHttp: options.stream
      ? [pinoHttpOptions, options.stream]
      : pinoHttpOptions,
  };
}

function createPinoHttpOptions(options: LoggerModuleParamsOptions): Options {
  return {
    level: options.level ?? process.env['LOG_LEVEL'] ?? 'info',
    messageKey: 'message',
    timestamp: isoTimestamp,
    formatters: {
      level(label: string) {
        return { level: label };
      },
    },
    transport: options.usePrettyTransport
      ? { target: 'pino-pretty', options: { singleLine: true } }
      : undefined,
    customAttributeKeys: {
      reqId: 'requestId',
    },
    quietReqLogger: true,
    autoLogging: true,
    customProps: () => ({
      context: 'HTTP',
    }),
    customSuccessObject(req) {
      const companyId = getRequestCompanyId(req as RequestWithTenant);
      return companyId ? { companyId } : {};
    },
    customErrorObject(req) {
      const companyId = getRequestCompanyId(req as RequestWithTenant);
      return companyId ? { companyId } : {};
    },
    serializers: {
      req(req: { id?: string; method: string; url: string }) {
        return {
          requestId: req.id,
          method: req.method,
          url: req.url,
        };
      },
    },
    genReqId(req) {
      const request = req as RequestWithId;
      const requestId = resolveRequestId(request);
      assignRequestId(request, requestId);
      return requestId;
    },
    mixin() {
      const requestId = getTenantContextRequestId() ?? null;
      const companyId = getTenantContextCompanyId();

      return companyId ? { requestId, companyId } : { requestId };
    },
  };
}

function isoTimestamp(): string {
  return `,"timestamp":"${new Date().toISOString()}"`;
}

function getRequestCompanyId(request: RequestWithTenant): string | undefined {
  return request.user?.companyId;
}
