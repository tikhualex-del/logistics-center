import {
  ALL_DOMAIN_EVENT_NAMES,
  DOMAIN_EVENT_NAMES,
  DOMAIN_EVENTS,
  isDomainEventName,
} from './events.constants';

describe('events.constants', () => {
  it('exports the canonical domain event names from CLAUDE.md section 3', () => {
    expect(ALL_DOMAIN_EVENT_NAMES).toEqual([
      'order.created',
      'order.status-changed',
      'route.updated',
      'route.built',
      'route.cancelled',
      'payment.calculated',
      'payment.approved',
      'payment.disputed',
      'shift.confirmed',
      'shift.started',
      'courier.location-updated',
      'integration.webhook-failed',
    ]);
  });

  it('keeps grouped and flat exports aligned', () => {
    expect(DOMAIN_EVENTS.ORDER.CREATED).toBe(
      DOMAIN_EVENT_NAMES.ORDER_CREATED,
    );
    expect(DOMAIN_EVENTS.ROUTE.UPDATED).toBe(
      DOMAIN_EVENT_NAMES.ROUTE_UPDATED,
    );
    expect(DOMAIN_EVENTS.PAYMENT.CALCULATED).toBe(
      DOMAIN_EVENT_NAMES.PAYMENT_CALCULATED,
    );
    expect(DOMAIN_EVENTS.COURIER.LOCATION_UPDATED).toBe(
      DOMAIN_EVENT_NAMES.COURIER_LOCATION_UPDATED,
    );
    expect(DOMAIN_EVENTS.INTEGRATION.WEBHOOK_FAILED).toBe(
      DOMAIN_EVENT_NAMES.INTEGRATION_WEBHOOK_FAILED,
    );
  });

  it('keeps event names unique and validates them', () => {
    expect(new Set(ALL_DOMAIN_EVENT_NAMES).size).toBe(
      ALL_DOMAIN_EVENT_NAMES.length,
    );
    expect(isDomainEventName('order.created')).toBe(true);
    expect(isDomainEventName('order:status_changed')).toBe(false);
    expect(isDomainEventName('integration.webhook-failed')).toBe(true);
  });
});
