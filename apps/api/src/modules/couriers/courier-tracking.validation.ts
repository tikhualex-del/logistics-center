import { AppError } from '../../middlewares/error.middleware';
import { COURIER_TRACKING_STATUSES } from './courier-status.constants';
import { LOCATION_SOURCES } from './courier-tracking.types';

export function validateCourierTrackingInput(body: unknown): void {
  const data = body as Record<string, unknown>;
  const errors: string[] = [];

  const allowedFields = new Set(['lat', 'lng', 'lastLocationAt', 'locationSource', 'trackingStatus']);

  for (const key of Object.keys(data)) {
    if (!allowedFields.has(key)) {
      errors.push(`Field "${key}" is not allowed`);
    }
  }

  // lat and lng must always come together — a partial coordinate is meaningless.
  const hasLat = 'lat' in data && data.lat !== undefined;
  const hasLng = 'lng' in data && data.lng !== undefined;

  if (hasLat !== hasLng) {
    errors.push('Fields "lat" and "lng" must be provided together');
  }

  if (hasLat) {
    if (typeof data.lat !== 'number' || data.lat < -90 || data.lat > 90) {
      errors.push('Field "lat" must be a number between -90 and 90');
    }
  }

  if (hasLng) {
    if (typeof data.lng !== 'number' || data.lng < -180 || data.lng > 180) {
      errors.push('Field "lng" must be a number between -180 and 180');
    }
  }

  if ('lastLocationAt' in data && data.lastLocationAt !== undefined) {
    if (typeof data.lastLocationAt !== 'string' || isNaN(Date.parse(data.lastLocationAt))) {
      errors.push('Field "lastLocationAt" must be a valid ISO date string');
    }
  }

  if ('locationSource' in data && data.locationSource !== undefined) {
    if (!(LOCATION_SOURCES as readonly string[]).includes(data.locationSource as string)) {
      errors.push(`Field "locationSource" must be one of: ${LOCATION_SOURCES.join(', ')}`);
    }
  }

  if ('trackingStatus' in data && data.trackingStatus !== undefined) {
    if (!(COURIER_TRACKING_STATUSES as readonly string[]).includes(data.trackingStatus as string)) {
      errors.push(`Field "trackingStatus" must be one of: ${COURIER_TRACKING_STATUSES.join(', ')}`);
    }
  }

  const providedCount = Object.keys(data).filter(
    k => allowedFields.has(k) && data[k] !== undefined,
  ).length;
  if (providedCount === 0 && errors.length === 0) {
    errors.push('At least one tracking field must be provided');
  }

  if (errors.length > 0) throw new AppError(400, 'Validation error', errors);
}
