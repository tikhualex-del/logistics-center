import { AppError } from '../../middlewares/error.middleware';
import type { CreateUserInput, UpdateUserInput, ChangeRoleInput } from './users.types';

const VALID_ROLES = ['owner', 'dispatcher', 'viewer'] as const;
const VALID_UPDATE_STATUSES = ['active', 'suspended', 'removed'] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCreateUser(body: unknown): CreateUserInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.email !== 'string' || !b.email.trim()) throw new AppError(400, 'email is required');
  if (!EMAIL_RE.test(b.email.trim())) throw new AppError(400, 'email is not a valid email address');

  if (typeof b.fullName !== 'string' || !b.fullName.trim()) throw new AppError(400, 'fullName is required');
  if (b.fullName.trim().length < 2 || b.fullName.trim().length > 100)
    throw new AppError(400, 'fullName must be between 2 and 100 characters');

  if (typeof b.password !== 'string' || !b.password) throw new AppError(400, 'password is required');
  if (b.password.length < 8) throw new AppError(400, 'password must be at least 8 characters');

  if (typeof b.role !== 'string' || !b.role) throw new AppError(400, 'role is required');
  if (!VALID_ROLES.includes(b.role as any)) throw new AppError(400, `role must be one of: ${VALID_ROLES.join(', ')}`);

  return {
    email: b.email.trim().toLowerCase(),
    fullName: b.fullName.trim(),
    password: b.password,
    role: b.role,
  };
}

export function validateUpdateUser(body: unknown): UpdateUserInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  const result: UpdateUserInput = {};

  if ('fullName' in b) {
    if (typeof b.fullName !== 'string' || !b.fullName.trim())
      throw new AppError(400, 'fullName must be a non-empty string');
    if (b.fullName.trim().length < 2 || b.fullName.trim().length > 100)
      throw new AppError(400, 'fullName must be between 2 and 100 characters');
    result.fullName = b.fullName.trim();
  }

  if ('status' in b) {
    if (typeof b.status !== 'string') throw new AppError(400, 'status must be a string');
    if (!VALID_UPDATE_STATUSES.includes(b.status as any))
      throw new AppError(400, `status must be one of: ${VALID_UPDATE_STATUSES.join(', ')}`);
    result.status = b.status;
  }

  if (Object.keys(result).length === 0)
    throw new AppError(400, 'At least one of fullName or status must be provided');

  return result;
}

export function validateChangeRole(body: unknown): ChangeRoleInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.role !== 'string' || !b.role) throw new AppError(400, 'role is required');
  if (!VALID_ROLES.includes(b.role as any)) throw new AppError(400, `role must be one of: ${VALID_ROLES.join(', ')}`);

  return { role: b.role };
}
