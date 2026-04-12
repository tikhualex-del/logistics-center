import { AppError } from '../../../middlewares/error.middleware';
import type { StartImpersonationInput } from './impersonation.types';

export function validateStartImpersonation(body: unknown): StartImpersonationInput {
  if (!body || typeof body !== 'object') return {};
  const b = body as Record<string, unknown>;

  if ('reason' in b) {
    if (typeof b.reason !== 'string') throw new AppError(400, 'reason must be a string');
    if (b.reason.length > 500) throw new AppError(400, 'reason must be 500 characters or fewer');
    return { reason: b.reason.trim() || undefined };
  }

  return {};
}
