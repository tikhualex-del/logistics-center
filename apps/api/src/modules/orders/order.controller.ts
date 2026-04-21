import { Request, Response } from 'express';
import * as orderService from './order.service';
import {
  validateCreateOrder,
  validateUpdateOrder,
  validateAssignOrder,
  validateCancelOrder,
  validateFailOrder,
} from './order.validation';
import { AppError } from '../../middlewares/error.middleware';
import type { OrderStatus } from './order.types';

// ─── Auth context helper ──────────────────────────────────────────────────────

type ActorContext = { companyId: string; actorType: string; actorId: string | null };

function getActorContext(req: Request): ActorContext {
  const ctx = req.authContext;
  if (!ctx) throw new AppError(401, 'Unauthorized');
  if (ctx.type === 'user') {
    return { companyId: ctx.companyId, actorType: 'user', actorId: ctx.userId };
  }
  if (ctx.type === 'impersonation') {
    return { companyId: ctx.companyId, actorType: 'system', actorId: ctx.adminId };
  }
  throw new AppError(403, 'Forbidden');
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function listOrdersHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const courierId = typeof req.query.courierId === 'string' ? req.query.courierId : undefined;
  const slaStatus = typeof req.query.slaStatus === 'string' ? req.query.slaStatus : undefined;
  const data = await orderService.listOrders(companyId, { status, courierId, slaStatus });
  res.json({ success: true, data });
}

export async function updateOrderHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const input = validateUpdateOrder(req.body);
  const data = await orderService.updateOrder(companyId, req.params.id as string, input);
  res.json({ success: true, data });
}

export async function getOrderHandler(req: Request, res: Response): Promise<void> {
  const { companyId } = getActorContext(req);
  const data = await orderService.getOrder(companyId, req.params.id as string);
  res.json({ success: true, data });
}

export async function createOrderHandler(req: Request, res: Response): Promise<void> {
  const { companyId, actorType, actorId } = getActorContext(req);
  const input = validateCreateOrder(req.body);
  const data = await orderService.createOrder(companyId, input, { actorType, actorId });
  res.status(201).json({ success: true, data });
}

export async function assignOrderHandler(req: Request, res: Response): Promise<void> {
  const { companyId, actorType, actorId } = getActorContext(req);
  const input = validateAssignOrder(req.body);
  const data = await orderService.assignOrder(companyId, req.params.id as string, input, { actorType, actorId });
  res.json({ success: true, data });
}

export async function unassignOrderHandler(req: Request, res: Response): Promise<void> {
  const { companyId, actorType, actorId } = getActorContext(req);
  const data = await orderService.unassignOrder(companyId, req.params.id as string, { actorType, actorId });
  res.json({ success: true, data });
}

export async function pickupOrderHandler(req: Request, res: Response): Promise<void> {
  const { companyId, actorType, actorId } = getActorContext(req);
  const data = await orderService.advanceOrderStatus(companyId, req.params.id as string, 'picked_up', { actorType, actorId });
  res.json({ success: true, data });
}

export async function deliverOrderHandler(req: Request, res: Response): Promise<void> {
  const { companyId, actorType, actorId } = getActorContext(req);
  const data = await orderService.advanceOrderStatus(companyId, req.params.id as string, 'delivered', { actorType, actorId });
  res.json({ success: true, data });
}

export async function failOrderHandler(req: Request, res: Response): Promise<void> {
  const { companyId, actorType, actorId } = getActorContext(req);
  const input = validateFailOrder(req.body);
  const data = await orderService.advanceOrderStatus(companyId, req.params.id as string, 'failed', { actorType, actorId }, input.reason);
  res.json({ success: true, data });
}

export async function cancelOrderHandler(req: Request, res: Response): Promise<void> {
  const { companyId, actorType, actorId } = getActorContext(req);
  const input = validateCancelOrder(req.body);
  const data = await orderService.cancelOrder(companyId, req.params.id as string, input, { actorType, actorId });
  res.json({ success: true, data });
}

export async function requeueOrderHandler(req: Request, res: Response): Promise<void> {
  const { companyId, actorType, actorId } = getActorContext(req);
  const data = await orderService.requeueOrder(companyId, req.params.id as string, { actorType, actorId });
  res.json({ success: true, data });
}
