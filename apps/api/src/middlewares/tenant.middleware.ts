import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Reads companyId from x-company-id header and attaches it to req.tenantContext.
// Does NOT throw — missing/invalid header simply leaves tenantContext unset.
// Use requireTenantContext() in handlers that require a tenant.
export function tenantMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers['x-company-id'];

  if (typeof header === 'string') {
    const value = header.trim();
    if (UUID_REGEX.test(value)) {
      req.tenantContext = { companyId: value, source: 'header:x-company-id' };
    }
    // header present but not a valid UUID — tenantContext stays unset
    // requireTenantContext will produce a clear error
  }

  next();
}

// Call this at the top of any handler that is company-scoped.
// Throws 400 if the header was missing or invalid.
export function requireTenantContext(req: Request): { companyId: string; source: string } {
  if (!req.tenantContext?.companyId) {
    throw new AppError(400, 'x-company-id header is required and must be a valid UUID');
  }
  return req.tenantContext;
}
