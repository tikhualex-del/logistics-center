# Frontend Implementation: FEAT-054-v1 — API Layer (TanStack Query Hooks)

## Summary
Implemented complete API layer for all MVP domains: domain API functions, TanStack Query hooks, query key constants, shared types, and updated barrel exports. TypeScript strict mode — zero errors.

## Files Created

### API Layer

**`frontend/src/api/query-keys.ts`** (new)
- Centralized QUERY_KEYS factory object for all 7 domains
- Keys: `orders`, `couriers`, `routes`, `zones`, `paymentRules`, `payments`, `users`
- Pattern: `['domain', 'list'|'detail', ...params]` for targeted invalidation

**`frontend/src/api/types.ts`** (new)
- `PaginationParams` — `{ page?, limit? }`
- `PaginatedResponse<T>` — `{ items, total, page, limit }`

**`frontend/src/api/orders.api.ts`** (new)
- Types: `Order`, `OrderStatus` (7 values per state machine), `OrderFilters`, `CreateOrderDto`, `UpdateOrderDto`, `UpdateOrderStatusDto`
- Functions: `getOrders`, `getOrder`, `createOrder`, `updateOrder`, `updateOrderStatus`
- All unwrap `response.data.data`

**`frontend/src/api/couriers.api.ts`** (new)
- Types: `Courier`, `CourierStatus`, `CourierCoordinates`, `CourierFilters`, `UpdateCourierStatusDto`, `UpdateCourierLocationDto`
- Functions: `getCouriers`, `getCourier`, `updateCourierStatus`, `updateCourierLocation`

**`frontend/src/api/routes.api.ts`** (new)
- Types: `Route`, `RouteStatus` (5 values per state machine), `RoutePoint`, `RouteFilters`, `BuildRoutesDto`, `UpdateRouteDto`
- Functions: `getRoutes`, `getRoute`, `buildRoutes`, `updateRoute`
- POST /routes/build — triggers YandexRoutingProvider on backend

**`frontend/src/api/zones.api.ts`** (new)
- Types: `Zone`, `GeoJsonPolygon`
- Functions: `getZones`, `getZone`
- No pagination (small dataset, returned as array)

**`frontend/src/api/payments.api.ts`** (new)
- Types: `PaymentRule`, `PaymentRuleType` (6 types), `Payment`, `PaymentStatus`, `PaymentBreakdownItem`, `PaymentFilters`, `CalculatePaymentDto`, `PaymentCalculationResult`
- Functions: `getPaymentRules`, `getPayments`, `getPayment`, `calculatePayment`
- POST /payments/calculate — append-only (backend never overwrites)

**`frontend/src/api/users.api.ts`** (new)
- Types: `User`, `CreateUserDto`, `UpdateUserDto`
- Functions: `getUsers`, `createUser`, `updateUser`
- Imports `UserRole` from `@/store/auth.store`

### TanStack Query Hooks

**`frontend/src/hooks/use-orders.ts`** (new)
- `useOrders(filters?)` — staleTime: DEFAULT (30s)
- `useOrder(id)` — staleTime: DEFAULT, enabled guard on null/empty id
- `useCreateOrder()` — invalidates `orders.all` on success
- `useUpdateOrder()` — invalidates list + setQueryData on detail
- `useUpdateOrderStatus()` — invalidates list + setQueryData on detail

**`frontend/src/hooks/use-couriers.ts`** (new)
- `useCouriers(filters?)` — staleTime: DEFAULT
- `useCourier(id)` — staleTime: REALTIME (0), detail view shows live location
- `useUpdateCourierStatus()` — invalidates list + setQueryData on detail
- `useUpdateCourierLocation()` — setQueryData only on detail (WS handles live positions in list)

**`frontend/src/hooks/use-routes.ts`** (new)
- `useRoutes(filters?)` — staleTime: DEFAULT
- `useRoute(id)` — staleTime: DEFAULT, enabled guard
- `useBuildRoutes()` — invalidates `routes.all` (builds multiple records)
- `useUpdateRoute()` — invalidates list + setQueryData on detail

**`frontend/src/hooks/use-zones.ts`** (new)
- `useZones()` — staleTime: LONG (5min)
- `useZone(id)` — staleTime: LONG, enabled guard

**`frontend/src/hooks/use-payments.ts`** (new)
- `usePaymentRules()` — staleTime: LONG
- `usePayments(filters?)` — staleTime: DEFAULT
- `usePayment(id)` — staleTime: DEFAULT, enabled guard
- `useCalculatePayment()` — invalidates `payments.all`

**`frontend/src/hooks/use-users.ts`** (new)
- `useUsers()` — staleTime: LONG (5min, admin-only)
- `useCreateUser()` — invalidates `users.all`
- `useUpdateUser()` — invalidates `users.all`

## Files Updated

**`frontend/src/api/index.ts`** — added exports for all new API functions and types

**`frontend/src/hooks/index.ts`** — added exports for all new hooks

## Compliance Check

| Rule | Status |
|------|--------|
| Server state in TanStack Query only, not Zustand | ✅ |
| No `any` type | ✅ |
| TypeScript strict — zero errors | ✅ |
| companyId never in request body | ✅ |
| All requests through httpClient | ✅ |
| Response envelope unwrapped (`response.data.data`) | ✅ |
| Mutations invalidate related queries | ✅ |
| Stale times from QUERY_STALE_TIME constants | ✅ |
| No Phase 2 features | ✅ |
| State machine status types match CLAUDE.md §11 | ✅ |
