# Phase 11.5 - platform/super-admin backend migration

Date: 2026-04-30
Status: completed
Depends on: 11.2

## Implemented

- Prisma migration `20260430090000_add_platform_admin` adds platform company metadata, `CompanyStatus`, `PlatformSuperAdmin`, `PlatformImpersonationSession`, and `PlatformAuditEvent`.
- `backend/src/modules/platform` adds platform-only APIs for company list/create/read/update/status/archive, seed-owner, tenant user visibility, platform admin CRUD, and impersonation start/end/list.
- `backend/src/modules/tenant-provisioning` provisions a canonical single-schema company, first admin user, default feature flags, and platform audit event in one transaction.
- Auth now supports platform JWTs and impersonation JWTs while keeping platform routes behind `PlatformGuard` and `@PlatformRoute`.
- Impersonation tokens validate active platform admin + active session + active company, then enter tenant APIs as an admin tenant context.
- Public tenant registration and tenant company creation now generate canonical slugs for the expanded `Company` model.

## Decisions

- `access` was not migrated as a standalone module, per 11.2.
- Platform access does not use `permission-matrix.ts`; tenant guards/role/permission guards explicitly bypass only routes marked with `@PlatformRoute`, and `PlatformGuard` rejects tenant and impersonation contexts.
- `POST /platform/companies` requires an owner payload so platform provisioning creates company + admin + defaults together. `POST /platform/companies/:id/seed-owner` remains for bootstrap recovery of an empty company.
- Initial platform super-admin bootstrap is intentionally left to deployment/seed data, because creating the first platform admin through a public API would weaken the platform boundary.

## Verification

- `cd backend && npx prisma generate --schema prisma/schema.prisma` passed.
- `cd backend && npm run lint` passed.
- `cd backend && npm run build` passed.
- `cd backend && npx jest --runInBand` passed: 60 suites, 290 tests.

## Notes

- Plain `npm test -- ...` hit sandbox `spawn EPERM` because Jest tried to fork workers. The same suites passed with `npx jest --runInBand`.
