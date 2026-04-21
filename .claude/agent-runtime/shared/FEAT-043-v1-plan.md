# FEAT-043 Plan

## Scope

Implement the base realtime Socket.io gateway for Phase 5.1a:
- JWT-authenticated websocket connections
- tenant-isolated rooms per company
- role and user rooms for targeted realtime delivery
- reusable gateway API for Phase 5.1b domain events

## Implementation Notes

- Reuse the existing JWT/auth stack through a shared socket auth service.
- Keep the gateway transport-focused: connection auth, room joins, and emit helpers.
- Leave concrete realtime business events (`courier:location_updated`, `order:status_changed`, `route:updated`, `alert:new`) for `5.1b`.
- Keep notifications socket flow working on top of the shared socket auth helper.
