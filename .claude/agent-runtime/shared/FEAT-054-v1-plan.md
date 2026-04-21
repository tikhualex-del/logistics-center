# Plan: FEAT-054-v1 — API Layer (TanStack Query Hooks)

## Feature
Task 6.4 — API layer (axios + TanStack Query): domain API functions + React Query hooks for all MVP domains.

## Scope
Frontend-only. No backend changes. No schema changes.

## Dependencies
- FEAT-049 (auth store + interceptors) — done
- `frontend/src/api/http-client.ts` — axios instance with Bearer interceptor, ApiResponse<T>
- `frontend/src/api/query-client.ts` — QueryClient configured
- `frontend/src/lib/constants.ts` — QUERY_STALE_TIME, PAGINATION

## MVP Scope Guard
- No Phase 2 features (analytics, AI, mobile, scheduling)
- Domains: orders, couriers, routes, zones, payments (rules + calculation), users
- No audit-logs hooks (admin-only, not in dispatcher UI MVP)
- No integrations hooks (not in dispatcher UI MVP)

---

## Implementation Plan

### Step 1: Query keys constants
**File:** `frontend/src/api/query-keys.ts`

Define QUERY_KEYS object with factory functions for all domains:
- `orders: { all, list(filters), detail(id) }`
- `couriers: { all, list(filters), detail(id) }`
- `routes: { all, list(filters), detail(id) }`
- `zones: { all, list(), detail(id) }`
- `paymentRules: { all, list() }`
- `payments: { all, list(filters), detail(id) }`
- `users: { all, list() }`

### Step 2: Shared types
**File:** `frontend/src/api/types.ts`

Common DTO types aligned with backend:
- `PaginatedResponse<T>` — `{ items: T[], total: number, page: number, limit: number }`
- `PaginationParams` — `{ page?: number, limit?: number }`

### Step 3: Domain API files
**Files:** `frontend/src/api/orders.api.ts`, `couriers.api.ts`, `routes.api.ts`, `zones.api.ts`, `payments.api.ts`, `users.api.ts`

Each file:
- Imports httpClient and ApiResponse from http-client
- Imports domain-specific types
- Exports plain async functions (no hooks)
- Always unwraps: `return response.data.data`
- Never passes companyId in request body (backend extracts from JWT)

#### Orders API (`orders.api.ts`)
Types: `Order`, `OrderStatus`, `OrderFilters`, `CreateOrderDto`, `UpdateOrderDto`, `UpdateOrderStatusDto`
Functions:
- `getOrders(filters: OrderFilters): Promise<PaginatedResponse<Order>>`
- `getOrder(id: string): Promise<Order>`
- `createOrder(data: CreateOrderDto): Promise<Order>`
- `updateOrder(id: string, data: UpdateOrderDto): Promise<Order>`
- `updateOrderStatus(id: string, data: UpdateOrderStatusDto): Promise<Order>`

#### Couriers API (`couriers.api.ts`)
Types: `Courier`, `CourierStatus`, `CourierFilters`, `UpdateCourierStatusDto`, `UpdateCourierLocationDto`
Functions:
- `getCouriers(filters?: CourierFilters): Promise<PaginatedResponse<Courier>>`
- `getCourier(id: string): Promise<Courier>`
- `updateCourierStatus(id: string, data: UpdateCourierStatusDto): Promise<Courier>`
- `updateCourierLocation(id: string, data: UpdateCourierLocationDto): Promise<Courier>`

#### Routes API (`routes.api.ts`)
Types: `Route`, `RouteStatus`, `RouteFilters`, `BuildRoutesDto`, `UpdateRouteDto`, `RoutePoint`
Functions:
- `getRoutes(filters?: RouteFilters): Promise<PaginatedResponse<Route>>`
- `getRoute(id: string): Promise<Route>`
- `buildRoutes(data: BuildRoutesDto): Promise<Route[]>`
- `updateRoute(id: string, data: UpdateRouteDto): Promise<Route>`

#### Zones API (`zones.api.ts`)
Types: `Zone`, `GeoJsonPolygon`
Functions:
- `getZones(): Promise<Zone[]>`
- `getZone(id: string): Promise<Zone>`

#### Payments API (`payments.api.ts`)
Types: `PaymentRule`, `Payment`, `PaymentStatus`, `PaymentFilters`, `CalculatePaymentDto`, `PaymentCalculationResult`
Functions:
- `getPaymentRules(): Promise<PaymentRule[]>`
- `getPayments(filters?: PaymentFilters): Promise<PaginatedResponse<Payment>>`
- `getPayment(id: string): Promise<Payment>`
- `calculatePayment(data: CalculatePaymentDto): Promise<PaymentCalculationResult>`

#### Users API (`users.api.ts`)
Types: `User`, `CreateUserDto`, `UpdateUserDto`
Functions:
- `getUsers(): Promise<User[]>`
- `createUser(data: CreateUserDto): Promise<User>`
- `updateUser(id: string, data: UpdateUserDto): Promise<User>`

### Step 4: TanStack Query hooks
**Files:** `frontend/src/hooks/use-orders.ts`, `use-couriers.ts`, `use-routes.ts`, `use-zones.ts`, `use-payments.ts`, `use-users.ts`

Each file:
- Imports useQuery / useMutation from @tanstack/react-query
- Imports query keys from query-keys.ts
- Imports domain API functions
- Imports QUERY_STALE_TIME from constants
- Returns typed query/mutation objects

Stale time assignments:
- Orders: DEFAULT (30s) — can change frequently but not real-time
- Couriers list: DEFAULT (30s)
- Courier location: REALTIME (0) — live GPS data
- Routes: DEFAULT (30s)
- Zones: LONG (5min) — rarely changes
- Payment rules: LONG (5min) — rarely changes
- Payments: DEFAULT (30s)
- Users: LONG (5min) — rarely changes

Mutations must call `queryClient.invalidateQueries` on success for related query keys.

### Step 5: Update barrel exports
**Files:** `frontend/src/api/index.ts`, `frontend/src/hooks/index.ts`

Add all new exports to barrels.

---

## File List (output)

```
frontend/src/api/query-keys.ts          (new)
frontend/src/api/types.ts               (new)
frontend/src/api/orders.api.ts          (new)
frontend/src/api/couriers.api.ts        (new)
frontend/src/api/routes.api.ts          (new)
frontend/src/api/zones.api.ts           (new)
frontend/src/api/payments.api.ts        (new)
frontend/src/api/users.api.ts           (new)
frontend/src/api/index.ts               (update — add new exports)
frontend/src/hooks/use-orders.ts        (new)
frontend/src/hooks/use-couriers.ts      (new)
frontend/src/hooks/use-routes.ts        (new)
frontend/src/hooks/use-zones.ts         (new)
frontend/src/hooks/use-payments.ts      (new)
frontend/src/hooks/use-users.ts         (new)
frontend/src/hooks/index.ts             (update — add new hook exports)
```

---

## Constraints
- TypeScript strict, no `any`
- No server state in Zustand
- All requests through httpClient
- Always unwrap `response.data.data`
- Never pass companyId in request body
- Mutation success must invalidate related queries
- No Phase 2 features
