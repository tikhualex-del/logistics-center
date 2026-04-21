import jwt from 'jsonwebtoken';
import { config } from '../../../lib/config';
import { systemPrisma } from '../../../lib/prisma-system';
import { AppError } from '../../../middlewares/error.middleware';
import type { ImpersonationJwtPayload } from '../../auth/auth.types';
import type {
  StartImpersonationInput,
  StartImpersonationResponse,
  ImpersonationSessionResponse,
} from './impersonation.types';

const IMPERSONATION_EXPIRY_SECONDS = 60 * 60; // 1h — hardcoded, not configurable
const IMPERSONATION_EXPIRY = '1h';

function toSessionResponse(row: {
  id: string;
  superAdminId: string;
  targetCompanyId: string;
  startedAt: Date;
  endedAt: Date | null;
  reason: string | null;
}): ImpersonationSessionResponse {
  return {
    id: row.id,
    superAdminId: row.superAdminId,
    targetCompanyId: row.targetCompanyId,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    reason: row.reason,
  };
}

export async function startImpersonation(
  adminId: string,
  companyId: string,
  input: StartImpersonationInput,
): Promise<StartImpersonationResponse> {
  // Verify company exists and is active.
  const company = await systemPrisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, status: true },
  });
  if (!company) throw new AppError(404, 'Company not found');
  if (company.status !== 'active') {
    throw new AppError(403, 'Cannot impersonate a non-active company');
  }

  // One active session per super admin per target company.
  const existing = await systemPrisma.platformImpersonationSession.findFirst({
    where: { superAdminId: adminId, targetCompanyId: companyId, endedAt: null },
  });
  if (existing) {
    throw new AppError(409, 'An active impersonation session already exists for this company');
  }

  const session = await systemPrisma.platformImpersonationSession.create({
    data: {
      superAdminId: adminId,
      targetCompanyId: companyId,
      reason: input.reason ?? null,
    },
  });

  const expiresAt = new Date(Date.now() + IMPERSONATION_EXPIRY_SECONDS * 1000);

  const payload: ImpersonationJwtPayload = {
    sub: adminId,
    sessionId: session.id,
    companyId,
    type: 'impersonation',
  };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: IMPERSONATION_EXPIRY });

  await systemPrisma.platformAuditEvent.create({
    data: {
      actorType: 'super_admin',
      actorId: adminId,
      action: 'impersonation_started',
      targetType: 'company',
      targetId: companyId,
      metadata: { sessionId: session.id },
    },
  });

  return { token, sessionId: session.id, companyId, expiresAt };
}

export async function endImpersonation(
  sessionId: string,
  callerAdminId: string,
): Promise<void> {
  const session = await systemPrisma.platformImpersonationSession.findUnique({
    where: { id: sessionId },
    select: { id: true, superAdminId: true, targetCompanyId: true, endedAt: true },
  });
  if (!session) throw new AppError(404, 'Impersonation session not found');
  if (session.endedAt !== null) throw new AppError(409, 'Impersonation session is already ended');

  await systemPrisma.platformImpersonationSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });

  await systemPrisma.platformAuditEvent.create({
    data: {
      actorType: 'super_admin',
      actorId: callerAdminId,
      action: 'impersonation_ended',
      targetType: 'company',
      targetId: session.targetCompanyId,
      metadata: {
        sessionId,
        closedBy: callerAdminId,
        originalAdminId: session.superAdminId,
      },
    },
  });
}

export async function listImpersonationSessions(
  companyId?: string,
): Promise<ImpersonationSessionResponse[]> {
  const rows = await systemPrisma.platformImpersonationSession.findMany({
    where: companyId ? { targetCompanyId: companyId } : undefined,
    select: {
      id: true,
      superAdminId: true,
      targetCompanyId: true,
      startedAt: true,
      endedAt: true,
      reason: true,
    },
    orderBy: { startedAt: 'desc' },
  });
  return rows.map(toSessionResponse);
}
