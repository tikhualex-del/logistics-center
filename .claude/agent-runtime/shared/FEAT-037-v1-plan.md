# FEAT-037 Plan

## Goal
Implement versioned CRUD for payment rules so admins can create, list, and change motivation rules without mutating historical versions.

## Scope
- add `CompensationModule` with `PaymentRulesController` and `PaymentRulesService`
- implement `POST /api/v1/payment-rules`
- implement `GET /api/v1/payment-rules` with current-version listing by default
- implement `PATCH /api/v1/payment-rules/:id` as immutable version creation
- support rule types: `zone_rate`, `per_km`, `per_order`, `bonus`, `penalty`, `minimum_guarantee`
- validate `value`, `conditions`, and effective window semantics
- protect routes with admin role and `edit:payment-rules` permission
- cover versioning and listing behavior with unit tests

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/compensation/payment-rules.service.spec.ts src/modules/compensation/payment-rules.controller.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand --forceExit`
