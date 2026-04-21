# FEAT-034 Plan

## Goal
Implement task `3.4c` as a tenant-safe routing service and controller with route build, list, detail, manual edit, and route state transitions.

## Scope
- Add `RoutingService` and `RoutingController`
- Expose `POST /api/v1/routes/build`, `GET /api/v1/routes`, `GET /api/v1/routes/:id`, `PATCH /api/v1/routes/:id`
- Persist routes and route points in Prisma using `optimization_data` for provider output
- Support manual reorder/add/remove through full `orderIds` replacement
- Enforce route state machine `draft -> planned -> in_progress -> completed/cancelled`
- Prevent orders from being attached to multiple active routes
- Geocode missing order coordinates through the injected routing provider before build

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/routing/route-state-machine.spec.ts src/modules/routing/routing.service.spec.ts src/modules/routing/routing.controller.spec.ts src/modules/routing/providers/routing-provider.interface.spec.ts src/modules/routing/providers/yandex-routing.provider.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand --forceExit`
