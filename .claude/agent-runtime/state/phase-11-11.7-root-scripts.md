# Phase 11.7 - root package scripts

Date: 2026-04-30
Status: completed
Depends on: 11.6

## Changed

- Replaced root `dev` script so it starts canonical `backend` and `frontend` with `concurrently`.
- Removed legacy root scripts `dev:api` and `dev:map`.
- Added explicit root proxies:
  - `dev:backend` -> `backend` `start:dev`
  - `dev:frontend` -> `frontend` `dev`
  - `lint`, `test`, `typecheck`, `build`
  - per-stack helper scripts for backend/frontend variants
- Removed all live root `package.json` references to deleted `apps/api` and `apps/map`.
- No `serve` dependency was present in root dependencies; the old usage was only `npx serve` in the removed `dev:map` script.

## Verification

- `rg` found no `apps/api`, `apps/web`, `apps/map`, `dev:api`, `dev:map`, or `npx serve` references in root `package.json` / `package-lock.json`.
- `npm run lint` passed with the pre-existing frontend warning in `frontend/src/features/dispatcher/route-workspace-panel.tsx`.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm test` passed:
  - backend: 60 suites, 290 tests
  - frontend: 4 files, 10 tests

## Notes

- `npm run dev` was not left running because it is a long-lived development process. The script now delegates to `npm:dev:backend` and `npm:dev:frontend` through `concurrently`.
- Backend root `test:backend` uses `npx jest --runInBand` because this Windows sandbox blocks Jest worker spawning with `spawn EPERM`.
