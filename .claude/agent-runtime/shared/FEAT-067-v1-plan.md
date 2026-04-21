# FEAT-067 v1 plan

## Task
7.3d — Alerts toast + badge.

## Scope
- Type the realtime `alert:new` notification envelope.
- Store transient alert toast state in the UI store.
- Add a global toast viewport for protected app layout.
- Keep unread alert badge behavior and allow marking alerts read from the bell button.
- Wire `alert:new` to badge increment and toast creation.

## Validation
- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run lint`
- `npm run build`
