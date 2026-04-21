import { AppError } from '../../middlewares/error.middleware';
import type { CreateCourierInput, UpdateCourierInput } from './courier.types';

const VALID_STATUSES = ['active', 'inactive'] as const;

export function validateCreateCourier(body: unknown): CreateCourierInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.name !== 'string' || !b.name.trim()) throw new AppError(400, 'name is required');
  if (b.name.trim().length > 200) throw new AppError(400, 'name must be 200 characters or fewer');

  if (typeof b.phone !== 'string' || !b.phone.trim()) throw new AppError(400, 'phone is required');
  if (b.phone.trim().length > 50) throw new AppError(400, 'phone must be 50 characters or fewer');

  return { name: b.name.trim(), phone: b.phone.trim() };
}

export function validateUpdateCourier(body: unknown): UpdateCourierInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  const result: UpdateCourierInput = {};

  if ('name' in b) {
    if (typeof b.name !== 'string' || !b.name.trim()) throw new AppError(400, 'name must be a non-empty string');
    if (b.name.trim().length > 200) throw new AppError(400, 'name must be 200 characters or fewer');
    result.name = b.name.trim();
  }

  if ('phone' in b) {
    if (typeof b.phone !== 'string' || !b.phone.trim()) throw new AppError(400, 'phone must be a non-empty string');
    if (b.phone.trim().length > 50) throw new AppError(400, 'phone must be 50 characters or fewer');
    result.phone = b.phone.trim();
  }

  if ('status' in b) {
    if (typeof b.status !== 'string') throw new AppError(400, 'status must be a string');
    if (!VALID_STATUSES.includes(b.status as any)) throw new AppError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
    result.status = b.status;
  }

  if (Object.keys(result).length === 0) throw new AppError(400, 'At least one field must be provided');

  return result;
}
