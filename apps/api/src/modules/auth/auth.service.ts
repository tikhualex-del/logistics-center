import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../lib/config';
import { systemPrisma } from '../../lib/prisma-system';
import { getTenantPrisma } from '../../lib/prisma-tenant';
import { AppError } from '../../middlewares/error.middleware';
import type {
  LoginInput,
  PlatformLoginInput,
  LoginResult,
  PlatformLoginResult,
  UserJwtPayload,
  SuperAdminJwtPayload,
} from './auth.types';

// ─── Tenant user login ────────────────────────────────────────────────────────

export async function login(input: LoginInput): Promise<LoginResult> {
  // Step 1: Resolve company from slug
  const company = await systemPrisma.company.findUnique({
    where: { slug: input.companySlug },
    select: { id: true, status: true },
  });
  if (!company || company.status !== 'active') {
    throw new AppError(401, 'Invalid credentials');
  }

  const tenantPrisma = getTenantPrisma(company.id);

  // Step 2: Find user by email
  const user = await tenantPrisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, fullName: true, passwordHash: true, status: true },
  });
  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Step 3: Verify password
  const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Step 4: Check user status
  if (user.status !== 'active') {
    throw new AppError(401, 'Invalid credentials');
  }

  // Step 5: Verify exactly one active role link
  const roleLinks = await tenantPrisma.userRoleLink.findMany({
    where: { userId: user.id, status: 'active' },
    include: { role: true },
  });

  if (roleLinks.length === 0) {
    throw new AppError(403, 'No active role assigned');
  }
  if (roleLinks.length > 1) {
    throw new AppError(500, 'Data integrity error: multiple active roles found for user');
  }

  const role = roleLinks[0].role;

  // Step 6: Create session
  const jwtId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + parseDuration(config.jwtExpiresIn));

  const session = await tenantPrisma.userSession.create({
    data: {
      userId: user.id,
      companyId: company.id,
      jwtId,
      expiresAt,
    },
  });

  // Step 7: Sign JWT
  const payload: UserJwtPayload = {
    sub: user.id,
    jti: jwtId,
    companyId: company.id,
    role: role.name,
    type: 'user',
  };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] });

  // Step 8: Write audit access event
  await tenantPrisma.auditAccessEvent.create({
    data: {
      companyId: company.id,
      userId: user.id,
      sessionId: session.id,
      action: 'login',
    },
  });

  await tenantPrisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    token,
    user: { id: user.id, email: user.email, fullName: user.fullName, role: role.name },
  };
}

// ─── Tenant user logout ───────────────────────────────────────────────────────

export async function logout(companyId: string, sessionId: string, userId: string): Promise<void> {
  const tenantPrisma = getTenantPrisma(companyId);

  await tenantPrisma.userSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });

  await tenantPrisma.auditAccessEvent.create({
    data: {
      companyId,
      userId,
      sessionId,
      action: 'logout',
    },
  });
}

// ─── Platform super admin login ───────────────────────────────────────────────

export async function platformLogin(input: PlatformLoginInput): Promise<PlatformLoginResult> {
  const admin = await systemPrisma.platformSuperAdmin.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, passwordHash: true, status: true },
  });
  if (!admin) {
    throw new AppError(401, 'Invalid credentials');
  }

  const passwordValid = await bcrypt.compare(input.password, admin.passwordHash);
  if (!passwordValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  if (admin.status !== 'active') {
    throw new AppError(401, 'Invalid credentials');
  }

  const jwtId = crypto.randomUUID();

  const payload: SuperAdminJwtPayload = {
    sub: admin.id,
    jti: jwtId,
    type: 'super_admin',
  };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] });

  await systemPrisma.platformAuditEvent.create({
    data: {
      actorType: 'super_admin',
      actorId: admin.id,
      action: 'super_admin_login',
    },
  });

  return {
    token,
    admin: { id: admin.id, email: admin.email },
  };
}

// ─── Platform super admin logout ─────────────────────────────────────────────

// Super admin logout is stateless in Wave 0-1.
// The JWT is not revoked server-side — it remains valid until expiry.
// Audit event is written for observability only.
// Server-side super admin session revocation is a Wave 2+ concern.
export async function platformLogout(adminId: string): Promise<void> {
  await systemPrisma.platformAuditEvent.create({
    data: {
      actorType: 'super_admin',
      actorId: adminId,
      action: 'super_admin_logout',
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Parses simple duration strings like '7d', '1h', '30m' to milliseconds.
// Only covers what we need for JWT expiry math.
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
}
