# FEAT-065 v1 plan

## Task
7.3b — Live courier positions.

## Scope
- Type the `courier:location_updated` socket payload on the frontend.
- Apply courier location events directly to TanStack Query courier caches.
- Keep the map courier layer updated without waiting for HTTP refetch.
- Fall back to invalidation when cache data is missing or payload shape is invalid.

## Validation
- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run lint`
- `npm run build`
