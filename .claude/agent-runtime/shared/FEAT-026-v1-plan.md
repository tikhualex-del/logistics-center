# FEAT-026 Plan

## Goal
Implement the backend `zones` module for task `3.1` with admin-only CRUD, tenant scoping, GeoJSON polygon validation, zone color, and base rate support.

## Scope
- Add `ZonesModule`, `ZonesController`, and `ZonesService`
- Expose `GET /api/v1/zones`, `GET /api/v1/zones/:id`, `POST /api/v1/zones`, `PATCH /api/v1/zones/:id`, `DELETE /api/v1/zones/:id`
- Protect all routes with admin role and `edit:zones` permission
- Validate GeoJSON polygon payloads and basic zone fields
- Soft-delete zones by archiving them with `is_active = false`
- Add unit tests for DTO validation, service logic, and controller contracts

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/zones/zones.service.spec.ts src/modules/zones/zones.controller.spec.ts src/modules/zones/dto/create-zone.dto.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand`
