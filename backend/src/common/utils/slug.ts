import { randomUUID } from 'node:crypto';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function buildUniqueSlug(value: string): string {
  const base = normalizeSlug(value) || 'company';
  return `${base}-${randomUUID().slice(0, 8)}`;
}
