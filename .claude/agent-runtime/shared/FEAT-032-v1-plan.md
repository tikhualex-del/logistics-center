# FEAT-032 Plan

## Goal
Implement task `3.4a` as a stable abstraction contract for routing backends.

## Scope
- Add `RoutingProvider` interface under `modules/routing/providers/`
- Define typed inputs and outputs for `buildRoute`, `calculateDistance`, and `geocode`
- Expose a DI token so future concrete providers can be swapped without changing domain logic
- Cover the contract with an in-memory spec that exercises all three methods

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/routing/providers/routing-provider.interface.spec.ts --runInBand`
