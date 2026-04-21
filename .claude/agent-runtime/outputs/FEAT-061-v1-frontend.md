# FEAT-061 v1 - Frontend Report

Feature: dispatcher-route-courier-layer-toggles
Task: 7.1d
Status: complete

## Implemented

- Added `useRouteLayer` for route polylines.
- Added `useCourierLayer` for courier markers.
- Wired both hooks to `showRoutes` and `showCouriers` from `useUiStore`.
- Aligned frontend route/courier API types with backend DTOs used by the map.

## Verification

- `npx tsc --noEmit -p tsconfig.app.json` passed.
- `npm run lint` passed.

