# FEAT-063 v1 frontend implementation

## Changes
- Added `selectedRouteId` to UI state.
- Route polylines are clickable and highlighted when selected.
- Added `RouteEditorPanel` overlay:
  - route picker for the selected date,
  - drag-and-drop route point reordering,
  - dropping orders from the right order list into a route,
  - removing route points,
  - saving edits through `useUpdateRoute`.
- Manual edits are saved with `optimizeWaypoints: false` to preserve the dispatcher-selected order.
- Order cards now expose stable drag payloads for route editing.

## Files
- `frontend/src/features/dispatcher/route-editor-panel.tsx`
- `frontend/src/features/dispatcher/map-layers.ts`
- `frontend/src/features/dispatcher/map-view.tsx`
- `frontend/src/features/dispatcher/order-card.tsx`
- `frontend/src/features/dispatcher/index.ts`
- `frontend/src/pages/dispatcher.tsx`
- `frontend/src/store/ui.store.ts`

## Verification
- `npx tsc --noEmit -p tsconfig.app.json` passed.
- `npm run lint` passed.
- `npm run build` reached Vite config loading and failed on the known local `esbuild` `spawn EPERM` environment issue.
