# FEAT-052-v1 Plan: Sidebar navigation — role-based visibility

## Feature
Task 6.3a — Sidebar component with role-based navigation. Items not accessible to the current role are NOT rendered (not disabled/hidden via CSS).

## Dependencies
- FEAT-050 (Protected routes) — completed
- FEAT-051 (usePermissions hook) — completed

## Design decision: sidebar approach
The dispatcher UI is map-first (CLAUDE.md §21). The sidebar must:
- Be collapsible (icon-only vs icon+label) to maximize map area
- Use vertical icon navigation — compact, does not steal horizontal space from the map
- Show only items the current role can access — conditional render via `usePermissions()`

## Nav items and required permissions

| Item | Icon | Required permission | Roles with access |
|------|------|---------------------|-------------------|
| Map / Dispatcher | Map icon | `view:orders` | admin, dispatcher, courier |
| Couriers | Users icon | `manage:couriers` | admin, dispatcher |
| Payments | Wallet icon | `edit:payment-rules` OR `view:own-earnings` | admin (rules), courier (earnings) |
| Settings | Settings icon | `manage:users` | admin only |

Note: Couriers page requires `manage:couriers`. Payments page is visible to admin (edit:payment-rules) and courier (view:own-earnings) — different capabilities, same nav item, detail page adapts by role. Settings requires `manage:users` (admin only).

## Routes to add to constants.ts

```
ROUTES.COURIERS = '/couriers'
ROUTES.PAYMENTS = '/payments'
ROUTES.SETTINGS = '/settings'
```

## Files to create

### 1. `frontend/src/components/layout/sidebar.tsx`
- Sidebar component
- Uses `usePermissions()` and `useUiStore` for collapsed state
- Uses `NavLink` from react-router-dom for active state
- Conditional render per permission — NO CSS hiding
- Collapsible (icon-only mode)

### 2. `frontend/src/components/layout/app-layout.tsx`
- Layout wrapper for all protected pages
- Composes: Sidebar (left) + {children} (right)
- Sidebar state managed via `useUiStore.sidebarCollapsed`

### 3. Update `frontend/src/components/layout/index.ts`
- Export `Sidebar`, `AppLayout`

### 4. Update `frontend/src/components/index.ts`
- Export `AppLayout` for use in router

### 5. Update `frontend/src/lib/constants.ts`
- Add COURIERS, PAYMENTS, SETTINGS routes

### 6. Update `frontend/src/pages/app-router.tsx`
- Wrap dispatcher route with `AppLayout`
- Add placeholder routes for /couriers, /payments, /settings (ProtectedRoute with correct roles)

### 7. Update `frontend/src/pages/dispatcher.tsx`
- Remove inline top bar (it will be replaced in FEAT-053)
- Dispatcher page becomes just map + right panel (no layout chrome)

## Constraints
- CLAUDE.md §21: map must remain the dominant element
- CLAUDE.md §22: nav items NOT rendered (not CSS hidden) for inaccessible roles
- CLAUDE.md §8: functional components, no class components, no `any`
- Sidebar collapse state in Zustand UI store (already has `sidebarCollapsed`)
- No server state in sidebar — all data from auth store + usePermissions

## Out of scope
- Mobile sidebar / drawer
- Sub-navigation / nested menus
- Search in sidebar
- Notifications count in sidebar
