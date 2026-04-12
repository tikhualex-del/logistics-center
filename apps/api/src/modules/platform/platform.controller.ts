import { Request, Response } from 'express';
import * as platformService from './platform.service';
import { validateSeedOwner, validateCreateAdmin, validateUpdateAdmin } from './platform.validation';
import { AppError } from '../../middlewares/error.middleware';

function getCallerAdminId(req: Request): string {
  const ctx = req.authContext;
  if (!ctx || ctx.type !== 'super_admin') throw new AppError(401, 'Unauthorized');
  return ctx.adminId;
}

export async function seedOwnerHandler(req: Request, res: Response): Promise<void> {
  const input = validateSeedOwner(req.body);
  const user = await platformService.seedOwner(req.params.id as string, input);
  res.status(201).json({ success: true, data: user });
}

export async function listTenantUsersHandler(req: Request, res: Response): Promise<void> {
  const users = await platformService.listTenantUsers(req.params.id as string);
  res.json({ success: true, data: users });
}

export async function listAdminsHandler(_req: Request, res: Response): Promise<void> {
  const admins = await platformService.listAdmins();
  res.json({ success: true, data: admins });
}

export async function createAdminHandler(req: Request, res: Response): Promise<void> {
  const input = validateCreateAdmin(req.body);
  const admin = await platformService.createAdmin(input);
  res.status(201).json({ success: true, data: admin });
}

export async function getAdminHandler(req: Request, res: Response): Promise<void> {
  const admin = await platformService.getAdmin(req.params.id as string);
  res.json({ success: true, data: admin });
}

export async function updateAdminHandler(req: Request, res: Response): Promise<void> {
  const callerAdminId = getCallerAdminId(req);
  const input = validateUpdateAdmin(req.body);
  const admin = await platformService.updateAdmin(req.params.id as string, input, callerAdminId);
  res.json({ success: true, data: admin });
}
