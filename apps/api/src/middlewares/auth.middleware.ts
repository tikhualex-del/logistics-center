import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../lib/config';
import { systemPrisma } from '../lib/prisma-system';
import { getTenantPrisma } from '../lib/prisma-tenant';
import { AppError } from './error.middleware';
import type { JwtPayload } from '../modules/auth/auth.types';

// Verifies the Bearer token and populates req.authContext.
// Three checks for tenant users (in order):
//   1. JWT signature + expiry
//   2. UserSession exists and is not revoked
//   3. User status is active
// For super admin: JWT signature + expiry only (stateless in Wave 0-1).
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Authorization header missing or malformed');
  }

  const token = header.slice(7);
  let payload: JwtPayload;

  try {
    payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }

  if (payload.type === 'super_admin') {
    req.authContext = { type: 'super_admin', adminId: payload.sub };
    next();
    return;
  }

  // Impersonation token — server-side session check only (no tenant user record).
  if (payload.type === 'impersonation') {
    const impSession = await systemPrisma.platformImpersonationSession.findUnique({
      where: { id: payload.sessionId },
      select: { id: true, endedAt: true },
    });

    if (!impSession) throw new AppError(401, 'Impersonation session not found');
    if (impSession.endedAt !== null) throw new AppError(401, 'Impersonation session has ended');

    req.authContext = {
      type: 'impersonation',
      adminId: payload.sub,
      companyId: payload.companyId,
      sessionId: impSession.id,
    };
    next();
    return;
  }

  // Tenant user — three checks
  const tenantPrisma = getTenantPrisma(payload.companyId);

  // Check 2: session validity
  const session = await tenantPrisma.userSession.findUnique({
    where: { jwtId: payload.jti },
    select: { id: true, revokedAt: true, expiresAt: true },
  });

  if (!session) {
    throw new AppError(401, 'Session not found');
  }
  if (session.revokedAt !== null) {
    throw new AppError(401, 'Session revoked');
  }
  if (session.expiresAt < new Date()) {
    throw new AppError(401, 'Session expired');
  }

  // Check 3: user status
  const user = await tenantPrisma.user.findUnique({
    where: { id: payload.sub },
    select: { status: true },
  });

  if (!user) {
    throw new AppError(401, 'User not found');
  }
  if (user.status !== 'active') {
    throw new AppError(401, 'User account is not active');
  }

  req.authContext = {
    type: 'user',
    userId: payload.sub,
    companyId: payload.companyId,
    role: payload.role,
    sessionId: session.id,
  };

  next();
}
