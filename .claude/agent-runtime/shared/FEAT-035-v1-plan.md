# FEAT-035 Plan

## Goal
Emit domain events for routing lifecycle changes so downstream modules can react to route creation, updates, and cancellations.

## Scope
- add typed payload contracts for routing events
- emit `route.built` after successful route creation
- emit `route.updated` after successful non-cancel route updates
- emit `route.cancelled` when a route transitions to cancelled
- keep API flow resilient if event listeners fail
- cover emission behavior with routing service tests

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/routing/route-state-machine.spec.ts src/modules/routing/routing.service.spec.ts src/modules/routing/routing.controller.spec.ts src/modules/routing/providers/routing-provider.interface.spec.ts src/modules/routing/providers/yandex-routing.provider.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand --forceExit`
