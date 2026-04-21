# FEAT-068 v1 plan

## Task
8.1a - Couriers table/list.

## Scope
- Replace the `/couriers` placeholder with a functional courier roster.
- Reuse existing `useCouriers` and `useOrders({ date })` hooks from the frontend API layer.
- Show courier name, online/offline state, operational status, assigned order count and GPS location.
- Add color coding for availability/status and keep selected courier in the shared UI store.
- Support top-bar search across courier name, email, phone and status.

## Validation
- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run lint`
- `npm run build`
