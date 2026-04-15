# FEAT-005 v1 вЂ” Plan: Health Endpoints (Liveness + Readiness)

## Overview

Implement two public health endpoints as required by CLAUDE.md Section 14 (Observability):

- `GET /health` вЂ” basic liveness: returns 200 if the NestJS server is running
- `GET /health/ready` вЂ” readiness: checks DB connection (Prisma) and Bull queue connectivity

This is a backend-only task. No frontend, no UX review, no Prisma schema changes.

## Scope

MVP only. No metrics exporters, no Prometheus, no distributed tracing.

---

## Implementation Plan

### Step 1 вЂ” Install @nestjs/terminus

`@nestjs/terminus` is the standard NestJS health checks library. It is not yet in `package.json`.

```bash
cd backend && npm install @nestjs/terminus
```

No additional types package needed вЂ” `@nestjs/terminus` ships its own types.

---

### Step 2 вЂ” Create the health module

Create `backend/src/modules/health/` with the following files:

```
backend/src/modules/health/
в”њв”Ђв”Ђ health.module.ts
в””в”Ђв”Ђ health.controller.ts
```

No service file needed вЂ” `@nestjs/terminus` provides `HealthCheckService`, `PrismaHealthIndicator` does not exist as a built-in, so we implement a custom Prisma indicator using `HealthIndicator` base class.

Files to create:

#### `health.module.ts`
- Imports: `TerminusModule`, `PrismaModule`
- Declares: `HealthController`
- No exports needed (standalone module)

#### `health.controller.ts`
- Route prefix: `health` (NOT under `/api/v1/` вЂ” see routing note below)
- Two endpoints:
  - `GET /health` вЂ” calls `HealthCheckService.check([])` (empty indicators = pure liveness)
  - `GET /health/ready` вЂ” calls `HealthCheckService.check([prismaIndicator, bullIndicator])`
- No auth guards вЂ” endpoints are public
- No ThrottlerGuard override needed (global throttler at 100 req/60s is acceptable)
- Add `@ApiTags('health')` and `@ApiOperation` Swagger decorators

#### `prisma.health-indicator.ts` (inside health module)
- Extends `HealthIndicator` from `@nestjs/terminus`
- Method `isHealthy(key: string)`: runs `prisma.$queryRaw\`SELECT 1\`` 
- Returns `this.getStatus(key, true)` on success, throws `HealthCheckError` on failure

#### `bull.health-indicator.ts` (inside health module)
- Extends `HealthIndicator`
- Method `isHealthy(key: string)`: attempts to get queue status from Bull (ping check)
- If Bull queues are not yet configured/registered, gracefully returns healthy with a note
- Returns `this.getStatus(key, true)` on success, throws `HealthCheckError` on failure

---

### Step 3 вЂ” Routing note (important)

`main.ts` sets `app.setGlobalPrefix('api')` and `app.enableVersioning({ defaultVersion: '1' })`.

This means all routes become `/api/v1/...` by default.

Health endpoints MUST be accessible at `/health` and `/health/ready` (not `/api/v1/health`).

Solution: use `@Controller({ path: 'health', version: VERSION_NEUTRAL })` вЂ” this bypasses URI versioning for the health module. The global prefix `api` must also be excluded.

In `main.ts`, change:
```typescript
app.setGlobalPrefix('api', { exclude: ['health', 'health/ready'] });
```

This makes health endpoints available at:
- `GET /health`
- `GET /health/ready`

---

### Step 4 вЂ” Register health module in AppModule

In `backend/src/app.module.ts`, add `HealthModule` to the `imports` array.

---

### Step 5 вЂ” Write unit test

Create `backend/src/modules/health/health.controller.spec.ts`:
- Test that `GET /health` returns `{ status: 'ok' }`
- Test that `GET /health/ready` calls both indicators
- Mock `HealthCheckService`, `PrismaHealthIndicator`, `BullHealthIndicator`

---

## File Checklist

| File | Action |
|---|---|
| `backend/src/modules/health/health.module.ts` | Create |
| `backend/src/modules/health/health.controller.ts` | Create |
| `backend/src/modules/health/indicators/prisma.health-indicator.ts` | Create |
| `backend/src/modules/health/indicators/bull.health-indicator.ts` | Create |
| `backend/src/modules/health/health.controller.spec.ts` | Create |
| `backend/src/app.module.ts` | Modify вЂ” add HealthModule import |
| `backend/src/main.ts` | Modify вЂ” exclude health from global prefix |
| `backend/package.json` (via npm install) | Modify вЂ” add @nestjs/terminus |

---

## Response shape

`GET /health` (200):
```json
{
  "status": "ok",
  "info": {},
  "error": {},
  "details": {}
}
```

`GET /health/ready` (200):
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "bull": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "bull": { "status": "up" }
  }
}
```

`GET /health/ready` (503 вЂ” DB down):
```json
{
  "status": "error",
  "info": {},
  "error": {
    "database": { "status": "down", "message": "connect ECONNREFUSED" }
  },
  "details": {
    "database": { "status": "down", "message": "connect ECONNREFUSED" }
  }
}
```

---

## Constraints

- No `any` types
- No auth guards on health endpoints
- No business logic вЂ” pure infrastructure
- No Prisma schema changes
- Must not break existing `api/v1/*` routing
- `@nestjs/terminus` must be added to dependencies (not devDependencies)

---

## Agent handoff

- Target agent: `backend-implementer`
- Input: this plan file
- Expected output: `agent-runtime/outputs/FEAT-005-v1-backend.md` + all code files listed above

