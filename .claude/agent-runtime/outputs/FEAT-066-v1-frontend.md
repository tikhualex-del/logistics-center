# FEAT-066 v1 frontend implementation

## Changes
- Added `OrderStatusChangedPayload` to `frontend/src/api/socket-client.ts`.
- Updated dispatcher realtime subscription for `order:status_changed`.
- Existing cached order lists are patched immediately with the new status, display IDs, address and timestamp.
- Status-filtered order lists remove orders that no longer match the active filter.
- Cached order details are patched when present.
- Background invalidation remains enabled so lists that need full server data still refetch.
- Removed an unused `ORDER_MARKER_COLORS` constant that blocked TypeScript/lint.

## User impact
- Dispatcher order list and map markers respond immediately when an order status changes via WebSocket.
- Filtered views stay coherent while the server refetch fills any missing full records.

## Verification
- `npx tsc --noEmit -p tsconfig.app.json` passed.
- `npm run lint` passed.
- `npm run build` reached Vite config loading and failed on the known local `esbuild` `spawn EPERM` environment issue.
