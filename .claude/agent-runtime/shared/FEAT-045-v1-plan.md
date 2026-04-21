# FEAT-045 Plan

## Scope

Implement Phase 5.2 Bull queue infrastructure:
- keep the existing `webhook-delivery` queue as the outbound retry transport
- add a dedicated `payment-calculation` queue for compensation calculations
- preserve the current HTTP contract for `/api/v1/payments/calculate`
- cover the new queue flow with unit tests on enqueueing and processor execution

## Implementation Notes

- Register the new queue in `CompensationModule` instead of adding ad-hoc queue wiring in controllers.
- Keep payment calculation logic in `PaymentsService`, but execute it through a Bull processor/job bridge.
- Return a normalized job result envelope so queue-backed processing can preserve user-facing HTTP errors.
- Leave Bull Board optional for now; the task is complete once both queues are wired and verified.
