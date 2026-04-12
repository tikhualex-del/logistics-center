import { Request, Response } from 'express';
import * as impersonationService from './impersonation.service';
import { validateStartImpersonation } from './impersonation.validation';
import { AppError } from '../../../middlewares/error.middleware';

function getCallerAdminId(req: Request): string {
  const ctx = req.authContext;
  if (!ctx || ctx.type !== 'super_admin') throw new AppError(401, 'Unauthorized');
  return ctx.adminId;
}

export async function startImpersonationHandler(req: Request, res: Response): Promise<void> {
  const adminId = getCallerAdminId(req);
  const input = validateStartImpersonation(req.body);
  const result = await impersonationService.startImpersonation(
    adminId,
    req.params.companyId as string,
    input,
  );
  res.status(201).json({ success: true, data: result });
}

export async function endImpersonationHandler(req: Request, res: Response): Promise<void> {
  const adminId = getCallerAdminId(req);
  await impersonationService.endImpersonation(req.params.sessionId as string, adminId);
  res.status(204).send();
}

export async function listImpersonationSessionsHandler(req: Request, res: Response): Promise<void> {
  const companyId = typeof req.query.companyId === 'string' ? req.query.companyId : undefined;
  const sessions = await impersonationService.listImpersonationSessions(companyId);
  res.json({ success: true, data: sessions });
}
