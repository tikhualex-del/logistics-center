# FEAT-064 v1 plan

## Task
7.2c — Assign route to courier.

## Scope
- Extend the dispatcher route editor with courier assignment.
- Use a courier dropdown backed by `GET /couriers`.
- Allow using the courier selected on the map as a shortcut.
- Save assignment through `PATCH /routes/:id`.
- Show a route status indicator with current route state and courier assignment.

## Validation
- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run lint`
- `npm run build`
