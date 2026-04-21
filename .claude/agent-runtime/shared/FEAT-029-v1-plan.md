# FEAT-029 Plan

## Goal
Implement task `3.2c` by emitting domain events for order creation and order status transitions.

## Scope
- Inject `EventEmitter2` into the orders domain service
- Emit `order.created` after successful order creation
- Emit `order.status-changed` after successful status transition and logging
- Use typed event payloads for future listeners
- Keep persistence in `orders`, `order_status_history`, and `audit_logs` unchanged

## Verification
- `npx jest src/modules/orders/orders.service.spec.ts src/modules/orders/orders.controller.spec.ts src/modules/orders/order-state-machine.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand`
