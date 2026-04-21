# FEAT-049 v1 — Final Review Report: auth-store-axios-interceptors

**Feature ID:** FEAT-049
**Version:** v1
**Reviewer:** technical-reviewer
**Task:** 6.2c — Auth Store + Axios Interceptors

---

## Final verdict: approve

---

## Review summary

The implementation correctly wires the existing frontend auth UI to the real backend API.
All four deliverables (auth.api.ts, interceptor upgrade, login integration, register integration)
are implemented cleanly with no architectural violations.

---

## Security review

### Token handling
- Access token stored in localStorage (consistent with existing store pattern)
- Refresh token stored in httpOnly cookie (set by backend, not readable by JS)
- `withCredentials: true` on all clients — refresh cookie sent automatically
- `refreshClient` is a separate `axios.create()` instance with no shared interceptors — correctly prevents recursive 401 loops

### Auth flow correctness
- `_retry` flag prevents infinite retry: a request that 401s after a refresh is rejected, not retried again
- `isRefreshing` + `failedQueue` pattern correctly serialises concurrent 401s — only one refresh call is made, all waiting requests are retried or rejected atomically
- `useAuthStore.getState()` used for imperative store access in the interceptor (Zustand's documented public API — no hooks required)
- Token update in `clearAuthAndRedirect`: `localStorage.removeItem` called first, then `clearAuth()` — correct order (defensive against store failure)

### Multi-tenant safety
- `companyId` comes from the JWT (backend sets it in the token payload and user object)
- Frontend never sends `companyId` in request bodies — only reads it from the user object returned by backend
- Compliant with CLAUDE.md Section 5

### No `any` types
- `extractApiErrorMessage` uses `error as AxiosError<...>` with a specific shape — not `any`
- `RetryableRequestConfig extends InternalAxiosRequestConfig` — proper type extension
- `QueueEntry` interface typed explicitly
- All mutation generic parameters typed: `useMutation<AuthTokenResponse, AxiosError<ApiError>, LoginRequest>`

---

## Architecture review

### Dependency graph (no circular deps)
```
auth.store.ts  ──────────────────────────────────────────────►  (no api imports)
http-client.ts  ──► auth.store.ts
auth.api.ts     ──► http-client.ts
use-auth-mutations.ts ──► auth.api.ts, http-client.ts, auth.store.ts
login-screen.tsx ──► use-auth-mutations.ts, auth.api.ts, auth.store.ts
```
Linear chain. No cycles. Passes review.

### State management compliance (CLAUDE.md §8)
- Server state (login/register pending/error state) is in TanStack Query mutations — correct
- Zustand stores only the auth result (user + token) — correct
- No server state leaked into Zustand

### API convention compliance (CLAUDE.md §16)
- All calls go through `httpClient` which uses `/api/v1` base URL
- Response envelope `{ data: T, meta }` unwrapped at the api layer (callers get typed payload directly)
- Error shape `{ statusCode, message, error, requestId }` handled by `extractApiErrorMessage`

### Feature flag compliance (CLAUDE.md §3)
- Not applicable — auth is a core MVP feature, not an optional module

---

## CLAUDE.md compliance

| Rule | Status |
|------|--------|
| No `any` types | Pass |
| No business logic in components | Pass — mutations in dedicated hooks |
| No server state in Zustand | Pass |
| withCredentials for refresh cookie | Pass |
| companyId from JWT only | Pass |
| TypeScript strict mode | Pass (tsc --noEmit: 0 errors) |
| English code/comments | Pass |
| Mutations use TanStack Query | Pass |
| No direct DB access (n/a frontend) | n/a |
| No Phase 2 features | Pass |

---

## Issues found

### Minor (non-blocking)

1. `login-screen.tsx` still contains the left panel description "Что уже открывает этот экран" which lists operational items — this is cosmetic left-panel copy that was inherited from the previous task and has nothing to do with the auth logic. Not a blocker.

2. `register-screen.tsx` left panel still references "Phase 6.2b" in the text label — minor cosmetic debt, not a code issue.

3. The `refreshApi()` function in `auth.api.ts` uses `httpClient` (with the 401 interceptor), whereas the internal interceptor uses `refreshClient` (without interceptors). The exported `refreshApi()` function is correct for direct use (e.g., a future "refresh on app startup" pattern), but a comment clarifying the difference between this and the interceptor's refresh is helpful. The comment is already present in the code — acceptable.

### No blocking issues found.

---

## Test coverage recommendation

The following unit tests should be added in a follow-up task (not blocking this task):

- `http-client.spec.ts`:
  - 401 triggers refresh attempt
  - concurrent 401s only trigger one refresh call
  - after successful refresh, all queued requests are retried with new token
  - after failed refresh, all queued requests are rejected and auth is cleared
  - non-401 errors pass through unchanged
  - `_retry` flag prevents second refresh attempt

- `use-auth-mutations.spec.ts`:
  - `useLoginMutation` calls setAuth on success
  - `useLogoutMutation` calls clearAuth on both success and error (onSettled)

These are MVP-aligned tests. Recommended for task phase 9 (integration tests).

---

## Pipeline artifacts

- plan: agent-runtime/shared/FEAT-049-v1-plan.md
- frontend: agent-runtime/outputs/FEAT-049-v1-frontend.md
- review: agent-runtime/outputs/FEAT-049-v1-final-review.md
