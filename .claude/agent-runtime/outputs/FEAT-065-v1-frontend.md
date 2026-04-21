# FEAT-065 v1 frontend implementation

## Changes
- Added `CourierLocationUpdatedPayload` to `frontend/src/api/socket-client.ts`.
- Updated `useDispatcherRealtime` to process `courier:location_updated` payloads as `unknown` and validate them with a runtime guard.
- Existing courier list cache is updated in-place with latitude, longitude, status, name and last seen timestamp.
- Courier detail cache is also updated when present.
- If no cached courier exists, the hook falls back to invalidating courier queries.

## User impact
- Dispatcher courier markers receive fresh coordinates from WebSocket events.
- The existing Yandex courier layer re-renders from updated query data, so visible markers move without waiting for a polling/refetch cycle.

## Verification
- `npx tsc --noEmit -p tsconfig.app.json` passed.
- `npm run lint` passed.
- `npm run build` reached Vite config loading and failed on the known local `esbuild` `spawn EPERM` environment issue.
