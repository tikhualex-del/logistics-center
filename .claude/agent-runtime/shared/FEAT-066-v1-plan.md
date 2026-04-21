# FEAT-066 v1 plan

## Task
7.3c — Live order updates.

## Scope
- Type the `order:status_changed` socket payload on the frontend.
- Apply status changes directly to cached order lists and order details.
- Keep dispatcher order list and map markers updated immediately.
- Keep background query invalidation as a safety net for filtered lists and full server data.

## Validation
- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run lint`
- `npm run build`
