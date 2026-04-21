import { Request, Response } from 'express';
import * as usersService from './users.service';
import { validateCreateUser, validateUpdateUser, validateChangeRole } from './users.validation';
import { AppError } from '../../middlewares/error.middleware';

// Returns companyId and a caller identity for use in self-operation guards.
// For impersonation, adminId is used as callerUserId — it will never match a
// tenant user ID, so self-deactivation / last-owner guards behave safely.
function getAuthUser(req: Request): { userId: string; companyId: string } {
  const ctx = req.authContext;
  if (!ctx) throw new AppError(401, 'Unauthorized');
  if (ctx.type === 'user') return { userId: ctx.userId, companyId: ctx.companyId };
  if (ctx.type === 'impersonation') return { userId: ctx.adminId, companyId: ctx.companyId };
  throw new AppError(403, 'Forbidden');
}

export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getAuthUser(req);
  const users = await usersService.listUsers(companyId);
  res.json({ success: true, data: users });
}

export async function getUserHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getAuthUser(req);
  const user = await usersService.getUser(companyId, req.params.id as string);
  res.json({ success: true, data: user });
}

export async function createUserHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getAuthUser(req);
  const input = validateCreateUser(req.body);
  const user = await usersService.createUser(companyId, input);
  res.status(201).json({ success: true, data: user });
}

export async function updateUserHandler(req: Request, res: Response): Promise<void> {
  const { companyId, userId: callerUserId } = getAuthUser(req);
  const input = validateUpdateUser(req.body);
  const user = await usersService.updateUser(companyId, req.params.id as string, input, callerUserId);
  res.json({ success: true, data: user });
}

export async function changeRoleHandler(req: Request, res: Response): Promise<void> {
  const { companyId, userId: callerUserId } = getAuthUser(req);
  const input = validateChangeRole(req.body);
  const user = await usersService.changeRole(companyId, req.params.id as string, input, callerUserId);
  res.json({ success: true, data: user });
}
