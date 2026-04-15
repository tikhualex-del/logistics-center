# CLAUDE.md — Logistics Center

This is the primary instruction file for the project. Follow it strictly for all code work.

---

## 1. About the Project

**Logistics Center** — a SaaS platform for end-to-end logistics department management for small and medium businesses with their own delivery operations.

Target audience: companies with 5–50 couriers and 20–500 orders per day with in-house delivery.

Three primary interfaces:
- **Manager dashboard** (web) — analytics, KPI, SLA, motivation
- **Dispatcher/logistician workspace** (web) — map, routes, orders, scheduling
- **Courier mobile app** — route, statuses, earnings

> Business and product documentation may be written in Russian. All code artifacts must be in English (see Section 8).

---

## 2. Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Real-time**: Socket.io (courier location, live order/route updates)
- **Queues**: Bull (background tasks: payment recalculation, notifications)
- **Validation**: class-validator + class-transformer (built into NestJS)
- **API Docs**: Swagger (auto-generated via NestJS decorators)

### Frontend (web)
- **Framework**: React 18 + TypeScript + Vite
- **UI library**: shadcn/ui + Tailwind CSS
- **Maps**: Yandex Maps JS API
- **State management**: Zustand (UI state only)
- **Server state / data fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6

### Mobile (Phase 2 — architecture accounts for it from MVP)
- **Framework**: Expo (React Native, TypeScript)
- **Navigation**: Expo Router
- **Maps**: react-native-maps + Yandex MapKit

### External Services
- **Maps & geocoding**: Yandex Maps API (test key available)
- **Routing**: Yandex Routing API — via abstraction layer (see Section 5)
- **AI assistant**: GigaChat API — optional module (see Section 11)
- **Push notifications**: Expo Push Notifications (mobile, Phase 2)

### Infrastructure
- **Backend + DB**: Railway
- **Frontend**: Vercel
- **CI/CD**: GitHub Actions
- **Repository**: Git (GitHub)

---

## 3. Architecture

### Type: Modular Monolith

One backend service with strict domain boundaries inside. Not microservices — intentional decision for the initial phase.

### Principles

- **API-first**: all functionality is accessible via REST API
- **Event-driven for critical state changes**: order statuses, route changes, payment recalculation — via NestJS EventEmitter internal events
- **Audit trail**: all critical actions are logged (route changes, payments, KPI, role assignments)
- **RBAC + permissions**: access controlled by roles and a permission matrix via Guards in NestJS
- **Feature flags**: optional modules and risky features are controlled by company-level feature flags, not hardcoded conditionals (see feature flags rule below)

### Domain Event Naming Convention

Internal events follow the pattern: `<domain>.<action>` (lowercase, hyphen-separated words).

```
order.status-changed
order.created
route.updated
route.built
route.cancelled
payment.calculated
payment.approved
payment.disputed
shift.confirmed
shift.started
courier.location-updated
integration.webhook-failed
```

Rules:
- Always use this format when emitting or subscribing to events via NestJS EventEmitter
- Event payload must include `companyId`, `entityId`, `timestamp`, and relevant data
- Event names are constants, not magic strings — define them in a shared `events.constants.ts`

### Feature Flags

Optional modules and risky features must be controlled by **company-level feature flags**, not hardcoded conditionals.

```typescript
// Correct
if (await featureFlagsService.isEnabled('ai-assistant', companyId)) { ... }

// Wrong
if (process.env.NODE_ENV === 'production') { ... }
if (company.plan === 'premium') { ... }  // plan check in business logic
```

Rules:
- Feature flags are stored per company in the database (`company_features` table)
- Checking a flag is always async and goes through `FeatureFlagsService`
- New optional features ship behind a flag, disabled by default
- Flags can be toggled per company without a deployment

### Repository Structure

```
/
├── backend/
│   ├── src/
│   │   ├── modules/          # Domains (see Section 4)
│   │   ├── common/           # Shared: guards, decorators, pipes, filters, interceptors
│   │   ├── prisma/           # Prisma service + tenant isolation layer
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── test/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── features/         # Feature-sliced structure
│   │   ├── hooks/
│   │   ├── store/            # Zustand stores (UI state only)
│   │   ├── api/              # TanStack Query + axios client
│   │   └── lib/              # utils, constants
│   └── public/
├── mobile/                   # Expo app (Phase 2)
│   └── app/
└── .github/
    └── workflows/
```

---

## 4. Domains

Each domain is a separate NestJS module at `/backend/src/modules/<domain>/`.

| Domain | Description |
|---|---|
| `auth` | Authentication, JWT, refresh tokens |
| `users` | Users, roles, permissions, RBAC |
| `companies` | Companies, tenant management |
| `orders` | Orders, status machine, history |
| `routing` | Routes, route points, RoutingProvider abstraction |
| `couriers` | Courier profiles, location, GPS |
| `dispatchers` | Dispatcher profiles, dispatcher KPI |
| `schedules` | Shifts, scheduling, resource gap tracking |
| `compensation` | Motivation rules (versioned), payment calculation |
| `kpi` | KPI metrics, SLA rules, monitoring |
| `analytics` | Aggregates, reports, dashboards |
| `integrations` | CRM API, inbound/outbound webhooks, exchange log |
| `notifications` | Notifications (web + push) |
| `audit` | Audit log, critical action history |
| `ai` | GigaChat integration, AI assistant (optional) |
| `zones` | Geo-zones, company zone bindings |

---

## 5. Multi-Tenant Isolation

### Strategy: Application-level isolation via `company_id`

Every table (except `companies`) contains a `company_id` field. **All data access must go through the centralized service/repository layer** — never query the database directly from controllers or outside the service layer.

```typescript
// Correct — always pass companyId through the service
ordersService.findAll({ companyId: req.user.companyId, ...filters })

// Wrong — never bypass the service layer
prisma.order.findMany() // no company_id filter = data leak
```

### Implementation rules

- `companyId` is always extracted from the **JWT token** (never from the request body or query params)
- All repository methods must accept and enforce `companyId` as a required parameter
- A `TenantGuard` must be applied globally — it validates that `req.user.companyId` is present on every authenticated request
- Write integration tests that assert cross-tenant data leakage is impossible

### Future migration path

The architecture must allow migration to **PostgreSQL Row Level Security (RLS)** without rewriting domain logic. Keep the service/repository layer clean so RLS can be added as a database-level enforcement later.

---

## 6. Routing Abstraction Layer

The routing domain must not be tightly coupled to Yandex Routing API.

### RoutingProvider interface

```typescript
interface RoutingProvider {
  buildRoute(points: RoutePoint[], options: RouteOptions): Promise<RouteResult>;
  calculateDistance(from: Coordinates, to: Coordinates): Promise<DistanceResult>;
  geocode(address: string): Promise<Coordinates>;
}
```

### Implementation structure

```
modules/routing/
├── providers/
│   ├── routing-provider.interface.ts   # Contract
│   └── yandex-routing.provider.ts      # Current implementation
├── routing.service.ts                  # Uses RoutingProvider (injected)
└── routing.module.ts                   # Binds YandexRoutingProvider
```

### Rules

- `routing.service.ts` depends only on the `RoutingProvider` interface, never on `YandexRoutingProvider` directly
- Switching providers in the future = add a new file in `/providers/`, update the module binding — zero changes to domain logic
- All Yandex-specific configuration (API key, base URL) stays inside `yandex-routing.provider.ts`

---

## 7. Authentication & Security

- **Access token**: JWT, TTL = 15 minutes
- **Refresh token**: stored in httpOnly cookie, TTL = 30 days
- **Password hashing**: bcrypt
- **Roles**: `admin`, `dispatcher`, `courier`
- **Permissions**: see permission matrix below
- **Rate limiting**: @nestjs/throttler on all public endpoints
- **Input validation**: class-validator on all DTOs
- **HTTPS**: required in production (Railway + Vercel provide automatically)

### Permission Matrix

| Action | admin | dispatcher | courier |
|---|:---:|:---:|:---:|
| View orders | ✅ | ✅ | own only |
| Create/edit orders | ✅ | ✅ | ❌ |
| Build/edit routes | ✅ | ✅ | ❌ |
| Edit geo-zones | ✅ | ❌ | ❌ |
| Edit payment rules | ✅ | ❌ | ❌ |
| Approve motivation rules | ✅ | ❌ | ❌ |
| View financial analytics | ✅ | ❌ | ❌ |
| View operational analytics | ✅ | ✅ | ❌ |
| View own earnings | ✅ | ❌ | ✅ |
| Manage couriers | ✅ | ✅ | ❌ |
| Manage shifts | ✅ | ✅ | ❌ |
| Connect integrations | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |

### Guard usage (required)
```typescript
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
@RequirePermission('edit:payment-rules')
```

### Role extensibility

The permission system must support adding new roles in the future without redesigning the authorization architecture.

Rules:
- Roles and permissions must be data-driven, not hardcoded in `if/switch` statements
- Adding a new role = adding a record + assigning permissions, not changing Guard logic
- The `PermissionsGuard` checks permissions, not role names — role-to-permission mapping is configuration, not code

---

## 8. Code Conventions

### Language

- **Code, comments, variable names, function names, classes**: English
- **Git commits, PR titles and descriptions**: English
- **Technical documentation** (README, ADRs, API docs): English
- **Business and product documentation** (description.md, PROJECT_IDEA.md, etc.): Russian is acceptable
- **File names**: kebab-case (e.g., `payment-rules.service.ts`)

### TypeScript

- Strict mode: `"strict": true` in tsconfig
- No `any` — use `unknown` or proper types
- All public service methods must have explicit return types

### NestJS patterns

- One module per domain
- Module structure: `controller` → `service` → repository (via Prisma)
- DTOs in separate files: `create-order.dto.ts`, `update-order.dto.ts`
- Business logic only in services, never in controllers
- Controllers only receive requests and return responses

### React patterns

- Feature-sliced approach in `/features/`
- Functional components only, no class components
- Custom hooks for API interaction logic (`useOrders`, `useCouriers`)
- No server state in Zustand — use TanStack Query for all server data
- Zustand only for UI state (open modals, selected filters, etc.)

### Role-based UI visibility

Frontend navigation and page access must be filtered by role and permission — not only protected on the backend.

```typescript
// Use a hook to check permissions in components
const { can } = usePermissions()

// Conditionally render nav items and page sections
{can('view:financial-analytics') && <NavItem href="/analytics/finance" />}
{can('edit:payment-rules') && <EditRulesButton />}
```

Rules:
- A `usePermissions()` hook reads the current user's role and permissions from auth state
- Navigation items not accessible to the current role must not be rendered (not just disabled)
- Route-level protection: unauthorized access to a page redirects to the appropriate fallback, not a generic 403
- Permission checks on frontend are UX-only — backend Guards remain the authoritative enforcement

---

## 9. Data Model — Key Prisma Entities

All tables contain `company_id` (except `companies`).

```
companies               — tenant root
users                   — users with role
couriers                — courier profile (1:1 with users)
dispatchers             — dispatcher profile (1:1 with users)
zones                   — company geo-zones
orders                  — orders, coordinates, status, time windows
routes                  — courier route for a day (versioned)
route_points            — route points (order + sequence)
shifts                  — courier shifts
payment_rule_versions   — versioned motivation rules
payments                — final payouts with breakdown (JSON), append-only
payment_recalculations  — history of recalculations
kpi_rules               — KPI rules per role
sla_rules               — SLA rules
audit_logs              — critical action log (append-only)
integrations            — CRM integration settings
integration_events      — inbound/outbound event log
ai_recommendations      — AI assistant recommendations (optional)
```

### Required fields for every table
```prisma
id         String   @id @default(uuid())
company_id String
created_at DateTime @default(now())
updated_at DateTime @updatedAt
```

---

## 10. Migration Discipline

- All database schema changes must go through **Prisma migrations** — never apply manual SQL changes to a shared or production database
- No manual schema drift: the migration history in `prisma/migrations/` is the single source of truth for DB schema
- Every migration file must be committed alongside the code change that requires it
- **Destructive migrations** (dropping columns, renaming fields, changing types) require explicit review before merging:
  - Add a comment in the migration file explaining the reason
  - Ensure a rollback plan exists or the migration is backwards-compatible
  - Test against a copy of production data if possible
- Never edit an already-applied migration file — create a new one instead

---

## 11. Domain State Machines

State transitions must be enforced in code — invalid transitions throw errors.

### Order
```
new → confirmed → assigned → handed_over → in_transit
                                                ↓
                                    delivered / undelivered / returned / cancelled
```

### Route
```
draft → planned → in_progress → completed / cancelled
```

### Shift
```
scheduled → confirmed → active → completed / no_show / cancelled
```

### Payment
```
draft → calculated → approved → paid → disputed
                  ↑
        (recalculated returns to calculated)
```

Rules:
- Each domain service must implement a `canTransition(from, to)` check
- Forbidden transitions must throw a typed `InvalidStateTransitionException`
- Every transition is logged to `audit_logs`

---

## 12. Integrations

### Inbound API (CRM → Logistics Center)

- Accepts orders, client data, time slots, delivery parameters
- All inbound requests require **idempotency keys** (`Idempotency-Key` header)
- Duplicate requests with the same key return the cached response without re-processing
- External CRM entity IDs are stored in a dedicated field (`external_id`) and mapped to internal UUIDs in an `external_id_map` table
- Inbound data is validated strictly — invalid payloads are rejected with a detailed error, never silently ignored

### Outbound Webhooks (Logistics Center → CRM)

- Events pushed: order status changes, route assignment, delivery confirmation, payment calculated
- Each webhook includes a **signature** (`X-Webhook-Signature: HMAC-SHA256`) for verification by the receiver
- **Retry policy**: exponential backoff, max 5 attempts: 30s → 2m → 10m → 30m → 2h
- Failed events after all retries are stored in `integration_events` with `status: failed` and can be manually retriggered
- All sent events are logged in `integration_events` (timestamp, payload, response, status)

### External ID Mapping

```typescript
// Always use the mapping layer — never expose internal UUIDs to CRM
integrationService.resolveExternalId(externalId, 'order', companyId)
integrationService.registerExternalId(internalId, externalId, 'order', companyId)
```

---

## 13. History & Data Deletion Rules

The following entities **must never be physically deleted**:

| Entity | Strategy |
|---|---|
| `payments` | Append-only. No updates, no deletes. Corrections = new record |
| `payment_recalculations` | Append-only. Every recalculation stored with reason |
| `payment_rule_versions` | Versioned. New version on every change. Old versions immutable |
| `routes` | Soft delete only (`deleted_at`). Route history must be preserved |
| `audit_logs` | Append-only. Immutable after insert |
| `order` status transitions | Append-only log in `order_status_history` |
| `integration_events` | Append-only |

### Payment rules versioning

```typescript
// When a payment rule is changed, always create a new version
paymentRuleVersions.create({
  rule_id: ruleId,
  version: previousVersion + 1,
  config: newConfig,
  changed_by: userId,
  changed_at: now(),
  reason: changeReason,
})
// Previous version remains intact and linked to historical payments
```

### Soft delete pattern

For entities that support soft delete, always filter by `deleted_at IS NULL` in the repository layer. Never rely on callers to add this filter.

---

## 14. Observability

These are production requirements, not optional extras.

### Structured logging

- Use a structured logger (e.g., Pino or Winston) — no `console.log` in production code
- Every log entry must include: `timestamp`, `level`, `requestId`, `companyId` (when in tenant context), `message`, `context` (module name)

```typescript
logger.log({ requestId, companyId, action: 'route.built', courierId, orderCount })
```

### Request ID / Correlation ID

- Every incoming HTTP request gets a `requestId` (UUID, generated if not provided in `X-Request-ID` header)
- `requestId` is propagated through all service calls and logged with every entry
- `requestId` is returned in the response header `X-Request-ID`

### Health Endpoints

```
GET /health        — basic liveness (returns 200 if server is up)
GET /health/ready  — readiness (checks DB connection, queue connectivity)
```

### Error Tracking

- All unhandled exceptions must be caught by a global NestJS exception filter
- Errors are logged with full context: `requestId`, `userId`, `companyId`, stack trace
- In production, integrate with an error tracking service (Sentry or equivalent)

### Auditability

- All critical actions (see audit_logs table) must include: `actor_id`, `actor_role`, `company_id`, `action`, `entity_type`, `entity_id`, `before` (snapshot), `after` (snapshot), `timestamp`
- Audit log entries are never deletable — not even by admins

---

## 15. AI Assistant (Optional Module)

AI is an optional enhancement — it must not block or be required by core business processes.

### Rules

- The `ai` module has **no incoming dependencies** from core domains (`orders`, `routing`, `compensation`, etc.)
- Core domains may emit events that the AI module listens to — but core processes complete regardless of whether AI responds
- AI recommendations are stored and displayed asynchronously — never in the request/response path of critical operations
- If GigaChat API is unavailable, the system continues operating normally
- AI features are gated by a feature flag per company

### Phase 2 scope

AI assistant is a Phase 2 feature. In Phase 1 (MVP), the `ai` module exists as a placeholder only — no implementation required.

---

## 16. API Conventions

### REST

- Versioning: `/api/v1/...`
- Response envelope — always:
```json
{ "data": ..., "meta": { "requestId": "...", "timestamp": "..." } }
```
- Errors:
```json
{ "statusCode": 400, "message": "...", "error": "Bad Request", "requestId": "..." }
```
- Pagination via query: `?page=1&limit=20`
- Filters via query: `?status=active&zone_id=...`

### Endpoint naming
```
GET    /api/v1/orders            — list
GET    /api/v1/orders/:id        — detail
POST   /api/v1/orders            — create
PATCH  /api/v1/orders/:id        — update
DELETE /api/v1/orders/:id        — soft delete (only where applicable)
POST   /api/v1/routes/build      — action (verb after slash)
```

### WebSocket events (Socket.io)
```
courier:location_updated    — GPS update
order:status_changed        — order status transition
route:updated               — route modification
alert:new                   — new alert for dispatcher
```

---

## 17. Testing

### Backend (Jest + Supertest)

- **Unit tests**: for services with business logic — especially `compensation`, `kpi`, `routing`, state machines
- **Integration tests**: for API endpoints via Supertest + test database
- **Test database**: separate PostgreSQL via Docker Compose
- Mandatory coverage: payment calculation, order/route/payment state machine transitions, RBAC checks, tenant isolation (cross-tenant leak tests)

### Frontend (Vitest + Testing Library)

- Unit tests for utility functions and hooks
- Component tests for key forms (motivation constructor, route builder)

### Convention

- Test files alongside source: `payment-rules.service.spec.ts`
- One test file per module/component

---

## 18. MVP — Scope & Priorities

### Phase 1 (MVP)

| Module | Minimum viable functionality |
|---|---|
| Auth | Company registration, login, roles |
| Orders | Receive via API, list view, status transitions |
| Routes | Auto-build via Yandex (RoutingProvider), manual editing |
| Couriers | List, online/offline status, GPS tracking |
| Payments | Basic motivation rule constructor, automatic calculation |
| Integrations | Inbound REST API for CRM (receive orders, return statuses + webhooks) |
| Dispatcher UI | Map + order list + route management |
| Observability | Structured logging, request ID, health endpoints |

### Phase 2+ (explicitly excluded from MVP)

- **Mobile app** (courier app) — Phase 2
- **AI assistant** (GigaChat) — Phase 2
- **Full analytics & manager dashboards** — Phase 2
- **KPI monitoring** — Phase 2
- **SLA monitoring** — Phase 2
- **Shift scheduling** — Phase 2
- **Push notifications** — Phase 2

> Architecture and data schema in MVP must account for Phase 2. No dead-end decisions.

---

## 19. CI/CD (GitHub Actions)

**`ci.yml`** — on every push/PR:
1. Lint (ESLint)
2. Tests (Jest)
3. Build check

**`deploy-backend.yml`** — on push to `main`:
1. Deploy to Railway

**`deploy-frontend.yml`** — on push to `main`:
1. Deploy to Vercel

---

## 20. Environment Variables

### Backend (`.env`)
```
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
YANDEX_MAPS_API_KEY=
YANDEX_ROUTING_API_KEY=
GIGACHAT_CLIENT_ID=
GIGACHAT_CLIENT_SECRET=
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
SENTRY_DSN=
```

### Frontend (`.env`)
```
VITE_API_URL=
VITE_YANDEX_MAPS_API_KEY=
VITE_WS_URL=
```

Never commit `.env` files. A `.env.example` with empty values is required.

---

## 21. Map as the Core of the System

The dispatcher's main screen is the map. This is the central UX principle of the entire product.

Map displays:
- Orders (points)
- Geo-zones (colored areas)
- Routes (optional toggle)
- Couriers (optional toggle)

**Right panel** — order list. Click order → highlight on map. Drag & drop to courier.

**Top bar** — date picker, search, filters, alerts.

**Route building modes**: manual / automatic / AI-assisted (Phase 2).

---

## 22. Hard Rules — Never Violate

- Do not make the dispatcher UI look like a CRM — the map is the center, not a table
- Do not hide important data behind unnecessary clicks
- Do not put business logic in controllers — services only
- Do not use `any` in TypeScript
- Do not commit secrets or `.env` files
- Do not bypass tenant isolation — every DB query must be filtered by `company_id` through the service layer
- Do not query the database directly from controllers
- Do not physically delete payments, routes, audit logs, or motivation rule versions
- Do not make AI a required dependency of any core domain
- Do not hardcode routing provider — always use `RoutingProvider` interface
- Do not hardcode role checks in `if/switch` statements — permissions must be data-driven
- Do not ship optional features without a feature flag
- Do not hide nav items or pages with CSS — render them conditionally based on permissions
- Do not apply manual SQL to shared/production databases — migrations only
- Do not let agents violate their boundaries — each agent has a defined role (see Section 23)
- Do not skip the planner for new or large features — plan before implement
- Do not manipulate pipeline state from any agent except orchestrator
- Do not overwrite previous version artifacts — each retry creates a new version
- Do not create Feature IDs from any agent except orchestrator

---

## 23. Agent Teams — Multi-Agent Development

Development of Logistics Center is coordinated through a team of specialized AI agents. Each agent has a defined role, strict boundaries, and communicates through a shared runtime system.

> Agent definitions: `.claude/agents/<agent-name>.md`
> Runtime system: `.claude/agent-runtime/`

### Team Structure

| Agent | Role | Model | Writes to |
|---|---|---|---|
| `orchestrator` | Lead coordinator — routes tasks, manages pipeline, owns Feature IDs | sonnet | `state/`, `messages/` |
| `planner` | Decomposes features into safe, ordered implementation steps | opus | `shared/` |
| `backend-implementer` | Implements NestJS modules, services, APIs strictly by plan and CLAUDE.md | opus | `outputs/`, project code |
| `frontend-implementer` | Implements React UI/UX with map-first principle | sonnet | `outputs/`, project code |
| `operations-ux-reviewer` | Reviews UX for operational efficiency — speed, data density, map-first | sonnet | `outputs/` |
| `reviewer` | Final gate — security, architecture, multi-tenant, CLAUDE.md compliance | opus | `outputs/` |

### Agent Boundaries

Each agent operates within strict, non-overlapping boundaries:

**orchestrator** is the ONLY agent that:
- creates and manages Feature IDs (`FEAT-XXX`)
- writes to `agent-runtime/state/` (`pipeline-status.json`, `features.json`)
- creates messages in `agent-runtime/messages/`
- invokes runtime-manager CLI commands (`create-feature`, `set-step`, `retry`, `complete`)
- decides which agent runs next in the pipeline
- communicates final results to the user

**planner** produces structured plans — never code. Output goes to `shared/`.

**implementers** (backend, frontend) write project code AND output summary reports. Output goes to `outputs/`.

**reviewers** (UX, technical) produce review reports with verdicts. Output goes to `outputs/`. They never write project code.

No agent may perform another agent's work. If an agent encounters a task outside its boundaries, it must stop and indicate the issue.

### Runtime System

```
.claude/agent-runtime/
├── shared/       # Plans, specs, handoff context (planner writes here)
├── outputs/      # Implementation summaries, review reports (all agents except orchestrator)
├── state/        # Pipeline status, feature registry (orchestrator ONLY)
│   ├── pipeline-status.json
│   ├── features.json
│   └── dashboard.md
├── messages/     # Handoff/retry messages between agents (orchestrator ONLY)
└── scripts/
    └── runtime-manager.js   # CLI for pipeline control (orchestrator ONLY)
```

Access rules:
- `shared/` — planner writes, implementers read
- `outputs/` — implementers and reviewers write, orchestrator and reviewers read
- `state/` — orchestrator writes (via CLI), all agents read
- `messages/` — orchestrator writes, target agent reads

### Artifact Naming Convention

All runtime artifacts follow a strict naming pattern:

```
FEAT-XXX-vN-<stage>.md
```

| Component | Meaning | Example |
|---|---|---|
| `FEAT-XXX` | Feature ID (auto-generated by orchestrator) | `FEAT-001` |
| `vN` | Version (starts at v1, incremented on retry) | `v2` |
| `<stage>` | Pipeline stage that produced the artifact | `plan`, `backend`, `frontend`, `ux-review`, `final-review` |

Full examples:
```
agent-runtime/shared/FEAT-001-v1-plan.md
agent-runtime/outputs/FEAT-001-v1-backend.md
agent-runtime/outputs/FEAT-001-v1-frontend.md
agent-runtime/outputs/FEAT-001-v1-ux-review.md
agent-runtime/outputs/FEAT-001-v1-final-review.md
agent-runtime/messages/FEAT-001-v1-msg-001-orchestrator-to-planner.md
```

### Pipeline Workflow

Standard feature pipeline (full chain):

```
user request
    │
    ▼
orchestrator ──► planner ──► backend-implementer ──► frontend-implementer ──► operations-ux-reviewer ──► reviewer
    │                                                                                                       │
    │◄──────────────────────────────────────────────────────────────────────────────────────────────────────┘
    │
    ▼
verdict: approve / approve with fixes / reject
```

Steps are skipped when not applicable:
- Backend-only feature → skip frontend + UX reviewer
- UI-only change → skip backend
- Review-only request → skip planner + implementers

#### Feature Lifecycle

| Step | Actor | Action | Artifact |
|---|---|---|---|
| 1. Create | orchestrator | `create-feature "<name>"` → assigns `FEAT-XXX` | `features.json` updated |
| 2. Plan | planner | Decomposes task into structured plan | `shared/FEAT-XXX-v1-plan.md` |
| 3. Backend | backend-implementer | Implements backend per plan | `outputs/FEAT-XXX-v1-backend.md` + project code |
| 4. Frontend | frontend-implementer | Implements UI per plan + backend API | `outputs/FEAT-XXX-v1-frontend.md` + project code |
| 5. UX Review | operations-ux-reviewer | Evaluates operational UX | `outputs/FEAT-XXX-v1-ux-review.md` |
| 6. Tech Review | reviewer | Final security/architecture review | `outputs/FEAT-XXX-v1-final-review.md` |
| 7. Verdict | orchestrator | Reads verdict, completes or retries | `pipeline-status.json` updated |

#### Review Outcomes

| Verdict | Orchestrator action |
|---|---|
| `approve` | `complete <FEAT-XXX> approve` — pipeline done |
| `approve with fixes` | `retry <FEAT-XXX> <target-agent>` — version incremented, targeted rework |
| `reject` | `retry <FEAT-XXX> <target-agent>` — version incremented, may go back to planner |

### Pipeline Control (CLI)

Orchestrator manages the pipeline through `runtime-manager.js`:

```bash
# Create a new feature (assigns FEAT-XXX, initializes v1)
node .claude/agent-runtime/scripts/runtime-manager.js create-feature "<feature name>"

# Move pipeline to next step
node .claude/agent-runtime/scripts/runtime-manager.js set-step <FEAT-XXX> <agent-name>

# Retry after review rejection (auto-increments version to vN+1)
node .claude/agent-runtime/scripts/runtime-manager.js retry <FEAT-XXX> <target-agent>

# Complete pipeline (only when verdict = approve)
node .claude/agent-runtime/scripts/runtime-manager.js complete <FEAT-XXX> approve
```

The dashboard at `agent-runtime/state/dashboard.md` is auto-updated by runtime-manager after every CLI command.

### Direct Mode vs Pipeline Mode

| Mode | When to use | Process |
|---|---|---|
| **Direct** | Small isolated tasks: fix a bug, add a field, update a style | User → specific agent → done |
| **Pipeline** | New features, multi-domain changes, anything touching >1 agent's area | User → orchestrator → full pipeline → done |

Use pipeline mode when:
- The task spans multiple domains (e.g., new API + new UI)
- The task is new and the scope is not fully defined
- The task involves security-sensitive changes (auth, multi-tenant, payments)
- The task changes data schema or API contracts

### Routing Rules (for orchestrator)

| Request type | Route to |
|---|---|
| "plan a feature", "decompose task" | planner |
| "implement backend module/service/API" | backend-implementer (requires existing plan) |
| "implement UI/page/component" | frontend-implementer (requires existing plan) |
| "review UX", "check usability" | operations-ux-reviewer |
| "review code", "check implementation" | reviewer |
| "implement a new feature" (full) | planner → backend → frontend → ux-reviewer → reviewer |

### Coordination Rules

1. **Plan before implement** — no implementation without a plan for new or large features
2. **Review after implement** — all code changes must end with technical review
3. **UX review for UI** — all dispatcher-facing UI goes through operations-ux-reviewer
4. **MVP scope guard** — agents must not add Phase 2 features (Section 18)
5. **CLAUDE.md is law** — all agents must follow every rule in this document
6. **Immutable versions** — never overwrite previous version artifacts; each retry = new version
7. **Single source of truth** — orchestrator is the only source of pipeline state
8. **No boundary violations** — agents must not perform other agents' work
9. **Runtime-first** — in pipeline mode, update runtime state BEFORE passing to next agent
10. **No orphan pipelines** — every `create-feature` must eventually reach `complete` or be explicitly abandoned

### Agent Invocation

Agents are invoked via Claude Code's Agent tool with `subagent_type`:

| subagent_type | Agent |
|---|---|
| `orchestrator` | Route and manage feature pipeline |
| `planner` | Decompose feature into implementation plan |
| `backend-implementer` | Implement NestJS backend code |
| `frontend-implementer` | Implement React frontend code |
| `operations-ux-reviewer` | Review operational UX |
| `reviewer` | Final technical review |

Example invocation pattern:
```
User: "Implement the orders module"
→ Agent tool: subagent_type="orchestrator", prompt="Implement orders module..."
→ Orchestrator: create-feature → planner → backend-implementer → reviewer
```

### Skills Integration

Specialized skills (defined in `.claude/` settings) provide additional domain expertise:

| Skill | Purpose |
|---|---|
| `project-architect` | Architecture design and quality control |
| `prisma-schema-designer` | Database schema design with Prisma |
| `nestjs-backend-builder` | NestJS module patterns and best practices |
| `api-contract-designer` | REST API contract design |
| `auth-security-guardrail` | Auth, authorization, multi-tenant safety |
| `map-ui-specialist` | Map-first UI design for logistics operations |
| `test-writer` | Tests for critical business logic |

Skills are advisory tools — they inform decisions but do not own pipeline steps. Agents may invoke skills for domain guidance during their work.
