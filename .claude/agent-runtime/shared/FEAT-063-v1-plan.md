# FEAT-063 v1 plan

## Task
7.2b — Route editing.

## Scope
- Make route polylines selectable on the dispatcher map.
- Add selected route state to the dispatcher UI store.
- Add a route editor overlay for draft/planned routes.
- Support native drag-and-drop reorder of route points.
- Support dropping orders from the order list into a route.
- Support removing points and saving via `PATCH /routes/:id`.

## Validation
- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run lint`
- `npm run build`
