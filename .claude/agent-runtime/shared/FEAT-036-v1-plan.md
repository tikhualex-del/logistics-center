# FEAT-036 Plan

## Goal
Add an audit module that appends audit log entries from domain events and exposes an admin-only read endpoint for audit history.

## Scope
- add `AuditModule`, `AuditService`, and `AuditController`
- subscribe to `order.created`, `route.built`, `route.updated`, `route.cancelled`, and `courier.location-updated`
- append normalized records into `audit_logs`
- expose `GET /api/v1/audit-logs` for admins with basic filters
- keep the module append-only with no mutation endpoints
- cover event handling and list behavior with unit tests

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/audit/audit.service.spec.ts src/modules/audit/audit.controller.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand --forceExit`
