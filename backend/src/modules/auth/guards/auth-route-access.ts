import type { Request } from 'express';

const VERSION_SEGMENT_PATTERN = /^v\d+$/i;

export function normalizeGuardPath(request: Request): string {
  const rawPath = request.path || request.url || '/';
  const pathWithoutQuery = rawPath.split('?')[0] || '/';
  const segments = pathWithoutQuery
    .split('/')
    .filter(Boolean)
    .filter((segment) => segment.toLowerCase() !== 'api')
    .filter((segment) => !VERSION_SEGMENT_PATTERN.test(segment));

  return segments.length ? `/${segments.join('/')}` : '/';
}

export function shouldBypassAccessGuards(request: Request): boolean {
  const normalizedPath = normalizeGuardPath(request);
  return normalizedPath === '/docs' || normalizedPath.startsWith('/docs/');
}
