import { AppError } from '../../middlewares/error.middleware';
import type { CreateOrderInput, UpdateOrderInput, AssignOrderInput, CancelOrderInput, FailOrderInput } from './order.types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateCreateOrder(body: unknown): CreateOrderInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.customerName !== 'string' || !b.customerName.trim())
    throw new AppError(400, 'customerName is required');
  if (b.customerName.trim().length > 200)
    throw new AppError(400, 'customerName must be 200 characters or fewer');

  if (typeof b.customerPhone !== 'string' || !b.customerPhone.trim())
    throw new AppError(400, 'customerPhone is required');
  if (b.customerPhone.trim().length > 50)
    throw new AppError(400, 'customerPhone must be 50 characters or fewer');

  if (typeof b.pickupAddress !== 'string' || !b.pickupAddress.trim())
    throw new AppError(400, 'pickupAddress is required');
  if (b.pickupAddress.trim().length > 500)
    throw new AppError(400, 'pickupAddress must be 500 characters or fewer');

  if (typeof b.deliveryAddress !== 'string' || !b.deliveryAddress.trim())
    throw new AppError(400, 'deliveryAddress is required');
  if (b.deliveryAddress.trim().length > 500)
    throw new AppError(400, 'deliveryAddress must be 500 characters or fewer');

  const result: CreateOrderInput = {
    customerName: b.customerName.trim(),
    customerPhone: b.customerPhone.trim(),
    pickupAddress: b.pickupAddress.trim(),
    deliveryAddress: b.deliveryAddress.trim(),
  };

  if ('scheduledPickupAt' in b && b.scheduledPickupAt !== undefined) {
    const d = new Date(b.scheduledPickupAt as string);
    if (isNaN(d.getTime())) throw new AppError(400, 'scheduledPickupAt must be a valid ISO date');
    result.scheduledPickupAt = d;
  }

  if ('deadline' in b && b.deadline !== undefined) {
    const d = new Date(b.deadline as string);
    if (isNaN(d.getTime())) throw new AppError(400, 'deadline must be a valid ISO date');
    result.deadline = d;
  }

  if ('notes' in b && b.notes !== undefined) {
    if (typeof b.notes !== 'string') throw new AppError(400, 'notes must be a string');
    if (b.notes.length > 1000) throw new AppError(400, 'notes must be 1000 characters or fewer');
    result.notes = b.notes;
  }

  for (const field of ['pickupLat', 'pickupLng', 'deliveryLat', 'deliveryLng'] as const) {
    if (field in b && b[field] !== undefined) {
      if (typeof b[field] !== 'number') throw new AppError(400, `${field} must be a number`);
      (result as any)[field] = b[field];
    }
  }

  return result;
}

export function validateUpdateOrder(body: unknown): UpdateOrderInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (!('deadline' in b)) {
    throw new AppError(400, 'No recognized fields to update. Supported fields: deadline');
  }

  if (b.deadline === null || b.deadline === undefined) {
    return { deadline: null };
  }

  const d = new Date(b.deadline as string);
  if (isNaN(d.getTime())) throw new AppError(400, 'deadline must be a valid ISO date or null');
  return { deadline: d };
}

export function validateAssignOrder(body: unknown): AssignOrderInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.courierId !== 'string' || !b.courierId)
    throw new AppError(400, 'courierId is required');
  if (!UUID_RE.test(b.courierId))
    throw new AppError(400, 'courierId must be a valid UUID');

  return { courierId: b.courierId };
}

export function validateCancelOrder(body: unknown): CancelOrderInput {
  if (!body || typeof body !== 'object') return {};
  const b = body as Record<string, unknown>;

  if ('reason' in b && b.reason !== undefined) {
    if (typeof b.reason !== 'string') throw new AppError(400, 'reason must be a string');
    if (b.reason.length > 500) throw new AppError(400, 'reason must be 500 characters or fewer');
    return { reason: b.reason.trim() || undefined };
  }

  return {};
}

export function validateFailOrder(body: unknown): FailOrderInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.reason !== 'string' || !b.reason.trim())
    throw new AppError(400, 'reason is required for failed delivery');
  if (b.reason.trim().length > 500)
    throw new AppError(400, 'reason must be 500 characters or fewer');

  return { reason: b.reason.trim() };
}
