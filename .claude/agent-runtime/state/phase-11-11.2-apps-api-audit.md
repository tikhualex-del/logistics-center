# Phase 11.2 - apps/api vs backend audit

Date: 2026-04-29
Status: completed
Scope: compare legacy `apps/api` modules without direct canonical backend equivalents: `access`, `platform`, `tenant-provisioning`.

## Summary

`apps/api` contains real platform/super-admin product value that is not present in the canonical Nest backend yet. The value should be migrated before deleting `apps/api`, but the implementation should be adapted to the current backend architecture instead of copied verbatim.

Decisions:

- `access`: do not migrate as a standalone module. It only defines status constants and duplicates concepts already handled by `auth`, `users`, guards, roles, and permissions in `backend`.
- `platform`: migrate in 11.5. This is the missing super-admin surface: platform admin auth, company lifecycle, owner bootstrap, tenant user visibility, admin management, impersonation, and platform audit.
- `tenant-provisioning`: migrate in 11.5 as a canonical single-schema provisioning service. Do not copy the legacy per-tenant-schema DDL approach.

## Current backend equivalents

Canonical backend has:

- Tenant auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
- Tenant users: `GET /users/me`, `GET /users`, `POST /users`, `PATCH /users/:id`.
- Tenant companies: `GET /companies/me`, `PATCH /companies/me`, `GET /companies/me/features`, `PATCH /companies/me/features/:featureKey`.
- RBAC/permissions: `UserRole { admin, dispatcher, courier }`, `RolesGuard`, `PermissionsGuard`, `TenantGuard`, and `permission-matrix.ts`.
- Single-schema tenant isolation by `company_id`.

Canonical backend does not have:

- Platform super-admin identity or auth.
- Platform-level company CRUD/status management.
- Platform impersonation sessions/tokens.
- Platform audit events.
- Tenant bootstrap/provisioning endpoint/service separate from public register.
- Rich company metadata: `slug`, `status`, `timezone`, `defaultCurrency`, `language`, `country`, `contactEmail`, `contactPhone`, `planId`.

## Legacy endpoint inventory

These endpoints should be considered the migration contract for 11.5.

### Platform auth support

Mounted under `/auth` in `apps/api/src/modules/auth/auth.routes.ts`:

| Method | Path | Purpose | Migration decision |
|---|---|---|---|
| POST | `/auth/platform/login` | Login platform super admin, return super-admin JWT | migrate |
| POST | `/auth/platform/logout` | Audit-only platform logout | migrate |
| GET | `/auth/me` | Returns user, impersonation, or super-admin profile based on token type | adapt; canonical `/auth/me` or `/users/me` must understand platform/impersonation only if platform token is supported |

### Platform-level companies

Mounted under `/companies` with `requireAuth + requireSuperAdmin` in `apps/api/src/app.ts`.
Implementation lives in `apps/api/src/modules/companies`.

| Method | Path | Purpose | Migration decision |
|---|---|---|---|
| GET | `/companies` | List all platform companies | migrate into `backend/src/modules/platform` |
| POST | `/companies` | Create company, then call `tenant-provisioning.provision(companyId)` | migrate as `POST /platform/companies` |
| GET | `/companies/:id` | Read platform company | migrate |
| PATCH | `/companies/:id` | Update company metadata | migrate |
| PATCH | `/companies/:id/status` | Set status: `active`, `inactive`, `suspended`, `trial`, `pending_setup`, `archived` | migrate |
| PATCH | `/companies/:id/archive` | Convenience archive transition | migrate or fold into status endpoint |

### Platform operations

Mounted under `/platform` with `requireAuth + requireSuperAdmin` in `apps/api/src/modules/platform/platform.routes.ts`.

| Method | Path | Purpose | Migration decision |
|---|---|---|---|
| POST | `/platform/companies/:id/seed-owner` | Bootstrap first tenant owner in an empty tenant | migrate, adapted to `UserRole.admin` unless owner role is added |
| GET | `/platform/companies/:id/users` | Read-only support visibility into tenant users | migrate |
| GET | `/platform/admins` | List platform super admins | migrate |
| POST | `/platform/admins` | Create platform super admin | migrate |
| GET | `/platform/admins/:id` | Read platform super admin | migrate |
| PATCH | `/platform/admins/:id` | Update platform admin status | migrate |

### Platform impersonation

Mounted under `/platform/impersonate`.

| Method | Path | Purpose | Migration decision |
|---|---|---|---|
| POST | `/platform/impersonate/:companyId` | Start impersonation, return tenant-context token | migrate |
| POST | `/platform/impersonate/:sessionId/end` | End active impersonation session | migrate |
| GET | `/platform/impersonate?companyId=` | List impersonation sessions, optionally filtered by company | migrate |

### Tenant provisioning

`apps/api/src/modules/tenant-provisioning` has no direct route. It is called by legacy `POST /companies`.

Legacy behavior:

- Create a per-tenant PostgreSQL schema named from `companyId`.
- Apply `apps/api/prisma/tenant-schema.sql`.
- Seed roles `owner`, `dispatcher`, `viewer`.
- Fail with conflict if schema already exists.
- Leave the system company row behind if provisioning fails.

Migration decision: replace with idempotent single-schema provisioning for the canonical backend.

## DTO and payload inventory

### Platform company DTOs

Legacy source: `apps/api/src/modules/companies/company.types.ts`.

- `CompanyStatus`: `active | inactive | suspended | trial | pending_setup | archived`.
- `Company`: `id`, `name`, `slug`, `status`, `timezone`, `defaultCurrency`, `language`, `country`, `contactEmail`, `contactPhone`, `planId`, `createdAt`, `updatedAt`.
- `CreateCompanyInput`: `name`, `slug`, `timezone`, `defaultCurrency`, `language`, `country`, `contactEmail`, `contactPhone`, `planId`.
- `UpdateCompanyInput`: optional `name`, `timezone`, `defaultCurrency`, `language`, `country`, `contactEmail`, `contactPhone`, `planId`.
- `ChangeCompanyStatusInput`: `status`.

Canonical backend currently only supports `Company { id, name, created_at, updated_at }`. 11.5 must either add the metadata columns or explicitly waive them; recommended path is to add them because platform UI depends on this shape.

### Platform admin DTOs

Legacy source: `apps/api/src/modules/platform/platform.types.ts`.

- `CreateAdminInput`: `email`, `password`.
- `UpdateAdminInput`: `status` where status is `active | suspended`.
- `AdminResponse`: `id`, `email`, `status`, `createdAt`, `updatedAt`.
- `PlatformLoginInput`: `email`, `password`.
- `PlatformLoginResult`: `token`, `admin: { id, email }`.

Required backend storage: `PlatformSuperAdmin { id, email, password_hash/passwordHash, status, created_at/createdAt, updated_at/updatedAt }`.

### Owner bootstrap and tenant user DTOs

Legacy source: `apps/api/src/modules/platform/platform.types.ts`.

- `SeedOwnerInput`: `email`, `fullName`, `password`.
- `SeedOwnerResponse`: `id`, `email`, `fullName`, `status`, `role: 'owner'`, `createdAt`.
- `TenantUserView`: `id`, `email`, `fullName`, `status`, `role`, `createdAt`.

Canonical adaptation:

- Map owner bootstrap to `UserRole.admin` unless a new `owner` role is deliberately introduced.
- Split `fullName` into `first_name` and `last_name` or accept canonical first/last-name DTOs instead.
- Map user `status` to current `is_active` unless richer user statuses are added.

### Impersonation DTOs

Legacy source: `apps/api/src/modules/platform/impersonation/impersonation.types.ts`.

- `StartImpersonationInput`: optional `reason`, max 500 chars.
- `StartImpersonationResponse`: `token`, `sessionId`, `companyId`, `expiresAt`.
- `ImpersonationSessionResponse`: `id`, `superAdminId`, `targetCompanyId`, `startedAt`, `endedAt`, `reason`.
- `ImpersonationJwtPayload`: `sub`, `sessionId`, `companyId`, `type: 'impersonation'`, `iat`, `exp`.

Required backend storage: `PlatformImpersonationSession { id, super_admin_id, target_company_id, started_at, ended_at, reason }`.

### Access constants

Legacy source: `apps/api/src/modules/access/access-status.constants.ts`.

- `USER_STATUSES`: `active`, `invited`, `suspended`, `removed`.
- `MEMBERSHIP_STATUSES`: `active`, `invited`, `suspended`, `removed`.

There are no routes, controllers, services, or consumers for this module in `apps/api/src`. It should not be migrated as its own module.

## Module-by-module findings

### `access`

Verdict: waived as a standalone migration.

Why:

- It is only a constants file.
- It has no route surface and no active consumers.
- Canonical backend already has `User.is_active`, `UserRole`, guards, and a permission matrix.
- `MEMBERSHIP_STATUSES` implies a company membership model, but canonical backend uses a single `company_id` per user and has no membership table.

What to preserve:

- If invitations/suspensions are needed later, add an explicit `UserStatus` enum/column or invitation table under `users/auth`.
- Do not create `backend/src/modules/access` for this task.
- Do not extend `permission-matrix.ts` for `access`; platform permissions should be enforced by a separate platform guard, not tenant `UserRole`.

### `platform`

Verdict: migrate in 11.5.

Product value not present in backend:

- Super-admin login/logout and identity separate from tenant users.
- Platform company list/create/update/status/archive.
- Bootstrap first tenant owner/admin.
- Support visibility into tenant users.
- Super-admin CRUD with protections such as no self-suspension and no suspending the last active admin.
- Impersonation with auditable sessions and tenant-context token.
- Platform audit events.

Recommended backend shape:

- Add `backend/src/modules/platform`.
- Add a platform JWT strategy/guard or extend the existing auth strategy to distinguish tenant user, platform admin, and impersonation token types.
- Keep platform routes behind a platform-only guard. Impersonation tokens must not access platform routes.
- Let impersonation tokens pass tenant guards as admin-equivalent in the selected `companyId`, with explicit audit context.
- Add platform audit writes for login/logout, company create/update/status, admin create/status, owner bootstrap, impersonation start/end.

Required Prisma work:

- Add `PlatformSuperAdmin`.
- Add `PlatformImpersonationSession`.
- Add `PlatformAuditEvent`.
- Extend `Company` with platform metadata/status or document any waived fields before UI migration.

### `tenant-provisioning`

Verdict: migrate concept, not implementation.

Why not copy:

- Legacy provisioning creates one PostgreSQL schema per company and applies a tenant DDL file.
- Canonical backend is already built around one schema with tenant isolation by `company_id`.
- Copying `tenant-schema.sql` would reintroduce the duplicate Prisma/database architecture that Phase 11 is meant to remove.

Recommended backend shape:

- Add `backend/src/modules/tenant-provisioning` as an internal service used by `PlatformModule`.
- Provision in a single database transaction where possible.
- Create or update the canonical `Company` row with platform metadata/status.
- Create initial `User` with `role: admin`, `is_active: true`.
- Seed default `CompanyFeature` rows and other canonical defaults needed by MVP.
- Make retries idempotent with upserts or explicit provisioning state.
- Record platform audit events for create/provision/seed-owner outcomes.

## 11.5 implementation checklist

- Add backend Prisma migration for platform models and company metadata/status.
- Implement platform admin auth endpoints.
- Implement `PlatformGuard` and impersonation-aware auth context.
- Implement platform company endpoints under `/platform/companies`.
- Implement platform admin endpoints under `/platform/admins`.
- Implement impersonation endpoints under `/platform/impersonate`.
- Implement canonical tenant provisioning service.
- Add tests for platform guard separation, impersonation token behavior, company provisioning, no self-suspension, and no last-admin suspension.
- Keep `access` waived unless a later task explicitly adds richer user invitation/status flows.
