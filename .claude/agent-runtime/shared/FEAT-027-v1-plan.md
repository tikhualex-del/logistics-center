# FEAT-027 Plan

## Goal
Implement task `3.2a` as a tenant-safe backend `orders` CRUD module.

## Scope
- Add `OrdersModule`, `OrdersController`, and `OrdersService`
- Expose `POST /api/v1/orders`, `GET /api/v1/orders`, `GET /api/v1/orders/:id`, `PATCH /api/v1/orders/:id`
- Restrict access to admin/dispatcher roles with `view:orders` and `edit:orders` permissions
- Support filters for `status`, `date`, and `zoneId`
- Validate references to `zones` and `couriers`
- Enforce uniqueness for `externalId` and `orderNumber` inside tenant scope
- Keep status transitions out of this task; leave them for `3.2b`

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/orders/orders.service.spec.ts src/modules/orders/orders.controller.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand`
