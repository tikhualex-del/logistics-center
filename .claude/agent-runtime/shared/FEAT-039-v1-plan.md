# FEAT-039 Plan

## Goal
Extend the compensation backend with payment read APIs, a payment lifecycle state machine, and domain events for calculated and approved payments.

## Scope
- add `GET /api/v1/payments`
- add `GET /api/v1/payments/:id`
- add `PATCH /api/v1/payments/:id/status`
- enforce the payment state machine `draft -> calculated -> approved -> paid -> disputed`
- emit `payment.calculated` and `payment.approved`
- persist status-transition metadata on payment records
- connect payment events to audit logging
- cover controller, service, state-machine, and audit scenarios with tests

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/compensation/payments.service.spec.ts src/modules/compensation/payments.controller.spec.ts src/modules/compensation/payment-state-machine.spec.ts src/modules/audit/audit.service.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand --forceExit`
