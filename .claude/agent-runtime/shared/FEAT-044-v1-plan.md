# FEAT-044 Plan

## Scope

Implement Phase 5.1b realtime business events on top of the shared Socket.io gateway:
- bridge domain events into `/realtime`
- emit `courier:location_updated`, `order:status_changed`, `route:updated`, and `alert:new`
- target company-scoped dispatcher/admin rooms for operations updates
- keep alert payloads aligned with existing notifications contracts

## Implementation Notes

- Reuse `RealtimeGateway` room helpers instead of introducing a second socket transport.
- Subscribe to existing domain events from couriers, orders, and routing modules.
- Share alert builders with the notifications module so dispatcher alerts stay consistent across channels.
- Keep listeners side-effect safe: websocket emission should not break the underlying domain flow.
