# FEAT-051-v1 Plan: usePermissions hook — can('action') role-based rendering

## Feature
Task 6.3c — `usePermissions()` hook with `can('action')` for conditional rendering.

## Dependency
FEAT-049 (Auth store + interceptors) — completed.

## Current state analysis
`frontend/src/hooks/use-permissions.ts` already exists as a scaffold from FEAT-046 with:
- `Permission` type union covering all 15 actions from CLAUDE.md §7 matrix
- `ROLE_PERMISSIONS` constant map — data-driven, not hardcoded if/switch
- `usePermissions()` hook reading role from `useAuthStore`
- `can(permission: Permission): boolean` method
- Exported via `frontend/src/hooks/index.ts`
- Already consumed in `frontend/src/pages/dispatcher.tsx`

## Implementation steps

### Step 1 — Verify and harden use-permissions.ts
- Confirm all 15 permissions from CLAUDE.md §7 matrix are present
- Confirm admin, dispatcher, courier roles have correct permission sets
- Add `isAuthenticated` guard: unauthenticated → `can()` always returns false
- Ensure the hook is stable (no unnecessary re-renders)

### Step 2 — Verify barrel exports
- `frontend/src/hooks/index.ts` must export `usePermissions` and `Permission` type
- Confirm all import paths work with `@/hooks` alias

### Step 3 — Verify consumption in existing code
- `frontend/src/pages/dispatcher.tsx` already uses `const { can } = usePermissions()`
- No changes needed there — verify it compiles

## Permissions matrix (CLAUDE.md §7)

| Permission | admin | dispatcher | courier |
|---|:---:|:---:|:---:|
| view:orders | ✅ | ✅ | ✅ (own only — UX hint) |
| create:orders | ✅ | ✅ | ❌ |
| edit:orders | ✅ | ✅ | ❌ |
| build:routes | ✅ | ✅ | ❌ |
| edit:routes | ✅ | ✅ | ❌ |
| edit:zones | ✅ | ❌ | ❌ |
| edit:payment-rules | ✅ | ❌ | ❌ |
| approve:motivation-rules | ✅ | ❌ | ❌ |
| view:financial-analytics | ✅ | ❌ | ❌ |
| view:operational-analytics | ✅ | ✅ | ❌ |
| view:own-earnings | ✅ | ❌ | ✅ |
| manage:couriers | ✅ | ✅ | ❌ |
| manage:shifts | ✅ | ✅ | ❌ |
| connect:integrations | ✅ | ❌ | ❌ |
| manage:users | ✅ | ❌ | ❌ |

## Files to create/modify
- `frontend/src/hooks/use-permissions.ts` — verify/harden existing implementation
- No new files required

## Constraints
- CLAUDE.md §7: permissions must be data-driven, not hardcoded if/switch
- CLAUDE.md §8: nav items hidden by conditional render, not CSS display:none
- CLAUDE.md §22: `can()` returns false for unauthenticated users
- Frontend role checks are UX-only — backend Guards are authoritative

## Out of scope (Phase 2)
- Dynamic permissions loaded from backend
- Permission caching
- Permission inheritance / composite roles
