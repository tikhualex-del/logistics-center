import { Request, Response } from 'express';
import * as authService from './auth.service';
import { AppError } from '../../middlewares/error.middleware';
import { systemPrisma } from '../../lib/prisma-system';
import { getTenantPrisma } from '../../lib/prisma-tenant';

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  res.status(200).json({ success: true, data: result });
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  const ctx = req.authContext;
  if (!ctx || ctx.type !== 'user') throw new AppError(401, 'Unauthorized');

  await authService.logout(ctx.companyId, ctx.sessionId, ctx.userId);
  res.status(204).send();
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  const ctx = req.authContext;
  if (!ctx) throw new AppError(401, 'Unauthorized');

  if (ctx.type === 'user') {
    const user = await getTenantPrisma(ctx.companyId).user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, email: true, fullName: true, status: true },
    });
    if (!user) throw new AppError(401, 'User not found');

    res.json({ success: true, data: { type: 'user', ...user, role: ctx.role, companyId: ctx.companyId } });
    return;
  }

  if (ctx.type === 'impersonation') {
    res.json({ success: true, data: { type: 'impersonation', adminId: ctx.adminId, companyId: ctx.companyId, sessionId: ctx.sessionId } });
    return;
  }

  const admin = await systemPrisma.platformSuperAdmin.findUnique({
    where: { id: ctx.adminId },
    select: { id: true, email: true, status: true },
  });
  if (!admin) throw new AppError(401, 'Admin not found');

  res.json({ success: true, data: { type: 'super_admin', ...admin } });
}

export async function platformLoginHandler(req: Request, res: Response): Promise<void> {
  const result = await authService.platformLogin(req.body);
  res.status(200).json({ success: true, data: result });
}

export async function platformLogoutHandler(req: Request, res: Response): Promise<void> {
  const ctx = req.authContext;
  if (!ctx || ctx.type !== 'super_admin') throw new AppError(401, 'Unauthorized');

  await authService.platformLogout(ctx.adminId);
  res.status(204).send();
}
