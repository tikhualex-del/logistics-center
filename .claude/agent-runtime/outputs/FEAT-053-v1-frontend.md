# FEAT-053-v1 Frontend Implementation Report: Top bar

## Status
Implemented. TypeScript check: no errors.

## What was implemented

### New files created

1. `frontend/src/components/layout/top-bar.tsx`
   - `TopBar` component with full layout: date picker, search, layer toggles, alerts badge, user info
   - **Date picker**: styled div overlay on native `<input type="date">` — shows "Today" shorthand or formatted date (e.g. "Mon, 17 Apr 2026"). State in Zustand `selectedDate`.
   - **Search bar**: controlled input with magnifier icon, state in Zustand `searchQuery`. MVP: UI state only, filtering wired in Phase 7.
   - **Layer toggles**: Routes and Couriers toggle buttons — only rendered for `can('build:routes')` users (admin, dispatcher). Reads/writes `useUiStore.showRoutes/showCouriers`.
   - **Alerts badge**: bell icon with red badge showing unread count. Badge hidden when count is 0. `99+` cap for large numbers. State in Zustand `alertCount` (will be updated by WS in Phase 7).
   - **User info**: avatar with initials, full name, role badge (color-coded: Admin=blue, Dispatcher=green, Courier=amber), logout button that calls `clearAuth()`.
   - Fixed height `h-14` (56px) — does not steal map vertical space.

### Files modified

- `frontend/src/store/ui.store.ts` — added `selectedDate`, `searchQuery`, `alertCount` fields + setters; added `todayIso()` helper for default date
- `frontend/src/components/layout/app-layout.tsx` — added `<TopBar />` above children
- `frontend/src/pages/dispatcher.tsx` — removed inline top bar header (replaced by AppLayout TopBar)
- `frontend/src/components/layout/index.ts` — added TopBar export
- `frontend/src/components/index.ts` — added TopBar to barrel

## Architecture
- All top bar state in Zustand UI store — correct per CLAUDE.md §8
- No server state in top bar — TanStack Query not used here (correct)
- `can('build:routes')` guards layer toggles — dispatchers see them, couriers do not
- User info reads from auth store — consistent with existing pattern

## CLAUDE.md compliance
- §21: h-14 = 56px — minimal vertical footprint, map dominates
- §8: functional components, no class components, no `any`
- §7: permission check via `can()` for layer toggle visibility
- §22: layer toggles not rendered (not CSS-hidden) for unauthorized users
