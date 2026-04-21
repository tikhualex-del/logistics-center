# Frontend Implementation: FEAT-050-v1 — Protected Routes

## Status
DONE — TypeScript build passes with zero errors.

## Files created

### `frontend/src/components/protected-route.tsx` (NEW)
Canonical `ProtectedRoute` component:
- Props: `children: React.ReactNode`, `allowedRoles?: UserRole[]`
- `!isAuthenticated` → `<Navigate to={ROUTES.LOGIN} replace />`
- Role mismatch → `<Navigate to={ROUTES.DISPATCHER} replace />` (no generic 403, per CLAUDE.md §8)
- Correct auth + role → renders children

### `frontend/src/components/public-route.tsx` (NEW)
`PublicRoute` wrapper for `/login` and `/register`:
- `isAuthenticated` → `<Navigate to={ROUTES.DISPATCHER} replace />`
- Not authenticated → renders children normally

## Files updated

### `frontend/src/components/index.ts`
Added exports: `ProtectedRoute`, `PublicRoute`.

### `frontend/src/pages/app-router.tsx`
- Replaced `RouteGuard` import with `ProtectedRoute` + `PublicRoute`
- `/login` and `/register` now wrapped in `<PublicRoute>`
- `/dispatcher` now wrapped in `<ProtectedRoute allowedRoles={['admin', 'dispatcher']}>`
- Added JSDoc comment explaining the protection strategy

### `frontend/src/features/auth/login-screen.tsx`
- Removed inline `if (isAuthenticated) return <Navigate ...>` (now handled by `PublicRoute`)
- Removed unused `Navigate` and `useAuthStore` imports
- Added comment noting redirect is handled at router level

### `frontend/src/features/auth/register-screen.tsx`
- Same cleanup as login-screen: removed inline redirect, unused imports

## Files deleted

### `frontend/src/pages/login.tsx`
Dead code — legacy stub with TODO comments. The router was already using `features/auth/login-screen.tsx`. Deleted to avoid confusion.

## Design decisions

1. **ProtectedRoute is new, RouteGuard is kept** — `route-guard.tsx` still exists for backward compat. `ProtectedRoute` is the canonical name per task spec.
2. **Single responsibility** — redirect logic lives at router level only. Screen components no longer need to know about auth redirect.
3. **PublicRoute at router level** — prevents authenticated users from seeing login/register pages without any logic in the screen components.
4. **Role fallback = DISPATCHER** — unauthorized role access redirects to /dispatcher (the default workspace), not a 403, per CLAUDE.md §8.

## TypeScript
- Strict mode: no errors
- No `any` types used
