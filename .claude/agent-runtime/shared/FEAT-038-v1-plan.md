# FEAT-038 Plan

## Goal
Implement the payment calculation engine so the backend can calculate courier payouts for a period, apply active compensation rules, and persist an append-only payment with detailed JSON breakdown.

## Scope
- add `POST /api/v1/payments/calculate`
- fetch completed courier routes and delivered route orders for the requested period
- apply current active payment rules: `zone_rate`, `per_km`, `per_order`, `bonus`, `penalty`, `minimum_guarantee`
- persist a new payment record with `status=calculated`
- store a structured JSON breakdown with metrics, route/order details, and applied rule components
- cover calculation behavior and guarantee handling with unit tests

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/compensation/payments.service.spec.ts src/modules/compensation/payments.controller.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand --forceExit`
