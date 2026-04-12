import { AppError } from '../../middlewares/error.middleware';
import type { SeedOwnerInput, CreateAdminInput, UpdateAdminInput } from './platform.types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ADMIN_STATUSES = ['active', 'suspended'] as const;

export function validateSeedOwner(body: unknown): SeedOwnerInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.email !== 'string' || !b.email.trim()) throw new AppError(400, 'email is required');
  if (!EMAIL_RE.test(b.email.trim())) throw new AppError(400, 'email is not a valid email address');

  if (typeof b.fullName !== 'string' || !b.fullName.trim()) throw new AppError(400, 'fullName is required');
  if (b.fullName.trim().length < 2 || b.fullName.trim().length > 100)
    throw new AppError(400, 'fullName must be between 2 and 100 characters');

  if (typeof b.password !== 'string' || !b.password) throw new AppError(400, 'password is required');
  if (b.password.length < 8) throw new AppError(400, 'password must be at least 8 characters');

  return {
    email: b.email.trim().toLowerCase(),
    fullName: b.fullName.trim(),
    password: b.password,
  };
}

export function validateCreateAdmin(body: unknown): CreateAdminInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.email !== 'string' || !b.email.trim()) throw new AppError(400, 'email is required');
  if (!EMAIL_RE.test(b.email.trim())) throw new AppError(400, 'email is not a valid email address');

  if (typeof b.password !== 'string' || !b.password) throw new AppError(400, 'password is required');
  if (b.password.length < 8) throw new AppError(400, 'password must be at least 8 characters');

  return {
    email: b.email.trim().toLowerCase(),
    password: b.password,
  };
}

export function validateUpdateAdmin(body: unknown): UpdateAdminInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.status !== 'string' || !b.status) throw new AppError(400, 'status is required');
  if (!VALID_ADMIN_STATUSES.includes(b.status as any))
    throw new AppError(400, `status must be one of: ${VALID_ADMIN_STATUSES.join(', ')}`);

  return { status: b.status };
}
