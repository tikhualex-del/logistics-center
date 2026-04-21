# FEAT-069 v1 frontend implementation

## Changes
- Added a courier detail card to the couriers page.
- The card opens when a courier row is selected and can be closed without leaving the page.
- Connected details to `useCourier(selectedCourierId)` with the existing roster data as a fallback while fetching.
- Added selected-day statistics for assigned, active and completed orders.
- Added GPS, last-seen, phone and profile status fields.
- Added an online/offline action wired to `useUpdateCourierStatus`.
- Added refresh, empty, loading and API-error states for the detail card and order statistics.

## Verification
- `npm run build` passed after rerunning outside the sandbox because the initial sandboxed Vite/esbuild spawn failed with `EPERM`.
