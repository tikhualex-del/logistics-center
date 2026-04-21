import { Request, Response } from 'express';
import * as courierService from './courier.service';
import { validateCreateCourier, validateUpdateCourier } from './courier.validation';
import { AppError } from '../../middlewares/error.middleware';

function getCompanyId(req: Request): string {
  const ctx = req.authContext;
  if (!ctx) throw new AppError(401, 'Unauthorized');
  if (ctx.type === 'user' || ctx.type === 'impersonation') return ctx.companyId;
  throw new AppError(403, 'Forbidden');
}

export async function listCouriersHandler(req: Request, res: Response): Promise<void> {
  const companyId = getCompanyId(req);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const data = await courierService.listCouriers(companyId, { status });
  res.json({ success: true, data });
}

export async function getCourierHandler(req: Request, res: Response): Promise<void> {
  const companyId = getCompanyId(req);
  const data = await courierService.getCourier(companyId, req.params.id as string);
  res.json({ success: true, data });
}

export async function createCourierHandler(req: Request, res: Response): Promise<void> {
  const companyId = getCompanyId(req);
  const input = validateCreateCourier(req.body);
  const data = await courierService.createCourier(companyId, input);
  res.status(201).json({ success: true, data });
}

export async function updateCourierHandler(req: Request, res: Response): Promise<void> {
  const companyId = getCompanyId(req);
  const input = validateUpdateCourier(req.body);
  const data = await courierService.updateCourier(companyId, req.params.id as string, input);
  res.json({ success: true, data });
}
