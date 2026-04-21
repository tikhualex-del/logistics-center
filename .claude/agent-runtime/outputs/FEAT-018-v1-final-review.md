# FEAT-018-v1-final-review.md
# Technical Review: Auth Module (register/login/refresh/logout)

**Feature ID:** FEAT-018
**Version:** v1
**Reviewer:** technical review
**Date:** 2026-04-16

---

## Final verdict

**approve**

---

## Scope

Reviewed: tasks 2.1a (controller), 2.1b (service), 2.1c (strategies), 2.1d (DTOs)
Scope decision (unified feature): correct. All four tasks are mutually dependent and cannot be split.

---

## Security review

### JWT / Tokens

- Access token TTL = 15m — CLAUDE.md §7 compliant
- Refresh token TTL = 30d — CLAUDE.md §7 compliant
- Refresh token is httpOnly cookie, secure=true in production, sameSite=strict — correct
- Separate secrets: JWT_SECRET (access) and JWT_REFRESH_SECRET (refresh) — correct separation
- Refresh rotation implemented: every /refresh call issues a new refresh token — good
- Stateless logout documented as MVP trade-off — acceptable. No revoke mechanism = risk documented in plan

### Password security

- bcrypt rounds=12 — correct, good performance/security balance
- @MaxLength(72) on password DTO — correctly guards against bcrypt 72-byte truncation attack
- Password hash check with `!user.password_hash` guard before bcrypt.compare — correct
- Consistent "Invalid credentials" message for both "user not found" and "wrong password" — prevents email enumeration

### Tenant isolation

- register(): `runWithoutTenant()` — correct, public endpoint before tenant exists
- login() initial findFirst: `runWithoutTenant()` — correct, no tenant at login time
- login() update + audit: `runWithTenant(companyId)` — correct
- refreshTokens(): `runWithTenant(companyId)` — companyId from JWT payload only
- logout(): `runWithTenant(companyId)` — companyId from JWT payload only
- validateUser(): `runWithTenant(companyId)` — correct
- Controller never reads companyId from request body or query params — CLAUDE.md §5 compliant

### Multi-tenant risk

- Email uniqueness at login: `findFirst` by email without company_id filter — this works because register() enforces global email uniqueness via a pre-check. However, the Prisma schema has @@unique([company_id, email]), NOT a global unique constraint on email. This means two different companies CAN have the same email. The `findFirst` at login would return the first match arbitrarily.

**Note on this pattern:** This is a deliberate MVP design — registration creates a new company, so the first admin's email must be globally unique. But this pattern will break if future features allow inviting users to existing companies with an email already used in another company. The plan correctly documents this risk. For MVP this is acceptable; tracked as technical debt.

### Audit trail

- register → user.registered: logged with company_id, actor_id, before=null, after={email, role, company_id} — correct
- login → user.logged-in: logged in tenant context — correct
- logout → user.logged-out: role correctly passed from JWT payload (fixed during review) — correct
- AuditLog uses Prisma.JsonNull for before field — correct Prisma Json null handling

---

## Architecture review

### Module structure

```
auth/
├── dto/               — register.dto.ts, login.dto.ts, token-response.dto.ts
├── strategies/        — jwt.strategy.ts, refresh.strategy.ts
├── auth.service.ts
├── auth.controller.ts
├── auth.module.ts
└── auth.service.spec.ts
```

Structure follows CLAUDE.md §8 conventions: one module per domain, kebab-case filenames, DTOs in separate files, business logic in service only.

### NestJS patterns

- Controller: only receives/returns, no business logic — correct
- Service: all business logic encapsulated — correct
- DTOs use `declare` keyword for strictPropertyInitialization compatibility — correct pattern
- PrismaLogger injected via constructor — correct NestJS DI pattern
- ConfigService used for all config values — no hardcoded secrets

### Dependency graph

- AuthModule imports: ConfigModule, PassportModule, JwtModule (async) — correct
- AuthModule exports: AuthService, JwtModule — exports JwtModule for future JwtAuthGuard (2.2a)
- PrismaModule is @Global() — no import needed in AuthModule — correct
- AuthModule added to AppModule — correct

### Cookie parser

- `cookieParser()` middleware added to app.setup.ts — required for reading cookies in Express/NestJS
- Positioned before CORS setup — correct order

---

## API contract review

### Endpoints

| Method | Path | Status |
|--------|------|--------|
| POST | /api/v1/auth/register | 201 |
| POST | /api/v1/auth/login | 200 |
| POST | /api/v1/auth/refresh | 200 (jwt-refresh guard) |
| POST | /api/v1/auth/logout | 200 (jwt guard) |

- URI versioning via `defaultVersion: '1'` in app.setup.ts — /api/v1/ prefix confirmed
- Response envelope wrapping via existing ResponseEnvelopeInterceptor — compliant with CLAUDE.md §16
- Error format via existing AllExceptionsFilter — compliant with CLAUDE.md §16

### Swagger

- @ApiTags('auth') on controller — correct
- @ApiBearerAuth('bearer') on logout — correct (matches Swagger setup in app.setup.ts)
- @ApiCookieAuth('refreshToken') on refresh — documented
- @ApiResponse on all endpoints — correct

---

## Code quality

- No `any` types — CLAUDE.md §8 compliant
- Strict TypeScript: 0 compilation errors
- Explicit return types on all public methods — correct
- No console.log — PinoLogger used throughout — CLAUDE.md §14 compliant
- Log entries include: userId, companyId, context — CLAUDE.md §14 compliant

---

## Tests

- 13 unit tests in auth.service.spec.ts
- Full test suite: 43/43 pass
- Coverage: register, login, refresh, logout, validateUser — all happy paths + key failure cases
- Mock pattern: runWithoutTenant/runWithTenant properly mocked as passthrough

---

## Issues found and fixed during review

1. **logout() hardcoded `AuditActorRole.admin`** — Fixed. Role is now passed from JWT payload through controller. Non-admin users (dispatcher, courier) will now be correctly recorded in audit_logs.

---

## Minor observations (non-blocking)

1. **register() does not return refresh token** — intentional design. Register requires a subsequent login to obtain a refresh token. This is a stricter but valid MVP policy. Documented in controller comment.

2. **Email global uniqueness enforcement** — relies on application-level pre-check before company creation. Not enforced at DB level. This is acceptable for MVP but documented as technical debt for when user invitations are introduced.

3. **`Prisma.JsonNull`** — correctly used for JSON nullable fields in audit_logs. Alternative `undefined` would also work but `Prisma.JsonNull` is more explicit.

4. **`is_active` check in refreshTokens()** — the `findFirst({ where: { id: userId } })` query does NOT filter by `is_active`. Disabled user check is done after the query: `if (!user || !user.is_active)`. This is correct behavior — a disabled user is rejected, not silently ignored.

---

## CLAUDE.md compliance

| Section | Status |
|---------|--------|
| §5 Multi-tenant isolation | PASS |
| §7 Auth & Security | PASS |
| §8 Code conventions | PASS |
| §11 Domain state machines | N/A (auth has no state machine) |
| §13 History & deletion | PASS (audit_logs append-only) |
| §14 Observability | PASS |
| §16 API conventions | PASS |
| §18 MVP scope | PASS |

---

## Retry target

N/A — verdict is approve.
