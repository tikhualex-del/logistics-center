# FEAT-041 Plan

## Scope

Implement outbound CRM webhooks for Logistics Center with:
- per-company webhook registration CRUD
- HMAC-SHA256 signing for outbound deliveries
- Bull-based async delivery queue
- retry policy `30s -> 2m -> 10m -> 30m -> 2h`
- delivery logging in `integration_events`

## Implementation Notes

- Extend `integrations` module with admin endpoints for webhook registrations.
- Subscribe to domain events from `orders` and `routing` and enqueue outbound deliveries.
- Deliver queued jobs through a Bull processor and persist retry/failure metadata.
- Cover registration, queueing, delivery, retry, and bootstrap behavior with tests.
