# Final Review: FEAT-054-v1 — API Layer (TanStack Query Hooks)

## Reviewer
Technical review — FEAT-054-v1

## Scope Reviewed
- `frontend/src/api/query-keys.ts`
- `frontend/src/api/types.ts`
- `frontend/src/api/orders.api.ts`
- `frontend/src/api/couriers.api.ts`
- `frontend/src/api/routes.api.ts`
- `frontend/src/api/zones.api.ts`
- `frontend/src/api/payments.api.ts`
- `frontend/src/api/users.api.ts`
- `frontend/src/api/index.ts` (updated)
- `frontend/src/hooks/use-orders.ts`
- `frontend/src/hooks/use-couriers.ts`
- `frontend/src/hooks/use-routes.ts`
- `frontend/src/hooks/use-zones.ts`
- `frontend/src/hooks/use-payments.ts`
- `frontend/src/hooks/use-users.ts`
- `frontend/src/hooks/index.ts` (updated)

---

## Architecture Review

### CLAUDE.md Compliance

| Rule | Status | Notes |
|------|--------|-------|
| Server state ONLY in TanStack Query, NOT in Zustand (§8) | PASS | No server data stored in Zustand stores |
| No `any` type (§8) | PASS | TypeScript strict — zero errors confirmed |
| All requests through httpClient (§16) | PASS | All API files import and use `httpClient` |
| companyId from JWT, never from request body (§5) | PASS | No companyId in any DTO or request body |
| Response envelope unwrapped (`response.data.data`) (§16) | PASS | All API functions correctly unwrap |
| No Phase 2 features in MVP (§18) | PASS | No AI, analytics, mobile, scheduling hooks |
| State machine status types (§11) | PASS | OrderStatus (9 values), RouteStatus (5), PaymentStatus (5) all match CLAUDE.md |
| No magic strings | PASS | QUERY_KEYS centralized factory pattern |

### Multi-tenant Security (§5)
- No companyId in any request body or query param — backend extracts from JWT Bearer token
- No tenant data stored client-side beyond what auth store already holds
- No cross-domain data mixing in hooks

### TypeScript Quality
- No `any` types anywhere — `unknown` used where appropriate (`config: Record<string, unknown>`)
- The `filters as Record<string, unknown>` cast in hooks is justified: query keys accept generic objects for serialization, the strongly-typed filters are passed to queryFn directly
- `id!` non-null assertions are guarded by `enabled: id !== null && id.length > 0` — safe pattern
- All public hook return types are inferred from `useQuery`/`useMutation` — correct TanStack Query pattern

### Query Key Design
- Factory pattern is correct: `['orders']` → `['orders', 'list', filters]` → `['orders', 'detail', id]`
- Hierarchical nesting means `invalidateQueries({ queryKey: QUERY_KEYS.orders.all })` invalidates both list and detail entries — correct TanStack Query v5 behavior
- `as const` ensures literal types throughout

### Stale Time Assignments
- REALTIME (0) for courier detail (live location) — correct
- DEFAULT (30s) for operational lists (orders, couriers, routes, payments) — correct
- LONG (5min) for slow-changing data (zones, payment rules, users) — correct

### Mutation Invalidation
- All mutations that change list-visible data call `invalidateQueries` on `*.all` key
- `updateRoute` / `updateOrder` / `updateCourierStatus` additionally call `setQueryData` on the detail key for immediate UI update without a round-trip — correct optimistic-adjacent pattern
- `useUpdateCourierLocation` intentionally skips list invalidation (WS handles live positions) — documented with comment, correct decision

### API Function Patterns
- Consistent shape: typed params → httpClient call → unwrap `response.data.data` → return typed result
- No business logic in API functions — pure transport layer
- Pagination via query params matches CLAUDE.md §16 (`?page=1&limit=20`)
- `buildRoutes` returns `Route[]` (array) — consistent with POST /routes/build semantics

### Enabled Guards
- All `useOrder`, `useCourier`, `useRoute`, `useZone`, `usePayment` use `enabled: id !== null && id.length > 0`
- Empty string check prevents a query with key `['orders', 'detail', '']` if a component renders before id is known

### Barrel Exports
- `frontend/src/api/index.ts` — complete, all types and functions exported
- `frontend/src/hooks/index.ts` — complete, all hooks exported
- No circular imports (api files don't import from hooks, hooks import from api)

---

## Issues Found

No blocking issues.

**Minor observations (non-blocking):**
1. `useCalculatePayment` has `(_result: PaymentCalculationResult)` with explicit type on unused param — could be `_result` without annotation, but not an error.
2. Zones API returns `Zone[]` (not paginated) — consistent with the backend endpoint design which returns all zones without pagination since companies typically have <50 zones. This is a valid design choice.
3. `getUsers` returns `User[]` (not paginated) — similarly, the user roster for a company is small enough to return all at once. Consistent with backend users module.

---

## Final Verdict

**approve**

Implementation is clean, type-safe, fully compliant with CLAUDE.md. No `any`, no tenant isolation violations, no Phase 2 scope creep. Query key hierarchy is correct, stale times are appropriate for the logistics use case, and mutation invalidation is properly scoped. Ready for use in Phase 7 (Dispatcher UI) and Phase 8 (remaining pages).

## Retry Target
N/A
