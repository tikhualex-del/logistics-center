# Plan: FEAT-050-v1 — Protected Routes

## Feature
Task 6.2d: ProtectedRoute wrapper, redirect for unauthenticated users.

## Analysis of current state

### What already exists
- `frontend/src/components/route-guard.tsx` — `RouteGuard` component already implements auth check + role check. Used in `app-router.tsx` for `/dispatcher` route.
- `frontend/src/pages/app-router.tsx` — Router already uses `RouteGuard`. No `PublicRoute` guard on `/login` and `/register`.
- `frontend/src/features/auth/login-screen.tsx` — handles redirect internally via `if (isAuthenticated) return <Navigate ...>`.
- `frontend/src/pages/login.tsx` — legacy stub page with TODO comments, not used by router (router uses `features/auth/login-screen.tsx`).
- `frontend/src/store/auth.store.ts` — `useAuthStore` with `isAuthenticated`, `user`, `UserRole`.
- `frontend/src/lib/constants.ts` — `ROUTES = { LOGIN, REGISTER, DISPATCHER, NOT_FOUND }`.

### Gaps to fill
1. No `PublicRoute` guard at router level for `/login` and `/register`
2. `RouteGuard` should be aliased/renamed to `ProtectedRoute` per task naming
3. Components barrel export (`frontend/src/components/index.ts`) needs to export new components
4. Legacy `frontend/src/pages/login.tsx` stub is dead code — should be removed

## Implementation plan

### Step 1: Create `ProtectedRoute` component
**File:** `frontend/src/components/protected-route.tsx`

- Re-implement as the canonical named component (do not rename RouteGuard to avoid breaking existing usage)
- Props: `children: React.ReactNode`, `allowedRoles?: UserRole[]`
- Logic:
  - If `!isAuthenticated` → `<Navigate to={ROUTES.LOGIN} replace />`
  - If `allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)` → `<Navigate to={ROUTES.DISPATCHER} replace />`
  - Otherwise → render children

### Step 2: Create `PublicRoute` component
**File:** `frontend/src/components/public-route.tsx`

- Props: `children: React.ReactNode`
- Logic: If `isAuthenticated` → `<Navigate to={ROUTES.DISPATCHER} replace />`
- Otherwise → render children
- Removes need for inline `if (isAuthenticated)` checks in login-screen.tsx and register-screen.tsx

### Step 3: Update `app-router.tsx`
**File:** `frontend/src/pages/app-router.tsx`

- Replace `RouteGuard` usage with `ProtectedRoute` for `/dispatcher`
- Wrap `/login` and `/register` with `PublicRoute`
- Remove import of `RouteGuard` (or keep both during transition — keep `RouteGuard` file as it exists, just update router imports)

### Step 4: Update `login-screen.tsx`
**File:** `frontend/src/features/auth/login-screen.tsx`

- Remove internal `if (isAuthenticated) return <Navigate ...>` — now handled at router level by `PublicRoute`
- This avoids double-redirect logic

### Step 5: Update `register-screen.tsx`
**File:** `frontend/src/features/auth/register-screen.tsx`

- Same as login-screen: remove internal redirect if it exists

### Step 6: Update components barrel export
**File:** `frontend/src/components/index.ts`

- Export `ProtectedRoute` from `./protected-route`
- Export `PublicRoute` from `./public-route`
- Keep existing exports (RouteGuard, PageLoader, ui components)

### Step 7: Remove legacy login page stub
**File:** `frontend/src/pages/login.tsx`

- This file is dead code (router uses `features/auth/login-screen.tsx`)
- Delete it to avoid confusion

## File changes summary

| File | Action |
|------|--------|
| `frontend/src/components/protected-route.tsx` | CREATE |
| `frontend/src/components/public-route.tsx` | CREATE |
| `frontend/src/pages/app-router.tsx` | UPDATE — use ProtectedRoute + PublicRoute |
| `frontend/src/features/auth/login-screen.tsx` | UPDATE — remove internal redirect |
| `frontend/src/features/auth/register-screen.tsx` | UPDATE — remove internal redirect if present |
| `frontend/src/components/index.ts` | UPDATE — add new exports |
| `frontend/src/pages/login.tsx` | DELETE — dead code |

## Constraints
- React Router v6 (Navigate, useNavigate)
- No class components
- No TypeScript `any`
- Frontend permission checks are UX-only — backend Guards are authoritative (CLAUDE.md §8)
- Do not add Phase 2 features
- Do not break existing RouteGuard (keep the file, just add ProtectedRoute as canonical name)

## Scope check
- MVP: yes
- Phase 2 risk: none
- Multi-tenant risk: none (frontend only)
