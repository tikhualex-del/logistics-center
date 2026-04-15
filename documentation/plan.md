План готов. Вот краткая сводка 10 фаз от нуля до рабочего MVP:

  ┌──────┬─────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────┐
  │ Фаза │     Что делаем      │                                        Результат                                         │
  ├──────┼─────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ 0    │ Bootstrap проекта   │ Git, NestJS, Vite+React, Docker (PostgreSQL+Redis), структура папок                      │
  ├──────┼─────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ 1    │ БД и инфраструктура │ Prisma-схема всех таблиц, tenant isolation, логирование, health endpoints, Swagger       │
  ├──────┼─────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ 2    │ Auth и пользователи │ Регистрация компании, JWT логин/refresh, RBAC, guards, permissions                       │
  ├──────┼─────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ 3    │ Основные домены     │ Orders (стейт-машина), Couriers, Routing (RoutingProvider + Yandex), Zones, Audit        │
  ├──────┼─────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ 4    │ Бизнес-логика       │ Compensation (конструктор правил + расчёт выплат), Integrations (CRM API + webhooks)     │
  ├──────┼─────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ 5    │ Real-time           │ Socket.io (GPS курьеров, статусы заказов, алерты), Bull очереди                          │
  ├──────┼─────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ 6    │ Frontend база       │ Auth-страницы, layout с sidebar, role-based routing, API-клиент (axios + TanStack Query) │
  ├──────┼─────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ 7    │ Dispatcher UI       │ Карта (Yandex Maps) + список заказов + маршруты + live-курьеры — ядро продукта           │
  ├──────┼─────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ 8    │ Остальные страницы  │ Курьеры, выплаты + конструктор мотивации, управление пользователями, настройки           │
  ├──────┼─────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ 9-10 │ Тесты и деплой      │ Jest/Vitest тесты критических путей, GitHub Actions CI/CD, Railway + Vercel              │
  └──────┴─────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────┘

  Каждая фаза заканчивается конкретным проверяемым результатом. Зависимости между фазами учтены — есть возможности для параллельной работы (например, фронтенд-база стартует сразу после auth).

● User approved Claude's plan           
  ⎿  Plan saved to: ~\.claude\plans\synchronous-soaring-music.md · /plan to edit          
     Plan: Logistics Center — from zero to working MVP
                                                                                                                                                                                                                                                                                                                       
     Context
                                                                                                                                                                                                                                                                                                                       
     The project "Logistics Center" is a SaaS platform for managing delivery operations for SMBs. The project starts from scratch — no code exists yet, only documentation (CLAUDE.md, PROJECT_IDEA.md, description.md, specificity.md, instructions.md). The developer is solo, uses AI assistance, has no NestJS   
     experience, and prefers Russian comments/commits.                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                     
     The MVP scope (from CLAUDE.md Section 18) includes:
     - Auth (company registration, login, roles)
     - Orders (receive via API, list view, status transitions)
     - Routes (auto-build via Yandex RoutingProvider, manual editing)
     - Couriers (list, online/offline status, GPS tracking)
     - Payments (basic motivation rule constructor, automatic calculation)
     - Integrations (inbound REST API for CRM)
     - Dispatcher UI (map + order list + route management)
     - Observability (structured logging, request ID, health endpoints)

     ---
     Phase 0: Project Bootstrap (foundation)

     0.1 Git & Repository

     - git init in project root
     - Create .gitignore (Node, env, IDE, OS files)
     - Create root README.md with project overview
     - Move existing Documentation/ as-is
     - Create CLAUDE.md at root (copy from Documentation/)
     - Initial commit

     0.2 Backend Scaffold

     - nest new backend (NestJS CLI)
     - Configure tsconfig.json with strict: true
     - Install core dependencies:
       - @nestjs/config (env management)
       - prisma + @prisma/client
       - @nestjs/swagger (auto API docs)
       - class-validator + class-transformer
       - @nestjs/throttler (rate limiting)
       - bcrypt + @nestjs/jwt + @nestjs/passport
       - passport + passport-jwt
       - socket.io + @nestjs/websockets + @nestjs/platform-socket.io
       - @nestjs/bull + bull
       - pino + nestjs-pino (structured logging)
       - uuid
     - Create .env.example with all vars from CLAUDE.md Section 20
     - Set up ESLint + Prettier

     0.3 Database

     - Docker Compose file with PostgreSQL 16 + Redis (for Bull)
     - Initialize Prisma: npx prisma init
     - Configure DATABASE_URL in .env

     0.4 Frontend Scaffold

     - npm create vite@latest frontend -- --template react-ts
     - Install dependencies:
       - tailwindcss + postcss + autoprefixer
       - shadcn/ui setup
       - zustand
       - @tanstack/react-query
       - react-hook-form + zod + @hookform/resolvers
       - react-router-dom v6
       - axios
       - socket.io-client
     - Configure Tailwind, path aliases
     - Create .env with VITE_API_URL, VITE_YANDEX_MAPS_API_KEY, VITE_WS_URL

     0.5 Repository Structure

     /
     ├── backend/
     │   ├── src/
     │   │   ├── modules/
     │   │   ├── common/
     │   │   ├── prisma/
     │   │   └── main.ts
     │   ├── prisma/
     │   │   └── schema.prisma
     │   ├── test/
     │   ├── .env.example
     │   └── package.json
     ├── frontend/
     │   ├── src/
     │   │   ├── pages/
     │   │   ├── components/
     │   │   ├── features/
     │   │   ├── hooks/
     │   │   ├── store/
     │   │   ├── api/
     │   │   └── lib/
     │   ├── .env.example
     │   └── package.json
     ├── docker-compose.yml
     ├── Documentation/
     ├── CLAUDE.md
     ├── .gitignore
     └── README.md

     Deliverable: Project boots (npm run start:dev for backend, npm run dev for frontend), DB connects, empty app runs.

     ---
     Phase 1: Database Schema & Backend Infrastructure

     1.1 Prisma Schema (full MVP schema)

     Define all tables from CLAUDE.md Section 9 with proper relations:
     - companies (tenant root)
     - users (with role enum: admin, dispatcher, courier)
     - couriers (1:1 with users, status, location)
     - dispatchers (1:1 with users)
     - zones (company geo-zones with polygon coordinates)
     - orders (with status enum, coordinates, time windows)
     - order_status_history (append-only transitions log)
     - routes (with status enum, versioned, soft-delete)
     - route_points (order + sequence in route)
     - payment_rule_versions (versioned motivation rules)
     - payments (append-only, with breakdown JSON)
     - payment_recalculations (append-only history)
     - audit_logs (append-only, immutable)
     - integrations (CRM settings per company)
     - integration_events (inbound/outbound log)
     - company_features (feature flags per company)

     All tables (except companies) have company_id, id (uuid), created_at, updated_at.

     Run npx prisma migrate dev to generate first migration.

     1.2 Prisma Service + Tenant Isolation

     - backend/src/prisma/prisma.service.ts — wraps PrismaClient, handles connection lifecycle
     - backend/src/prisma/prisma.module.ts — global module
     - Tenant middleware/extension: auto-filter by company_id where applicable

     1.3 Common Infrastructure

     - Exception filter: global filter that catches all exceptions, formats per CLAUDE.md Section 16 API conventions, logs with requestId
     - Request ID interceptor: generates/reads X-Request-ID, attaches to request context, returns in response
     - Response envelope interceptor: wraps all responses in { data, meta: { requestId, timestamp } }
     - Validation pipe: global pipe using class-validator
     - Structured logging: Pino logger with requestId, companyId, level, timestamp, context
     - Rate limiting: @nestjs/throttler global setup

     1.4 Health Endpoints

     - GET /health — liveness (200 if up)
     - GET /health/ready — readiness (checks DB + Redis connections)

     1.5 Event Constants

     - backend/src/common/events.constants.ts — all domain event names per CLAUDE.md Section 3

     1.6 Swagger Setup

     - Configure Swagger at /api/docs with JWT auth support

     Deliverable: Backend starts, DB has full schema, health endpoints respond, Swagger UI accessible, structured logging works, all requests get requestId.

     ---
     Phase 2: Auth & Users Module

     2.1 Auth Module (backend/src/modules/auth/)

     - auth.controller.ts:
       - POST /api/v1/auth/register — register company + admin user
       - POST /api/v1/auth/login — returns access token, sets refresh cookie
       - POST /api/v1/auth/refresh — refresh access token via httpOnly cookie
       - POST /api/v1/auth/logout — clears refresh cookie
     - auth.service.ts — business logic (hash password, validate, generate tokens)
     - DTOs with validation: register.dto.ts, login.dto.ts
     - JWT strategy (passport-jwt): extracts token from Bearer header
     - Refresh token strategy: extracts from httpOnly cookie
     - Access token TTL: 15 min, Refresh token TTL: 30 days

     2.2 Guards

     - JwtAuthGuard — validates JWT, attaches user to request
     - TenantGuard — validates req.user.companyId is present (global)
     - RolesGuard — checks user role against @Roles() decorator
     - PermissionsGuard — checks user permissions against @RequirePermission() decorator
     - Permission matrix implemented as data (config/DB), not hardcoded if/switch

     2.3 Users Module (backend/src/modules/users/)

     - users.controller.ts:
       - GET /api/v1/users/me — current user profile
       - GET /api/v1/users — list users (admin only)
       - POST /api/v1/users — create user (admin only)
       - PATCH /api/v1/users/:id — update user (admin only)
     - users.service.ts — always filters by companyId

     2.4 Companies Module (backend/src/modules/companies/)

     - companies.service.ts — basic CRUD, feature flags management
     - Feature flags service: isEnabled(flag, companyId) async check

     2.5 Decorators

     - @CurrentUser() param decorator — extracts user from request
     - @Roles('admin', 'dispatcher') — role metadata
     - @RequirePermission('edit:payment-rules') — permission metadata
     - @Public() — marks endpoint as public (skips auth)

     Deliverable: Full auth flow works (register company, login, refresh, logout). RBAC enforced. Multi-tenant isolation tested. Swagger shows all auth endpoints.

     ---
     Phase 3: Core Domain Modules (Backend)

     3.1 Zones Module (backend/src/modules/zones/)

     - CRUD for geo-zones (admin only)
     - Zone has: name, polygon coordinates (GeoJSON), color, base rate
     - Used by routing and compensation modules

     3.2 Orders Module (backend/src/modules/orders/)

     - orders.controller.ts:
       - POST /api/v1/orders — create order (from CRM or dispatcher)
       - GET /api/v1/orders — list with filters (status, date, zone)
       - GET /api/v1/orders/:id — order detail
       - PATCH /api/v1/orders/:id — update order
       - PATCH /api/v1/orders/:id/status — transition status
     - State machine (CLAUDE.md Section 11):
       - new → confirmed → assigned → handed_over → in_transit → delivered/undelivered/returned/cancelled
       - canTransition(from, to) check
       - InvalidStateTransitionException on forbidden transitions
       - Every transition logged to order_status_history + audit_logs
     - Events emitted: order.created, order.status-changed

     3.3 Couriers Module (backend/src/modules/couriers/)

     - couriers.controller.ts:
       - GET /api/v1/couriers — list couriers with status
       - GET /api/v1/couriers/:id — courier detail
       - PATCH /api/v1/couriers/:id/status — online/offline toggle
       - PATCH /api/v1/couriers/:id/location — update GPS (for mobile/testing)
     - Events: courier.location-updated

     3.4 Routing Module (backend/src/modules/routing/)

     - RoutingProvider interface (CLAUDE.md Section 6):
       - buildRoute(points, options) → RouteResult
       - calculateDistance(from, to) → DistanceResult
       - geocode(address) → Coordinates
     - YandexRoutingProvider — implementation using Yandex Maps API
     - routing.service.ts — depends only on RoutingProvider interface
     - routes.controller.ts:
       - POST /api/v1/routes/build — auto-build route for courier
       - GET /api/v1/routes — list routes (with filters: date, courier, status)
       - GET /api/v1/routes/:id — route detail with points
       - PATCH /api/v1/routes/:id — manual edit (reorder points, add/remove)
     - Route state machine: draft → planned → in_progress → completed/cancelled
     - Events: route.built, route.updated, route.cancelled

     3.5 Audit Module (backend/src/modules/audit/)

     - audit.service.ts — listens to domain events, writes audit_logs
     - Captures: actor_id, actor_role, company_id, action, entity_type, entity_id, before, after, timestamp
     - Append-only, never deletable
     - GET /api/v1/audit-logs — query audit logs (admin only)

     Deliverable: All core CRUD endpoints work. State machines enforce valid transitions. Routing integrates with Yandex API (or mock). Audit trail records all critical actions.

     ---
     Phase 4: Business Logic Modules (Backend)

     4.1 Compensation Module (backend/src/modules/compensation/)

     - Payment Rules (versioned):
       - POST /api/v1/payment-rules — create rule
       - GET /api/v1/payment-rules — list active rules
       - PATCH /api/v1/payment-rules/:id — update → creates new version
       - Rule types: zone rate, per-km rate, per-order rate, bonus (SLA, volume), penalty, minimum guarantee
       - Each rule has: type, conditions (JSON), value, active flag, version
     - Payment Calculation:
       - POST /api/v1/payments/calculate — calculate for courier/period
       - GET /api/v1/payments — list payments
       - GET /api/v1/payments/:id — payment detail with breakdown
       - Calculation engine: applies all active rules to courier's completed routes/orders
       - Result stored as append-only record with JSON breakdown
     - Payment state machine: draft → calculated → approved → paid → disputed
     - Events: payment.calculated, payment.approved

     4.2 Integrations Module (backend/src/modules/integrations/)

     - Inbound API (CRM → Logistics Center):
       - POST /api/v1/integrations/orders — receive orders from CRM
       - Idempotency key support (Idempotency-Key header)
       - External ID mapping (external_id_map table)
       - Strict validation of inbound data
     - Outbound Webhooks (Logistics Center → CRM):
       - Webhook registration per company
       - Events pushed: order status changes, route assignment, delivery confirmation
       - HMAC-SHA256 signature (X-Webhook-Signature)
       - Retry with exponential backoff (30s → 2m → 10m → 30m → 2h, max 5)
       - All events logged in integration_events
     - Uses Bull queue for async webhook delivery

     4.3 Notifications Module (backend/src/modules/notifications/)

     - Internal notification system (web only for MVP)
     - New order alerts, status change alerts, route change alerts
     - Delivered via Socket.io to connected dispatchers

     Deliverable: Payment calculation works end-to-end. CRM can push orders via API and receive webhooks. Notifications flow via WebSocket.

     ---
     Phase 5: Real-time & Background Jobs

     5.1 WebSocket Gateway

     - Socket.io gateway with JWT auth
     - Namespaces/rooms per company (tenant isolation)
     - Events:
       - courier:location_updated — GPS broadcast to dispatchers
       - order:status_changed — order status transitions
       - route:updated — route modifications
       - alert:new — new alerts for dispatcher

     5.2 Bull Queues

     - webhook-delivery queue — async webhook sending with retries
     - payment-calculation queue — background payment recalculation
     - Queue dashboard (optional): Bull Board at /admin/queues (admin only)

     Deliverable: Real-time GPS updates flow from courier → server → dispatcher UI. Webhooks delivered asynchronously with retry.

     ---
     Phase 6: Frontend Foundation

     6.1 Project Structure & Config

     frontend/src/
     ├── api/           # axios client + TanStack Query hooks
     │   ├── client.ts  # axios instance with interceptors (auth, requestId)
     │   ├── auth.ts    # useLogin, useRegister, useRefresh hooks
     │   ├── orders.ts  # useOrders, useOrder, etc.
     │   ├── couriers.ts
     │   ├── routes.ts
     │   └── payments.ts
     ├── components/    # shared UI components (shadcn/ui based)
     │   ├── ui/        # shadcn components
     │   ├── layout/    # AppLayout, Sidebar, TopBar
     │   └── common/    # ProtectedRoute, RoleGate, etc.
     ├── features/      # feature-sliced modules
     ├── hooks/         # usePermissions, useAuth, useSocket
     ├── store/         # Zustand stores (UI state only)
     ├── pages/         # route pages
     ├── lib/           # utils, constants
     └── App.tsx        # router setup

     6.2 Auth Flow (Frontend)

     - Login page (/login)
     - Registration page (/register)
     - Auth store (Zustand): token, user, role, permissions
     - Axios interceptor: attach Bearer token, handle 401 → refresh → retry
     - Protected routes wrapper

     6.3 Layout

     - Sidebar navigation (left):
       - Map (main) — dispatcher, admin
       - Couriers — dispatcher, admin
       - Payments — admin
       - Settings — admin
     - Top bar: date picker, search, alerts badge
     - usePermissions() hook for conditional rendering
     - Role-based route protection with redirect

     6.4 API Layer

     - Axios client with base URL from env, auth interceptor, requestId interceptor
     - TanStack Query provider with default options (staleTime, retry)
     - Custom hooks per domain: useOrders(), useCouriers(), useRoutes(), etc.

     Deliverable: Login/register works. Authenticated layout renders with role-based navigation. API client configured and working.

     ---
     Phase 7: Dispatcher UI (Frontend Core)

     7.1 Map Page — Main Screen

     This is THE core screen of the product (CLAUDE.md Section 21).

     Layout:
     [TOP BAR: date picker + search + filters + alerts]
     [SIDEBAR] [         MAP (CENTER)          ] [ORDER LIST (RIGHT)]

     Map (center):
     - Yandex Maps JS API integration
     - Display orders as markers (color-coded by status)
     - Display zones as colored polygons
     - Toggle layers: routes overlay, couriers overlay
     - Click order marker → highlight in list, show details

     Order list (right panel):
     - Scrollable list of orders for selected date
     - Each item: order number, address, time slot, status
     - Click → highlight on map, pan to location
     - Drag & drop to assign to courier/route

     Top bar:
     - Date picker (defaults to today)
     - Search by order number or address
     - Filter by status, time slot
     - Alert badge with dropdown (new orders, changes)

     7.2 Route Management

     - "Build Routes" button → calls POST /api/v1/routes/build
     - Route visualization on map (polylines with direction)
     - Route edit mode: drag points to reorder, add/remove orders
     - Route assignment to courier (dropdown or drag-drop)
     - Route status indicator

     7.3 Real-time Updates

     - Socket.io connection on mount
     - Live courier positions on map (moving markers)
     - Live order status changes (list updates automatically)
     - New order alerts (toast + badge)

     Deliverable: Dispatcher can see orders on map, build routes, assign couriers, track live positions. This is the heart of the MVP.

     ---
     Phase 8: Supporting Frontend Pages

     8.1 Couriers Page

     - Table/list of couriers with: name, status (online/offline), current orders count, location
     - Color coding: green (normal), yellow (risk), red (problem)
     - Click courier → detail view with stats
     - Status toggle (online/offline)

     8.2 Payments Page (admin)

     - Payment rules constructor:
       - Visual blocks: [CONDITION] → [ACTION]
       - Rule types: zone rate, km rate, per-order, bonus, penalty
       - "Simulate payments" button (preview calculation)
     - Payments list:
       - Table: courier, period, amount, status, breakdown
       - Click → detailed breakdown (order-by-order)
       - Approve/dispute actions

     8.3 User Management (admin)

     - Users list with role badges
     - Create user form (name, email, role)
     - Edit user, deactivate user

     8.4 Company Settings (admin)

     - Company profile
     - Integration settings (API keys, webhook URLs)
     - Feature flags toggle

     Deliverable: All MVP frontend screens functional. Admin can manage users, payment rules, and company settings.

     ---
     Phase 9: Testing

     9.1 Backend Tests (Jest + Supertest)

     Priority test coverage:
     1. Auth flow: register, login, refresh, token expiration
     2. Tenant isolation: cross-tenant data leak prevention (CRITICAL)
     3. State machines: order, route, payment transitions (valid + invalid)
     4. Payment calculation: rule application, edge cases, rounding
     5. RBAC: permission checks for all roles
     6. Integration API: idempotency, external ID mapping, validation

     9.2 Frontend Tests (Vitest + Testing Library)

     Priority:
     1. Auth flow (login, token refresh, redirect)
     2. Permission hook (usePermissions)
     3. Payment rules constructor (form logic)
     4. Order status display logic

     Deliverable: Critical paths covered by tests. CI can run full test suite.

     ---
     Phase 10: CI/CD & Deployment

     10.1 GitHub Actions

     - ci.yml: lint + test + build on every push/PR
     - deploy-backend.yml: deploy to Railway on push to main
     - deploy-frontend.yml: deploy to Vercel on push to main

     10.2 Railway Setup

     - PostgreSQL database
     - Redis instance
     - Backend service (Node.js)
     - Environment variables configured

     10.3 Vercel Setup

     - Frontend deployment
     - Environment variables (VITE_API_URL, VITE_YANDEX_MAPS_API_KEY)
     - Build command: npm run build

     Deliverable: Push to main → automatic deploy to production. Full CI pipeline.

     ---
     Implementation Order & Dependencies

     Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4
       (setup)    (DB/infra)   (auth)     (domains)   (business)
                                              │
                                              ├──→ Phase 5 (real-time)
                                              │
     Phase 6 ◄──── Phase 2 needed ────────────┘
     (FE base)         for auth
         │
         ├──→ Phase 7 (dispatcher UI) ◄── Phase 3+5 needed for data+WS
         │
         └──→ Phase 8 (supporting pages) ◄── Phase 4 needed for payments
                   │
                   └──→ Phase 9 (tests) ──→ Phase 10 (deploy)

     Key parallelization opportunities:
     - Phase 6 (FE foundation) can start as soon as Phase 2 (auth) is done
     - Phase 5 (real-time) can be built in parallel with Phase 4 (business logic)
     - Phase 9 (tests) should be written incrementally alongside each phase

     ---
     Verification Plan

     After each phase, verify:

     1. Phase 0: npm run start:dev starts backend, npm run dev starts frontend, Docker DB connects
     2. Phase 1: GET /health/ready returns 200, Swagger UI at /api/docs, Prisma Studio shows all tables
     3. Phase 2: Register company → Login → Get profile → Create user → Permission denied for wrong role
     4. Phase 3: Create order → Transition statuses → Build route → Assign courier → View audit log
     5. Phase 4: Create payment rules → Calculate payment → Verify breakdown → Push order from "CRM" → Receive webhook
     6. Phase 5: Connect WebSocket → Move courier → See update on map
     7. Phase 6: Login page renders → Auth flow works → Layout shows role-based nav
     8. Phase 7: Map loads → Orders show on map → Build route → See couriers move
     9. Phase 8: Manage users → Configure payment rules → View payments → Company settings
     10. Phase 9: npm test passes all suites
     11. Phase 10: Push to main → check Railway + Vercel deployments → test production URL

     ---
     Risk Mitigation

     ┌────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────┐
     │            Risk            │                                     Mitigation                                      │
     ├────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
     │ No NestJS experience       │ Each phase is small. AI assistance for patterns. Start with auth (well-documented). │
     ├────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
     │ Yandex Maps API complexity │ Use mock/stub routing provider for development. Integrate real API later.           │
     ├────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
     │ Scope creep                │ Strictly follow MVP scope from CLAUDE.md Section 18. No Phase 2 features.           │
     ├────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
     │ Multi-tenant bugs          │ Write tenant isolation tests in Phase 2, run them continuously.                     │
     ├────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
     │ Payment calculation errors │ Extensive unit tests with known inputs/outputs.                                     │
     └────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────┘