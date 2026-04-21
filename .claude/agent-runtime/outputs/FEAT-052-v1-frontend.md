# FEAT-052-v1 Frontend Implementation Report: Sidebar navigation

## Status
Implemented.

## What was implemented

### New files created
1. `frontend/src/components/layout/sidebar.tsx`
   - `Sidebar` component with role-based nav items
   - Nav items: Map, Couriers, Payments, Settings — each gated by `requiredPermissions[]`
   - Items rendered conditionally via `usePermissions().can()` — NOT hidden via CSS
   - Collapsible (icon-only ↔ icon+label) via `useUiStore.sidebarCollapsed`
   - Uses `NavLink` from react-router-dom for active state highlighting
   - Inline SVG icons (no external icon library dependency)
   - `aria-label` and `title` attributes for accessibility

2. `frontend/src/components/layout/app-layout.tsx`
   - Layout wrapper: Sidebar (left) + children (right, flex-1)
   - All protected pages wrapped here via router

3. `frontend/src/pages/couriers.tsx` — placeholder page
4. `frontend/src/pages/payments.tsx` — placeholder page
5. `frontend/src/pages/settings.tsx` — placeholder page

### Files modified
- `frontend/src/lib/constants.ts` — added COURIERS, PAYMENTS, SETTINGS routes
- `frontend/src/components/layout/index.ts` — added Sidebar, AppLayout exports
- `frontend/src/components/index.ts` — added Sidebar, AppLayout to barrel
- `frontend/src/pages/app-router.tsx` — wrapped all protected routes in AppLayout; added /couriers, /payments, /settings routes with correct allowedRoles
- `frontend/src/pages/dispatcher.tsx` — changed `h-screen` to `h-full` (AppLayout now owns screen height); removed brand text from top bar

## Permission → visibility mapping

| Nav item | Required permission(s) | Visible to |
|----------|------------------------|------------|
| Map | view:orders | admin, dispatcher, courier |
| Couriers | manage:couriers | admin, dispatcher |
| Payments | edit:payment-rules OR view:own-earnings | admin, courier |
| Settings | manage:users | admin only |

## Route → role guard mapping

| Route | ProtectedRoute allowedRoles |
|-------|-----------------------------|
| /dispatcher | admin, dispatcher |
| /couriers | admin, dispatcher |
| /payments | admin, courier |
| /settings | admin |

## CLAUDE.md compliance
- §21: map remains dominant, sidebar is collapsible to minimize footprint
- §22: nav items are conditionally rendered (not CSS-hidden)
- §8: functional components, Zustand for UI state only, no any
- §7: permissions data-driven via ROLE_PERMISSIONS map
