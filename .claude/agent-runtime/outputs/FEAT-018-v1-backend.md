# FEAT-018-v1-backend.md
# Auth Module Implementation Report

**Feature ID:** FEAT-018
**Version:** v1
**Tasks implemented:** 2.1a, 2.1b, 2.1c, 2.1d
**Status:** Complete

---

## Summary

Full auth module implemented: register, login, refresh, logout. All 4 sub-tasks (2.1a–2.1d) delivered as a single cohesive feature per plan scope decision.

---

## Files Created / Modified

### New files

```
backend/src/modules/auth/
├── dto/
│   ├── register.dto.ts          — RegisterDto: email, password, firstName, lastName?, companyName
│   ├── login.dto.ts             — LoginDto: email, password
│   └── token-response.dto.ts   — TokenResponseDto + AuthUserDto
├── strategies/
│   ├── jwt.strategy.ts          — PassportStrategy('jwt') — Bearer token extraction
│   └── refresh.strategy.ts     — PassportStrategy('jwt-refresh') — httpOnly cookie extraction
├── auth.service.ts              — register, login, refreshTokens, logout, validateUser
├── auth.controller.ts           — POST /auth/register|login|refresh|logout
├── auth.module.ts               — Module: PassportModule + JwtModule + AuthService + strategies
└── auth.service.spec.ts         — 13 unit tests
```

### Modified files

```
backend/src/app.module.ts        — Added AuthModule import
backend/src/app.setup.ts         — Added cookieParser() middleware
backend/package.json             — Added cookie-parser + @types/cookie-parser
```

---

## Endpoints Implemented

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/register | Public | Creates company + admin user, returns access token |
| POST | /api/v1/auth/login | Public | Validates credentials, returns access token + sets refresh cookie |
| POST | /api/v1/auth/refresh | jwt-refresh cookie | Rotates refresh token, returns new access token |
| POST | /api/v1/auth/logout | Bearer JWT | Logs out, clears refresh cookie, writes audit entry |

---

## Security implementation

- Password: bcrypt hash with rounds=12
- Access token: JWT 15m, payload { sub, companyId, role, email }
- Refresh token: JWT 30d, httpOnly cookie (secure in production, sameSite=strict), payload { sub, companyId }
- Refresh rotation: every /refresh call issues a new refresh token
- companyId always from JWT — never from request body
- Login search: findFirst by email with runWithoutTenant() bypass (public endpoint)
- Register search: global email uniqueness check before creating company
- Rate limiting: inherited from global AppThrottlerGuard (100 req/60s)

---

## Tenant isolation

- register(): runs in `runWithoutTenant()` — creates Company record (no tenant) + User in transaction
- login(): initial findFirst in `runWithoutTenant()`, then update+audit in `runWithTenant(companyId)`
- refreshTokens(): `runWithTenant(companyId)` — validates user existence
- logout(): `runWithTenant(companyId)` — writes audit entry
- validateUser() (for JWT strategy): `runWithTenant(companyId)`

---

## Audit trail

All auth events write to audit_logs:
- user.registered — on register
- user.logged-in — on login (with last_login_at update)
- user.logged-out — on logout

Note: AuditService (task 3.5) not yet implemented. Direct PrismaService write used — documented as technical debt, to be replaced with event-based approach after 3.5.

---

## Tests

- File: `auth.service.spec.ts`
- Tests: 13 passed
- Coverage: register (success + duplicate email), login (success + wrong password + inactive user + null hash), refreshTokens (success + not found + inactive), logout (audit call), validateUser (found + not found)

---

## Constraints met

- CLAUDE.md §7: JWT 15m access + 30d refresh httpOnly cookie + bcrypt ✓
- CLAUDE.md §14: Pino structured logging with userId/companyId context ✓
- CLAUDE.md §16: /api/v1/ prefix + response envelope via existing interceptor ✓
- CLAUDE.md §5: companyId from JWT only, never from request body ✓
- CLAUDE.md §11: audit_logs for all auth events ✓
- CLAUDE.md §8: no `any` types, strict TS, English code ✓
- TypeScript: 0 compilation errors ✓
- Tests: 43/43 pass (13 new) ✓

---

## Notes for guards (tasks 2.2a–2.2d)

The auth module exports `JwtModule` and `AuthService` for reuse by future JwtAuthGuard (2.2a). The JWT strategy ('jwt') and refresh strategy ('jwt-refresh') are registered in PassportModule. After 2.2a implements JwtAuthGuard, the `@UseGuards(AuthGuard('jwt'))` on `/logout` can be replaced with `@UseGuards(JwtAuthGuard)`, and `@Public()` decorator (2.5) can be added to register/login.

Architecture is ready for 2.2a–2.2d and 2.5 without changes to AuthModule.
