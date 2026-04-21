# FEAT-023 Plan

## Scope

- Add `users` backend module for tenant-safe profile and admin CRUD.
- Expose `GET /api/v1/users/me`, `GET /api/v1/users`, `POST /api/v1/users`, `PATCH /api/v1/users/:id`.
- Enforce company isolation and admin-only access for list/create/update routes.

## Implementation Notes

- Reuse global JWT, tenant, role, and permission guards from phase `2.2`.
- Keep all user reads and writes scoped by `companyId`.
- Sync courier and dispatcher profile records when user role changes.

## Verification

- `npx tsc --noEmit`
- `npx jest src/modules/users/users.service.spec.ts src/modules/users/users.controller.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand`
