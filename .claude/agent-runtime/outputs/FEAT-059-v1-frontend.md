# FEAT-059 v1 - Frontend Report

Feature: dispatcher-order-markers
Task: 7.1b
Status: complete

## Implemented

- Added `useOrderMarkers` Yandex layer hook.
- Markers are created from real order coordinates.
- Marker click updates `selectedOrderId` and recenters the map.
- Selected order marker gets a stronger visual style.

## Verification

- `npx tsc --noEmit -p tsconfig.app.json` passed.
- `npm run lint` passed.

