import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-ID';
const REQUEST_ID_HEADER_LOWER = REQUEST_ID_HEADER.toLowerCase();

export type RequestWithId = Request & {
  id?: string;
  raw?: { id?: string };
};

export function resolveRequestId(request: RequestWithId): string {
  const headerValue = request.headers[REQUEST_ID_HEADER_LOWER];

  if (typeof headerValue === 'string' && headerValue.trim()) {
    return headerValue.trim();
  }

  if (Array.isArray(headerValue)) {
    const firstHeader = headerValue.find(
      (value) => typeof value === 'string' && value.trim(),
    );
    if (firstHeader) {
      return firstHeader.trim();
    }
  }

  if (typeof request.id === 'string' && request.id.trim()) {
    return request.id.trim();
  }

  if (typeof request.raw?.id === 'string' && request.raw.id.trim()) {
    return request.raw.id.trim();
  }

  return randomUUID();
}

export function assignRequestId(
  request: RequestWithId,
  requestId: string,
): void {
  request.id = requestId;

  if (request.raw) {
    request.raw.id = requestId;
  }
}
