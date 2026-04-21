# FEAT-028 Plan

## Goal
Implement task `3.2b` as an order status state machine with transition validation and append-only logs.

## Scope
- Add `canTransition(from, to)` logic for order status chain
- Add typed `InvalidStateTransitionException`
- Expose `PATCH /api/v1/orders/:id/status`
- Persist every valid transition to `order_status_history`
- Persist matching append-only audit entry to `audit_logs`
- Keep event emission out of scope for this task; leave it for `3.2c`

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/orders/orders.service.spec.ts src/modules/orders/orders.controller.spec.ts src/modules/orders/order-state-machine.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand`
