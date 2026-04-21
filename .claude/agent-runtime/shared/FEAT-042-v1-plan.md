# FEAT-042 Plan

## Scope

Implement internal web notifications for dispatchers via Socket.io:
- websocket gateway with JWT handshake authentication
- dispatcher-targeted delivery rooms per company
- alerts for `order.created`, `order.status-changed`, and route changes
- unit coverage for gateway auth/broadcast and notification event mapping

## Implementation Notes

- Reuse existing JWT/auth stack from `AuthModule`.
- Broadcast a single `notification` socket event with typed payload envelopes.
- Deliver notifications only to connected dispatcher sockets in the same company.
- Keep the MVP transport in-memory and event-driven without introducing new database tables.
