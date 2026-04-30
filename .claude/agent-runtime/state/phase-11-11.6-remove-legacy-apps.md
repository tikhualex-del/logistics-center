# Phase 11.6 - remove legacy apps stack

Date: 2026-04-30
Status: completed
Depends on: 11.3, 11.4, 11.5

## Removed

- Deleted tracked legacy `apps/api` Express backend.
- Deleted tracked legacy `apps/web` Next.js frontend.
- Deleted tracked legacy `apps/map` static map app.
- Removed untracked legacy build/install artifacts left under `apps/web` (`.next`, `node_modules`, `next-env.d.ts`, `tsconfig.tsbuildinfo`).
- Removed the now-empty `apps/` directory.

## Prisma cleanup

- Duplicate legacy Prisma schemas and migrations under `apps/api/prisma` were removed with `apps/api`.
- Canonical Prisma source remains `backend/prisma/schema.prisma` and `backend/prisma/migrations`.

## Remaining References

- Historical audit/runtime docs intentionally keep references to `apps/api`, `apps/web`, and `apps/map`.
- Root `package.json` still has scripts pointing at `apps/api` and `apps/map`; this is intentionally left for Phase 11.7, which owns root script replacement and removal of app-map-only dependencies.

## Verification

- `Test-Path apps` returned `False`.
- Search for duplicate legacy Prisma schema paths found only historical runtime docs.
- Backend checks after deletion:
  - `cd backend && npm run lint`
  - `cd backend && npm run build`
  - `cd backend && npx jest --runInBand`
- Frontend checks after deletion:
  - `cd frontend && npm run lint`
  - `cd frontend && npm run build`

Note: frontend lint still reports the pre-existing warning in
`frontend/src/features/dispatcher/route-workspace-panel.tsx` about an
unnecessary `initialCourierId` hook dependency; no new lint errors were added.
