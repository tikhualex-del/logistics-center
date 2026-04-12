import { AppError } from '../../middlewares/error.middleware';
import { COMPANY_STATUSES } from './company.constants';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateIdParam(params: unknown): void {
  const id = (params as Record<string, unknown>).id;
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    throw new AppError(400, 'Validation error', ['Field "id" must be a valid UUID']);
  }
}

export function validateCreateCompanyInput(body: unknown): void {
  const data = body as Record<string, unknown>;
  const errors: string[] = [];

  const requiredStrings = [
    'name', 'slug', 'timezone', 'defaultCurrency', 'language',
    'country', 'contactEmail', 'contactPhone', 'planId',
  ] as const;

  for (const field of requiredStrings) {
    const value = data[field];
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`Field "${field}" must not be empty`);
      continue;
    }
    if (field === 'slug' && !SLUG_REGEX.test(value)) {
      errors.push('Field "slug" must contain only lowercase letters, numbers and hyphens');
    }
    if (field === 'contactEmail' && !EMAIL_REGEX.test(value)) {
      errors.push('Field "contactEmail" must be a valid email');
    }
  }

  if (errors.length > 0) throw new AppError(400, 'Validation error', errors);
}

export function validateUpdateCompanyInput(body: unknown): void {
  const data = body as Record<string, unknown>;
  const errors: string[] = [];

  const allowedFields = new Set([
    'name', 'timezone', 'defaultCurrency', 'language',
    'country', 'contactEmail', 'contactPhone', 'planId',
  ]);

  // Reject unknown and disallowed fields
  for (const key of Object.keys(data)) {
    if (!allowedFields.has(key)) {
      errors.push(`Field "${key}" is not allowed in update`);
    }
  }

  // Validate each provided allowed field
  let validFieldCount = 0;
  for (const field of allowedFields) {
    if (!(field in data)) continue;
    const value = data[field];
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`Field "${field}" must not be empty`);
    } else {
      if (field === 'contactEmail' && !EMAIL_REGEX.test(value)) {
        errors.push('Field "contactEmail" must be a valid email');
      }
      validFieldCount++;
    }
  }

  if (validFieldCount === 0 && errors.length === 0) {
    errors.push('At least one valid field must be provided');
  }

  if (errors.length > 0) throw new AppError(400, 'Validation error', errors);
}

export function validateChangeCompanyStatusInput(body: unknown): void {
  const data = body as Record<string, unknown>;
  const errors: string[] = [];

  if (!data.status || typeof data.status !== 'string') {
    errors.push('Field "status" is required');
  } else if (!COMPANY_STATUSES.includes(data.status as never)) {
    errors.push(`Field "status" must be one of: ${COMPANY_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) throw new AppError(400, 'Validation error', errors);
}
