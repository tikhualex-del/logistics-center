# FEAT-067 v1 frontend implementation

## Changes
- Added alert notification payload types to `frontend/src/api/socket-client.ts`.
- Extended `ui.store` with alert toast queue helpers:
  - `alertToasts`
  - `incrementAlertCount`
  - `pushAlertToast`
  - `dismissAlertToast`
  - `clearAlertToasts`
- Added `AlertToastViewport` with auto-dismiss and manual close.
- Mounted the toast viewport in `AppLayout`.
- Updated `TopBar` alert bell so clicking it marks unread alerts as read.
- Updated dispatcher realtime subscription to validate `alert:new`, increment the badge, and show a toast for valid payloads.

## User impact
- Dispatchers now see toast notifications for new orders, order status changes and route changes.
- The top-bar alert badge still increments from realtime events and can be cleared from the bell.

## Verification
- `npx tsc --noEmit -p tsconfig.app.json` passed.
- `npm run lint` passed.
- `npm run build` reached Vite config loading and failed on the known local `esbuild` `spawn EPERM` environment issue.
