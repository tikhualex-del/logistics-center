# Phase 11.10 - stub modules MVP decision

Date: 2026-04-30
Status: completed
Depends on: 11.7

## Changed

- Added `backend/src/modules/dispatchers/` as a minimal Nest module.
- Registered `DispatchersModule` in `backend/src/app.module.ts`.
- Added `GET /dispatchers` for assignment dropdowns.
- Scoped dispatcher listing through `PrismaService.runWithTenant(companyId)`.
- Limited the MVP list to active dispatcher profiles whose linked user is active
  and still has the `dispatcher` role.
- Protected the route for `admin` and `dispatcher` roles with
  `manage:couriers`, matching the courier assignment surface.
- Replaced empty `.gitkeep` placeholders in `ai/`, `analytics/`, and `kpi/`
  with README files marked `Phase 2 placeholder by design`.
- Replaced the empty `schedules/` placeholder with an explicit README noting
  that schedules/shifts are deferred to Phase 12.8.

## Response shape

`GET /dispatchers` returns:

- `id`
- `companyId`
- `userId`
- `email`
- `phone`
- `firstName`
- `lastName`
- `isActive`
- `createdAt`
- `updatedAt`

## Verification

- `cd backend; npx jest --runInBand src/modules/dispatchers` passed:
  - 2 suites
  - 2 tests
- `npm run typecheck` passed.
- `npm run lint` passed with the pre-existing frontend warning in
  `frontend/src/features/dispatcher/route-workspace-panel.tsx`.
- `npm test` passed:
  - backend: 62 suites, 292 tests
  - frontend: 4 files, 10 tests
- `npm run build` passed.

## Notes

- `schedules` remains intentionally unimplemented in Phase 11.10. Phase 12.8 is
  still the decision point for shifts and the schedule state machine.
