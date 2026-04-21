export const COURIER_STATUSES = [
  'active',       // available and ready to accept deliveries
  'inactive',     // not working (off shift, paused)
  'on_delivery',  // currently executing a delivery
  'suspended',    // account suspended, cannot work
] as const;

export type CourierStatus = (typeof COURIER_STATUSES)[number];

export function isValidCourierStatus(value: string): value is CourierStatus {
  return (COURIER_STATUSES as readonly string[]).includes(value);
}

export const COURIER_TRANSPORT_TYPES = [
  'car',
  'bicycle',
  'motorcycle',
  'scooter',
  'foot',
] as const;

export type CourierTransportType = (typeof COURIER_TRANSPORT_TYPES)[number];

export const COURIER_TRACKING_STATUSES = [
  'online',   // actively sending location
  'offline',  // not sending location
  'idle',     // connected but not moving
] as const;

export type CourierTrackingStatus = (typeof COURIER_TRACKING_STATUSES)[number];
