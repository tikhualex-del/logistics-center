/** Tracking data older than this threshold is considered stale. */
export const TRACKING_FRESHNESS_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Returns true if the courier's last known location is within the freshness threshold.
 *
 * Accepts the value as it comes from either the service layer (Date) or
 * the API response model (ISO string), so callers don't need to convert.
 *
 * Rules:
 *  - null → stale (no location recorded yet)
 *  - age > TRACKING_FRESHNESS_THRESHOLD_MS → stale
 *  - age ≤ TRACKING_FRESHNESS_THRESHOLD_MS → fresh
 */
export function isCourierTrackingFresh(
  lastLocationAt: Date | string | null,
  now: Date = new Date(),
): boolean {
  if (lastLocationAt === null) return false;

  const ts = lastLocationAt instanceof Date
    ? lastLocationAt
    : new Date(lastLocationAt);

  return now.getTime() - ts.getTime() <= TRACKING_FRESHNESS_THRESHOLD_MS;
}
