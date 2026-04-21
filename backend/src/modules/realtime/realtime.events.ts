export const REALTIME_EVENTS = {
  COURIER_LOCATION_UPDATED: 'courier:location_updated',
  ORDER_STATUS_CHANGED: 'order:status_changed',
  ROUTE_UPDATED: 'route:updated',
  ALERT_NEW: 'alert:new',
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
