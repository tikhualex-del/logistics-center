# FEAT-062 v1 frontend implementation

## Changes
- Added `RouteBuildControls` for the dispatcher map overlay.
- The build action sends visible routable order IDs to `POST /routes/build`.
- The selected order, when visible and routable, is prioritized as the first route point.
- The route layer is forced visible after a successful build.
- The returned route is written into the selected-date route query cache so the map can render the polyline immediately.
- Updated frontend API typing because the backend returns a single `Route` from `POST /routes/build`.

## Files
- `frontend/src/features/dispatcher/route-build-controls.tsx`
- `frontend/src/features/dispatcher/index.ts`
- `frontend/src/pages/dispatcher.tsx`
- `frontend/src/api/routes.api.ts`
- `frontend/src/hooks/use-routes.ts`
- `frontend/src/store/ui.store.ts`

## Verification
- `npx tsc --noEmit -p tsconfig.app.json` passed.
- `npm run lint` passed.
- `npm run build` reached Vite config loading and failed on the known local `esbuild` `spawn EPERM` environment issue.
