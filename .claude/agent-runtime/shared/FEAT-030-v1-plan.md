# FEAT-030 Plan

## Goal
Implement task `3.3a` as a tenant-safe backend couriers module with status and GPS updates.

## Scope
- Add `CouriersModule`, `CouriersController`, and `CouriersService`
- Expose `GET /api/v1/couriers`, `GET /api/v1/couriers/:id`, `PATCH /api/v1/couriers/:id/status`, `PATCH /api/v1/couriers/:id/location`
- Restrict list/detail/status routes to admin and dispatcher with `manage:couriers`
- Allow location updates for admin/dispatcher and for courier role only on its own profile
- Support online/offline toggle mapped to courier runtime statuses
- Return courier profile data together with linked user info and current GPS point

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/couriers/couriers.service.spec.ts src/modules/couriers/couriers.controller.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand`
