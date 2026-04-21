# FEAT-060 v1 - Frontend Report

Feature: dispatcher-zone-polygons
Task: 7.1c
Status: complete

## Implemented

- Added `useZonePolygons` Yandex layer hook.
- Converted backend GeoJSON polygon rings into Yandex polygon geometry.
- Added zone hint/balloon content and safe cleanup on layer rerender.

## Verification

- `npx tsc --noEmit -p tsconfig.app.json` passed.
- `npm run lint` passed.

