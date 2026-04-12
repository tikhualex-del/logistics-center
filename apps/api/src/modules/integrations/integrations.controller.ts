import { Request, Response } from 'express';
import * as integrationService from './integrations.service';
import { validateCreateIntegration, validateUpdateIntegration } from './integrations.validation';
import { AppError } from '../../middlewares/error.middleware';

// ─── Auth context helper ──────────────────────────────────────────────────────

function getActorContext(req: Request): { companyId: string; actorId: string | null } {
  const ctx = req.authContext;
  if (!ctx) throw new AppError(401, 'Unauthorized');
  if (ctx.type === 'user') return { companyId: ctx.companyId, actorId: ctx.userId };
  if (ctx.type === 'impersonation') return { companyId: ctx.companyId, actorId: ctx.adminId };
  throw new AppError(403, 'Forbidden');
}

function getPagination(req: Request): { limit: number; offset: number } {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  return { limit: limit > 0 ? limit : 50, offset: offset >= 0 ? offset : 0 };
}

// ─── Management handlers ──────────────────────────────────────────────────────

export async function listIntegrationsHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const data = await integrationService.listIntegrations(companyId);
  res.json({ success: true, data });
}

export async function createIntegrationHandler(req: Request, res: Response): Promise<void> {
  const { companyId, actorId } = getActorContext(req);
  const input = validateCreateIntegration(req.body);
  const data = await integrationService.createIntegration(companyId, input, { actorId });
  res.status(201).json({ success: true, data });
}

export async function getIntegrationHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const data = await integrationService.getIntegration(companyId, req.params.id as string);
  res.json({ success: true, data });
}

export async function updateIntegrationHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const input = validateUpdateIntegration(req.body);
  const data = await integrationService.updateIntegration(companyId, req.params.id as string, input);
  res.json({ success: true, data });
}

export async function getIntegrationLogsHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const pagination = getPagination(req);
  const data = await integrationService.getIntegrationLogs(companyId, req.params.id as string, pagination);
  res.json({ success: true, data });
}

// ─── Inbound handler ──────────────────────────────────────────────────────────

export async function inboundOrderHandler(req: Request, res: Response): Promise<void> {
  const ctx = req.integrationContext;
  if (!ctx) throw new AppError(500, 'Integration context missing');

  const { httpStatus, order } = await integrationService.processInboundOrder(ctx, req.body);
  res.status(httpStatus).json({ success: true, data: order });
}
