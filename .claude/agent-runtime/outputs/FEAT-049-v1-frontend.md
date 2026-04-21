# FEAT-049 v1 — Frontend Output: auth-store-axios-interceptors

## Summary

Implemented auth store integration + Axios 401 interceptors for task 6.2c.
Login and register screens are now connected to the real backend API.
Preview-mode stubs have been removed. The Axios 401 interceptor now performs
refresh-token → retry with queue-based concurrency protection.

## Files Created

### frontend/src/api/auth.api.ts (new)
Typed API functions for all auth endpoints:
- `loginApi(data: LoginRequest): Promise<AuthTokenResponse>` — POST /auth/login
- `registerApi(data: RegisterRequest): Promise<AuthTokenResponse>` — POST /auth/register
- `refreshApi(): Promise<RefreshResponse>` — POST /auth/refresh (exported for direct use)
- `logoutApi(): Promise<void>` — POST /auth/logout
- `extractApiErrorMessage(error: unknown): string` — extracts human-readable error from ApiError shape

All functions use `httpClient` and unwrap the `{ data: T, meta }` envelope.
All request/response types are explicit — no `any`.

### frontend/src/features/auth/use-auth-mutations.ts (new)
TanStack Query mutations:
- `useLoginMutation()` — calls `loginApi`, on success: `setAuth(user, token)` + navigate to `/dispatcher`
- `useRegisterMutation()` — calls `registerApi`, same success flow
- `useLogoutMutation()` — calls `logoutApi`, uses `onSettled` (defensive: always clears auth even on error)

Uses `useNavigate` + `useAuthStore` hooks. Returns mutation objects so callers
can inspect `isPending`, `isError`, `error`.

## Files Modified

### frontend/src/api/http-client.ts
Replaced the placeholder 401 handler with a production-grade refresh→retry interceptor:

**Key design decisions:**
- `refreshClient` — separate `axios.create()` instance for refresh calls, does NOT share interceptors with `httpClient`. Prevents recursive 401 handling.
- `isRefreshing` flag (module-level) — ensures only one refresh call is in flight at a time.
- `failedQueue: QueueEntry[]` — queues concurrent 401 requests while refresh is in flight. All queued requests are retried (or rejected) atomically once the refresh resolves.
- `_retry` flag on `RetryableRequestConfig` — prevents infinite retry loop: a request that already triggered a refresh and still got 401 gives up and logs out.
- `useAuthStore.getState()` — Zustand's public API for imperative store access outside React components. No hooks, no circular dependency.
- Static import of `useAuthStore` (not dynamic `require`) — safe because `auth.store.ts` does not import from `http-client.ts`.

**Refresh flow:**
```
401 received
  → if _retry: clearAuth() + redirect /login
  → if isRefreshing: queue request, return promise
  → else:
      isRefreshing = true, _retry = true
      refreshClient.post('/auth/refresh')
      → success: update localStorage + Zustand, processQueue(null, newToken), retry original
      → failure: processQueue(err, null), clearAuth() + redirect /login
      → finally: isRefreshing = false
```

### frontend/src/features/auth/login-screen.tsx
- Removed `useNavigate` direct import (navigation handled by mutation hook)
- Added `useLoginMutation` + `extractApiErrorMessage` imports
- Replaced `onSubmit` preview stub with `loginMutation.mutateAsync(data)`
- Removed `buildPreviewUser` + `capitalizeWord` helpers
- Removed preview credentials notice block
- Added inline error display (red rounded box) when `loginMutation.isError`
- Button `disabled`/loading text bound to `loginMutation.isPending`
- Default form values changed to empty strings (no pre-filled preview credentials)

### frontend/src/features/auth/register-screen.tsx
- Removed `useNavigate` direct import
- Added `useRegisterMutation` + `extractApiErrorMessage` imports
- Replaced `onSubmit` preview stub with `registerMutation.mutateAsync(data)`
- Removed preview notice block
- Added inline error display when `registerMutation.isError`
- Button bound to `registerMutation.isPending`
- Updated subtitle text (removed preview reference)
- Changed dark card badge from "preview" → "live"

### frontend/src/features/auth/index.ts
Added exports: `RegisterScreen`, `useLoginMutation`, `useRegisterMutation`, `useLogoutMutation`

### frontend/src/api/index.ts
Added exports for all auth API functions and types from `auth.api.ts`

## Architecture decisions

**No circular dependency:** `auth.store.ts` → no api imports. `http-client.ts` → imports `useAuthStore`. `auth.api.ts` → imports `httpClient`. Chain is linear, no cycle.

**Zustand outside React:** `useAuthStore.getState()` is Zustand's documented imperative API. Used in the interceptor (not in a React component) — correct pattern.

**TanStack Query for mutations, not store:** Login/register state (`isPending`, `error`) lives in the mutation object, not Zustand. Zustand only stores the auth result (user + token). Per CLAUDE.md §8.

**Response envelope unwrapping:** All api functions unwrap `response.data.data` so callers get the typed payload directly. The envelope shape is internal to the api layer.

**Error handling strategy:**
- 4xx validation/auth errors → mutation.error → displayed inline in form
- 401 on authenticated request → interceptor refresh → retry or logout
- Network errors → mutation.error → displayed inline

## TypeScript

`tsc --noEmit` passed with 0 errors.

All types explicit:
- `RetryableRequestConfig extends InternalAxiosRequestConfig` for `_retry` flag
- `QueueEntry` for the pending queue
- `AuthTokenResponse`, `RefreshResponse`, etc. — no `any`

## What is NOT included (out of scope)

- Route protection (RouteGuard already exists in `components/route-guard.tsx`)
- Auth store structural changes
- Any backend changes
- OAuth, 2FA, remember-me
- The `pages/login.tsx` old placeholder page (left as-is, not the primary entry point)

## Runtime artifacts

- plan: agent-runtime/shared/FEAT-049-v1-plan.md
- output: agent-runtime/outputs/FEAT-049-v1-frontend.md
