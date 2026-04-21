# FEAT-068 v1 frontend implementation

## Changes
- Added `CouriersList` feature component for the Phase 8 couriers page.
- Replaced the `/couriers` page placeholder with the live roster component.
- Connected the roster to `useCouriers` for courier data and `useOrders({ date })` for selected-day assignment counts.
- Added summary cards for total couriers, online couriers, busy couriers and couriers with GPS.
- Added responsive list/table rows with:
  - courier name, email and phone
  - online/offline badge
  - operational status badge
  - assigned order count
  - current coordinates or no-GPS state
  - last seen label
- Row click now updates `selectedCourierId` in the UI store, preparing the page for task 8.1b detail-card behavior.
- Search from the top bar filters couriers by name, email, phone, status and online/offline state.

## Verification
- `npx tsc --noEmit -p tsconfig.app.json` passed.
- `npm run lint` passed.
- `npm run build` reached Vite config loading and failed on the known local `esbuild` `spawn EPERM` environment issue.
