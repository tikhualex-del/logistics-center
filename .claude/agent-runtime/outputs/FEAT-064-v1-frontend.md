# FEAT-064 v1 frontend implementation

## Changes
- Extended `RouteEditorPanel` with courier data from `useCouriers`.
- Added a `Courier assignment` select for selected routes.
- Added `Use selected` shortcut when a courier marker was clicked on the map.
- Assignment changes are local until `Save route`, then sent with `PATCH /routes/:id`.
- Route saves keep `optimizeWaypoints: false` to preserve dispatcher edits.
- Added a route status indicator showing draft/planned/in-progress/completed progress and assigned courier state.

## Files
- `frontend/src/features/dispatcher/route-editor-panel.tsx`

## Verification
- `npx tsc --noEmit -p tsconfig.app.json` passed.
- `npm run lint` passed.
- `npm run build` reached Vite config loading and failed on the known local `esbuild` `spawn EPERM` environment issue.
