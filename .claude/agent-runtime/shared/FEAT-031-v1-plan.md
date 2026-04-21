# FEAT-031 Plan

## Goal
Implement task `3.3b` by emitting `courier.location-updated` after successful courier GPS updates.

## Scope
- Add a typed internal event contract for courier location updates
- Emit `courier.location-updated` from `CouriersService` after a successful location write
- Include actor, tenant, request, and updated location data in the event payload
- Keep the HTTP update flow successful even if event listeners fail
- Cover successful emission and non-emission on failed authorization with tests

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/couriers/couriers.service.spec.ts src/modules/couriers/couriers.controller.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand --forceExit`
