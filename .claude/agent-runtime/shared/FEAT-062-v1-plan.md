# FEAT-062 v1 plan

## Task
7.2a — Route building.

## Scope
- Add a dispatcher map control that calls `POST /routes/build`.
- Use the currently selected date and visible non-terminal orders as the route payload.
- Align frontend route-build API typing with the backend response.
- Ensure the built route appears on the existing route polyline layer.

## Validation
- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run lint`
- `npm run build`
