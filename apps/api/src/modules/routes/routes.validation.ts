import { AppError } from '../../middlewares/error.middleware';
import type {
  CreateRouteInput,
  UpdateRouteInput,
  AddOrderToRouteInput,
  ReorderRouteOrderInput,
  AssignRouteInput,
} from './routes.types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateScheduledDate(value: unknown, fieldName = 'scheduledDate'): string {
  if (typeof value !== 'string' || !DATE_RE.test(value))
    throw new AppError(400, `${fieldName} must be a date in YYYY-MM-DD format`);
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new AppError(400, `${fieldName} is not a valid date`);
  return value;
}

export function validateCreateRoute(body: unknown): CreateRouteInput {
  if (!body || typeof body !== 'object') return {};
  const b = body as Record<string, unknown>;
  const result: CreateRouteInput = {};

  if ('scheduledDate' in b && b.scheduledDate !== undefined && b.scheduledDate !== null) {
    result.scheduledDate = validateScheduledDate(b.scheduledDate);
  }

  if ('notes' in b && b.notes !== undefined && b.notes !== null) {
    if (typeof b.notes !== 'string') throw new AppError(400, 'notes must be a string');
    if (b.notes.length > 1000) throw new AppError(400, 'notes must be 1000 characters or fewer');
    result.notes = b.notes;
  }

  return result;
}

export function validateUpdateRoute(body: unknown): UpdateRouteInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;
  const result: UpdateRouteInput = {};
  let hasField = false;

  if ('scheduledDate' in b) {
    hasField = true;
    if (b.scheduledDate === null || b.scheduledDate === undefined) {
      result.scheduledDate = null;
    } else {
      result.scheduledDate = validateScheduledDate(b.scheduledDate);
    }
  }

  if ('notes' in b) {
    hasField = true;
    if (b.notes === null || b.notes === undefined) {
      result.notes = null;
    } else {
      if (typeof b.notes !== 'string') throw new AppError(400, 'notes must be a string');
      if (b.notes.length > 1000) throw new AppError(400, 'notes must be 1000 characters or fewer');
      result.notes = b.notes;
    }
  }

  if (!hasField) throw new AppError(400, 'At least one of scheduledDate or notes must be provided');
  return result;
}

export function validateAddOrderToRoute(body: unknown): AddOrderToRouteInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.orderId !== 'string' || !b.orderId)
    throw new AppError(400, 'orderId is required');
  if (!UUID_RE.test(b.orderId))
    throw new AppError(400, 'orderId must be a valid UUID');

  const result: AddOrderToRouteInput = { orderId: b.orderId };

  if ('sequence' in b && b.sequence !== undefined) {
    if (typeof b.sequence !== 'number' || !Number.isInteger(b.sequence) || b.sequence < 1)
      throw new AppError(400, 'sequence must be a positive integer');
    result.sequence = b.sequence;
  }

  return result;
}

export function validateReorderRouteOrder(body: unknown): ReorderRouteOrderInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.sequence !== 'number' || !Number.isInteger(b.sequence) || b.sequence < 1)
    throw new AppError(400, 'sequence must be a positive integer');

  return { sequence: b.sequence };
}

export function validateAssignRoute(body: unknown): AssignRouteInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.courierId !== 'string' || !b.courierId)
    throw new AppError(400, 'courierId is required');
  if (!UUID_RE.test(b.courierId))
    throw new AppError(400, 'courierId must be a valid UUID');

  return { courierId: b.courierId };
}
