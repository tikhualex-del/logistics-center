import { Request, Response } from 'express';
import * as routeService from './routes.service';
import {
  validateCreateRoute,
  validateUpdateRoute,
  validateAddOrderToRoute,
  validateReorderRouteOrder,
  validateAssignRoute,
} from './routes.validation';
import { AppError } from '../../middlewares/error.middleware';

// ─── Auth context helper ──────────────────────────────────────────────────────

type ActorContext = { companyId: string; actorType: string; actorId: string | null };

function getActorContext(req: Request): ActorContext {
  const ctx = req.authContext;
  if (!ctx) throw new AppError(401, 'Unauthorized');
  if (ctx.type === 'user') return { companyId: ctx.companyId, actorType: 'user', actorId: ctx.userId };
  if (ctx.type === 'impersonation') return { companyId: ctx.companyId, actorType: 'system', actorId: ctx.adminId };
  throw new AppError(403, 'Forbidden');
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function listRoutesHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const courierId = typeof req.query.courierId === 'string' ? req.query.courierId : undefined;
  const scheduledDate = typeof req.query.scheduledDate === 'string' ? req.query.scheduledDate : undefined;
  const data = await routeService.listRoutes(companyId, { status, courierId, scheduledDate });
  res.json({ success: true, data });
}

export async function createRouteHandler(req: Request, res: Response): Promise<void> {
  const { companyId, actorType, actorId } = getActorContext(req);
  const input = validateCreateRoute(req.body);
  const data = await routeService.createRoute(companyId, input, { actorType, actorId });
  res.status(201).json({ success: true, data });
}

export async function getRouteHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const data = await routeService.getRoute(companyId, req.params.id as string);
  res.json({ success: true, data });
}

export async function updateRouteHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const input = validateUpdateRoute(req.body);
  const data = await routeService.updateRoute(companyId, req.params.id as string, input);
  res.json({ success: true, data });
}

export async function addOrderToRouteHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const input = validateAddOrderToRoute(req.body);
  const data = await routeService.addOrderToRoute(companyId, req.params.id as string, input);
  res.json({ success: true, data });
}

export async function removeOrderFromRouteHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const data = await routeService.removeOrderFromRoute(
    companyId,
    req.params.id as string,
    req.params.orderId as string,
  );
  res.json({ success: true, data });
}

export async function reorderRouteOrderHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const input = validateReorderRouteOrder(req.body);
  const data = await routeService.reorderRouteOrder(
    companyId,
    req.params.id as string,
    req.params.orderId as string,
    input,
  );
  res.json({ success: true, data });
}

export async function assignRouteHandler(req: Request, res: Response): Promise<void> {
  const { companyId, actorType, actorId } = getActorContext(req);
  const input = validateAssignRoute(req.body);
  const data = await routeService.assignRoute(
    companyId,
    req.params.id as string,
    input,
    { actorType, actorId },
  );
  res.json({ success: true, data });
}

export async function completeRouteHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const data = await routeService.completeRoute(companyId, req.params.id as string);
  res.json({ success: true, data });
}

export async function cancelRouteHandler(req: Request, res: Response): Promise<void> {
  const { companyId, actorType, actorId } = getActorContext(req);
  const data = await routeService.cancelRoute(
    companyId,
    req.params.id as string,
    { actorType, actorId },
  );
  res.json({ success: true, data });
}
