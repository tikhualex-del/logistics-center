export const LOCATION_SOURCES = [
  'gps',      // device GPS sensor
  'manual',   // operator-entered coordinates
  'network',  // network/IP-based location estimate
] as const;

export type LocationSource = (typeof LOCATION_SOURCES)[number];

// Fields owned exclusively by the tracking ingestion flow.
// Never accepted through createCourier or updateCourier.
export interface UpdateCourierTrackingInput {
  lat?: number;
  lng?: number;
  lastLocationAt?: string;     // ISO 8601 datetime
  locationSource?: LocationSource;
  trackingStatus?: string;
}
