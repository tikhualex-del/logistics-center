# FEAT-051-v1 Final Review: usePermissions hook

## Reviewer checklist

### CLAUDE.md §7 compliance
- [x] Permissions are data-driven via `ROLE_PERMISSIONS` constant — no if/switch
- [x] `Permission` type is a union of all 15 action strings from the matrix
- [x] All three roles (admin, dispatcher, courier) have correct permission sets
- [x] `can()` guards against null user — returns false when unauthenticated
- [x] No role names hardcoded in conditional logic

### CLAUDE.md §8 compliance
- [x] Hook is a functional approach — no class components
- [x] No `any` types used — `Permission` is fully typed, `UserRole` is typed
- [x] Return type `UsePermissionsReturn` is explicitly declared
- [x] File located at `frontend/src/hooks/use-permissions.ts` (kebab-case)

### CLAUDE.md §22 compliance
- [x] `can()` returns false for unauthenticated — no accidental permission grants
- [x] Frontend checks are UX-only — documented in JSDoc comment
- [x] No CSS-based hiding — hook is designed for conditional rendering

### Multi-tenant safety
- [x] Hook reads from `useAuthStore` which stores companyId-scoped user
- [x] No cross-tenant risk — role is per-user, per-company
- [x] No server state in Zustand (correct per §8)

### Security
- [x] Permission check at frontend is UX guard only
- [x] Backend Guards remain authoritative — documented in hook JSDoc
- [x] No sensitive data in the permission map

### TypeScript
- [x] Strict typing throughout
- [x] No `any`
- [x] `ROLE_PERMISSIONS` typed as `Record<UserRole, Permission[]>` — exhaustive by construction

### Issues found
None.

## Final verdict
**approve**

## Retry target
N/A
