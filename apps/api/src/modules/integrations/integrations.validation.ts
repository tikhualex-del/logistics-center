import { AppError } from '../../middlewares/error.middleware';
import type { CreateIntegrationInput, UpdateIntegrationInput, InboundOrderInput } from './integrations.types';

// externalSource: lowercase alphanumeric + hyphens, no leading/trailing hyphens.
// Examples: "shopify-main", "wms-central", "marketplace-amazon"
const EXTERNAL_SOURCE_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export function validateCreateIntegration(body: unknown): CreateIntegrationInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.name !== 'string' || !b.name.trim())
    throw new AppError(400, 'name is required');
  if (b.name.trim().length > 100)
    throw new AppError(400, 'name must be 100 characters or fewer');

  if (typeof b.externalSource !== 'string' || !b.externalSource.trim())
    throw new AppError(400, 'externalSource is required');
  const src = b.externalSource.trim();
  if (src.length > 64)
    throw new AppError(400, 'externalSource must be 64 characters or fewer');
  if (!EXTERNAL_SOURCE_RE.test(src))
    throw new AppError(400, 'externalSource must be lowercase alphanumeric with hyphens (no leading/trailing hyphens)');

  return { name: b.name.trim(), externalSource: src };
}

export function validateUpdateIntegration(body: unknown): UpdateIntegrationInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;
  const result: UpdateIntegrationInput = {};

  if ('name' in b && b.name !== undefined) {
    if (typeof b.name !== 'string' || !b.name.trim())
      throw new AppError(400, 'name must be a non-empty string');
    if (b.name.trim().length > 100)
      throw new AppError(400, 'name must be 100 characters or fewer');
    result.name = b.name.trim();
  }

  if ('status' in b && b.status !== undefined) {
    if (b.status !== 'active' && b.status !== 'inactive')
      throw new AppError(400, 'status must be active or inactive');
    result.status = b.status as string;
  }

  if (!result.name && !result.status)
    throw new AppError(400, 'At least one of name or status must be provided');

  return result;
}

export function validateInboundOrder(body: unknown): InboundOrderInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Request body is required');
  const b = body as Record<string, unknown>;

  if (typeof b.externalId !== 'string' || !b.externalId.trim())
    throw new AppError(400, 'externalId is required');
  if (b.externalId.trim().length > 255)
    throw new AppError(400, 'externalId must be 255 characters or fewer');

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

  const result: InboundOrderInput = {
    externalId: b.externalId.trim(),
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
      (result as unknown as Record<string, unknown>)[field] = b[field];
    }
  }

  return result;
}

// Safely extract externalId from an unvalidated payload for logging purposes.
export function extractExternalId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const val = (body as Record<string, unknown>).externalId;
  if (typeof val === 'string' && val.trim()) return val.trim().substring(0, 255);
  return null;
}
