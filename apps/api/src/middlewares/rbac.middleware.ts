import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

// Require one of the specified tenant roles.
// Must be used after requireAuth.
// Impersonation context passes any requireRole check — it is owner-equivalent.
// Super admin (non-impersonation) does not have a tenant role — will always get 403 here.
export function requireRole(...roles: string[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const ctx = _req.authContext;
    if (!ctx) throw new AppError(403, 'Forbidden');
    // Impersonation is owner-equivalent: passes all tenant role checks.
    if (ctx.type === 'impersonation') { next(); return; }
    if (ctx.type !== 'user') throw new AppError(403, 'Forbidden');
    if (!roles.includes(ctx.role)) throw new AppError(403, 'Insufficient role');
    next();
  };
}

// Require platform super admin.
// Must be used after requireAuth.
export function requireSuperAdmin() {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const ctx = _req.authContext;
    if (!ctx || ctx.type !== 'super_admin') {
      throw new AppError(403, 'Forbidden');
    }
    next();
  };
}
