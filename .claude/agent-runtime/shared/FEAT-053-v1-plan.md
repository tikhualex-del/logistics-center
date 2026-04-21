# FEAT-053-v1 Plan: Top bar — date picker, search, alerts badge

## Feature
Task 6.3b — TopBar component used in the dispatcher layout.

## Dependencies
- FEAT-052 (Sidebar navigation) — completed
- FEAT-051 (usePermissions) — completed

## Components to implement

### 1. `TopBar` component
Location: `frontend/src/components/layout/top-bar.tsx`

Sections (left → right):
- **Date picker** (left): shows selected date, defaults to today. Clicking opens a simple date selector.
  - Internal state: `selectedDate: Date` (starts as `new Date()`)
  - Format: "Mon, 17 Apr 2026" or "Today" shorthand
  - Implementation: HTML `<input type="date">` styled as a button, or controlled date input
  - State managed in Zustand UI store (dispatchers share date context across map/list)

- **Search bar** (center/left): text input for order/courier search
  - Placeholder: "Search orders, couriers..."
  - State: local (controlled input), will be lifted to Zustand UI store for Phase 7 to filter the map
  - For MVP: UI state only, no actual API call wired here

- **Layer toggles** (right, dispatcher only): Routes, Couriers toggles
  - Only shown if `can('build:routes')` — i.e., admin and dispatcher
  - Uses existing `useUiStore` toggles

- **Alerts badge** (right): bell icon with unread count badge
  - Count: comes from `useUiStore.alertCount` (add this field)
  - Badge: red circle with number, hidden if count is 0
  - Click: no action for MVP (Phase 7 task 7.3d handles toast alerts)

- **User info** (far right): avatar/initials + name + role pill
  - Reads from `useAuthStore` — user.firstName, user.lastName, user.role
  - Click: logout dropdown (logout button → calls `useAuthStore.clearAuth()`)

### 2. Update UI store
- Add `selectedDate: string` (ISO date string, default today)
- Add `setSelectedDate(date: string): void`
- Add `alertCount: number` (default 0)
- Add `setAlertCount(count: number): void`
- Add `searchQuery: string` (default '')
- Add `setSearchQuery(query: string): void`

### 3. Update `app-layout.tsx`
- Import and render `<TopBar />` above `{children}` inside the right column

### 4. Update `dispatcher.tsx`
- Remove the inline top bar header (now handled by AppLayout/TopBar)

### 5. Update exports
- `frontend/src/components/layout/index.ts` — add TopBar
- `frontend/src/components/index.ts` — add TopBar

## State decisions
- `selectedDate`, `alertCount`, `searchQuery` → Zustand UI store (correct per CLAUDE.md §8)
- These are UI state, not server state
- No TanStack Query needed for this feature

## Constraints
- CLAUDE.md §21: TopBar must not steal vertical space — target height: h-14 (56px)
- CLAUDE.md §8: functional components, no class components, no `any`
- Dispatcher inline header must be removed to avoid duplication
- No Phase 7 scope: search doesn't filter map yet, alerts don't pull from WS yet

## Out of scope (Phase 7)
- Search actually filtering orders on map
- Alerts popover with list of alerts
- Realtime alert count from Socket.io
