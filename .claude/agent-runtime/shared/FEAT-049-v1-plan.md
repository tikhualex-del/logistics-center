# FEAT-049-v1-plan.md
# Auth Store + Axios Interceptors (task 6.2c)

**Feature ID:** FEAT-049
**Version:** v1
**Task:** 6.2c — Auth store + interceptors
**Dependency:** FEAT-047 (login page), FEAT-048 (register page) — both done

---

## Goal

Wire the existing frontend auth UI (login-screen, register-screen) to the real backend API.
Replace preview-mode stubs with real TanStack Query mutations and upgrade the Axios 401 interceptor
to implement the refresh-token → retry pattern with queue-based concurrency protection.

---

## Task type

Frontend implementation (no backend changes required)

---

## Scope decision

This feature is **frontend-only**. The backend auth module (FEAT-018) is complete.
The existing Zustand auth store structure is correct and must NOT be redesigned.
All visual UI in login-screen.tsx and register-screen.tsx must remain unchanged —
only the `onSubmit` handlers and preview-mode blocks are replaced.

**Explicitly OUT OF SCOPE:**
- Route protection / RouteGuard changes
- Auth store structural changes
- Any backend changes
- OAuth, 2FA, remember-me
- TypeScript type widening or `any` usage

---

## Affected files

| File | Action |
|------|--------|
| `frontend/src/api/auth.api.ts` | Create — typed API functions |
| `frontend/src/features/auth/use-auth-mutations.ts` | Create — TanStack Query mutations |
| `frontend/src/api/http-client.ts` | Modify — upgrade 401 interceptor |
| `frontend/src/features/auth/login-screen.tsx` | Modify — swap preview for real mutation |
| `frontend/src/features/auth/register-screen.tsx` | Modify — swap preview for real mutation |
| `frontend/src/features/auth/index.ts` | Modify — export new hook |

---

## Backend API reference (FEAT-018)

All endpoints under `/api/v1/auth`, response envelope: `{ data: T, meta: { requestId, timestamp } }`

| Method | Path | Auth | Body | Response data |
|--------|------|------|------|---------------|
| POST | `/auth/login` | Public | `{ email, password }` | `{ accessToken, user }` |
| POST | `/auth/register` | Public | `{ email, password, firstName, lastName?, companyName }` | `{ accessToken, user }` |
| POST | `/auth/refresh` | httpOnly cookie | — | `{ accessToken }` |
| POST | `/auth/logout` | Bearer JWT | — | `{ message: 'Logged out' }` |

`user` shape from backend: `{ id, email, firstName, lastName, role, companyId }`

---

## Implementation steps

### Step 1: Auth API module
**File:** `frontend/src/api/auth.api.ts`

Define typed request/response types matching the backend:
```typescript
interface LoginRequest { email: string; password: string }
interface RegisterRequest { email: string; password: string; firstName: string; lastName?: string; companyName: string }
interface AuthUserResponse { id: string; email: string; firstName: string; lastName: string; role: UserRole; companyId: string }
interface AuthTokenResponse { accessToken: string; user: AuthUserResponse }
interface RefreshResponse { accessToken: string }
```

Functions:
- `loginApi(data: LoginRequest): Promise<AuthTokenResponse>` — POST /auth/login, extract `response.data.data`
- `registerApi(data: RegisterRequest): Promise<AuthTokenResponse>` — POST /auth/register
- `refreshApi(): Promise<RefreshResponse>` — POST /auth/refresh (no body, withCredentials sends cookie)
- `logoutApi(): Promise<void>` — POST /auth/logout

All functions use `httpClient` (not raw axios) to get interceptors applied.
Unwrap the ApiResponse envelope: return `response.data.data`.

### Step 2: 401 interceptor upgrade
**File:** `frontend/src/api/http-client.ts`

Replace the placeholder 401 response interceptor with:

```
State:
  - isRefreshing: boolean (module-level, not React state)
  - failedQueue: Array<{ resolve, reject }> (requests pending while refresh in flight)

Logic:
  On 401 received:
    1. If error config has _retry flag → skip (already retried), clearAuth + redirect
    2. If isRefreshing → queue the request (push resolve/reject into failedQueue), return new Promise
    3. Set isRefreshing = true, mark config._retry = true
    4. Call POST /api/v1/auth/refresh (raw axios call, NOT httpClient to avoid circular 401)
    5. On refresh success:
       - Update localStorage access_token
       - Call useAuthStore.getState().setAuth(currentUser, newToken)
       - processQueue(null, newToken) — resolve all queued requests
       - Retry original request with new token
    6. On refresh failure:
       - processQueue(err, null) — reject all queued requests
       - useAuthStore.getState().clearAuth()
       - window.location.href = '/login'
    7. Finally: isRefreshing = false
```

**Important:** The raw refresh call must use `axios.create` or a separate axios instance (not httpClient) to avoid triggering the interceptor recursively.

**Important:** `useAuthStore.getState()` is the Zustand store accessor outside React — no hooks needed.

**Type safety:** Extend `InternalAxiosRequestConfig` with `_retry?: boolean` via module augmentation or a local interface.

### Step 3: Auth mutations hook
**File:** `frontend/src/features/auth/use-auth-mutations.ts`

```typescript
useLoginMutation(): UseMutationResult
  - mutationFn: loginApi(data)
  - onSuccess: authStore.setAuth(user, accessToken), navigate(ROUTES.DISPATCHER)
  - onError: — let the form handle it via mutation.error

useRegisterMutation(): UseMutationResult
  - mutationFn: registerApi(data)
  - onSuccess: authStore.setAuth(user, accessToken), navigate(ROUTES.DISPATCHER)

useLogoutMutation(): UseMutationResult
  - mutationFn: logoutApi()
  - onSuccess: authStore.clearAuth(), navigate(ROUTES.LOGIN)
  - onSettled: always clearAuth (defensive)
```

Uses `useNavigate` from react-router-dom.
Uses `useAuthStore` from `@/store`.
Returns mutation objects so the calling component can read `isPending`, `error`, `mutate`.

### Step 4: Login screen integration
**File:** `frontend/src/features/auth/login-screen.tsx`

Changes (visual design MUST remain unchanged):
1. Import `useLoginMutation` from `./use-auth-mutations`
2. Replace `onSubmit` body:
   ```typescript
   const onSubmit = async (data: LoginFormData): Promise<void> => {
     await loginMutation.mutateAsync(data)
   }
   ```
3. Remove `buildPreviewUser` helper function
4. Remove the "preview credentials" notice block (the amber/tan info box)
5. Update button loading text: `loginMutation.isPending` → 'Открываем смену...'
6. Show API error inline: if `loginMutation.isError`, display error message below the form

### Step 5: Register screen integration
**File:** `frontend/src/features/auth/register-screen.tsx`

Changes (visual design MUST remain unchanged):
1. Import `useRegisterMutation`
2. Replace `onSubmit` body with `registerMutation.mutateAsync(data)`
3. Remove preview notice block
4. Update loading text using `registerMutation.isPending`
5. Show API error inline

### Step 6: Export update
**File:** `frontend/src/features/auth/index.ts`

Add export for `useAuthMutations` (or individual named exports for each mutation hook).

---

## Data flow

```
LoginScreen (form submit)
  → useLoginMutation.mutateAsync({ email, password })
    → loginApi({ email, password })
      → httpClient.post('/auth/login', data)
        → request interceptor: attaches Bearer token (empty on login, fine)
        → backend: validates, returns { data: { accessToken, user }, meta }
      → returns AuthTokenResponse
    → onSuccess: authStore.setAuth(user, accessToken) + navigate('/dispatcher')
      → Zustand: updates user, accessToken, isAuthenticated
      → localStorage: access_token = accessToken

Later requests:
  → httpClient.get('/some-protected-resource')
    → request interceptor: attaches Bearer accessToken
    → if 401 received:
      → refreshApi() (separate axios, no interceptor loop)
      → on success: update token, retry original request
      → on failure: clearAuth() + redirect to /login
```

---

## Error handling strategy

- Login/Register 401: mutation `error` — displayed inline by the form component
- Login/Register 422 (validation): mutation `error` — displayed inline
- Login/Register 429 (rate limit): mutation `error` — displayed inline
- Generic API error: extract `error.response.data.message` from ApiError shape
- 401 on authenticated request: interceptor handles refresh → retry → or logout

---

## TypeScript requirements

- No `any` — all types explicit
- `AuthUser` from store must match `AuthUserResponse` from API (same shape, compatible)
- Extend `InternalAxiosRequestConfig` for `_retry` flag:
  ```typescript
  interface RetryableRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean
  }
  ```
- `useAuthStore.getState()` typed correctly (Zustand provides this)
- `useMutation` generic parameters: `useMutation<AuthTokenResponse, AxiosError<ApiError>, LoginRequest>`

---

## Files NOT to change

- `frontend/src/store/auth.store.ts` — structure is correct as-is
- `frontend/src/hooks/use-permissions.ts` — no changes
- `frontend/src/components/route-guard.tsx` — no changes
- `frontend/src/api/query-client.ts` — no changes
- Any backend files

---

## Implementation order

1. `auth.api.ts` (no deps)
2. `http-client.ts` update (depends on auth.api.ts for refresh call shape)
3. `use-auth-mutations.ts` (depends on auth.api.ts)
4. `login-screen.tsx` update (depends on use-auth-mutations.ts)
5. `register-screen.tsx` update (depends on use-auth-mutations.ts)
6. `features/auth/index.ts` export update

---

## Risks

1. **Circular import risk:** http-client.ts must NOT import from auth.api.ts (which imports http-client.ts). The refresh call in the interceptor must use a standalone axios instance, not httpClient.
2. **Store access outside React:** `useAuthStore.getState()` is valid Zustand API — no hooks needed in the interceptor.
3. **Concurrent 401s:** The queue pattern is critical. Without it, multiple simultaneous 401s trigger multiple refresh calls. The isRefreshing flag + failedQueue array solves this.
4. **Token hydration on page load:** Zustand persist middleware already handles this — `accessToken` is stored in localStorage separately. The request interceptor reads from localStorage directly, not from Zustand state (this is correct behavior for the interceptor).

---

## Runtime artifacts

- shared: .claude/agent-runtime/shared/FEAT-049-v1-plan.md
