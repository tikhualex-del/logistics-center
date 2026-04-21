# FEAT-053-v1 UX Review: Top bar

## Map-first principle (CLAUDE.md §21)
- [x] Top bar is exactly h-14 (56px) — takes only 4% of a 1440px-tall screen
- [x] Sidebar (56px wide collapsed) + TopBar (56px tall) = minimal chrome around the map
- [x] No modal, no overlay from TopBar itself

## Dispatcher workflow efficiency
- [x] Date picker is immediately visible and accessible — one click to change
- [x] "Today" shorthand avoids verbose date on the most common case
- [x] Search is always visible, no secondary click needed to open it
- [x] Layer toggles (Routes, Couriers) are right in the top bar — immediate toggle
- [x] Alerts bell is prominently placed with count badge — dispatcher sees alerts at a glance

## Role-appropriate visibility
- [x] Layer toggles only visible for `can('build:routes')` — admin and dispatcher
- [x] Courier would not see layer toggles (they don't manage routes) — correct
- [x] User info always visible — every role needs to know who they're logged in as

## Data density
- [x] All key controls in one horizontal strip — no secondary navigation needed
- [x] User name + role badge = role context at all times
- [x] Alert count on badge (not just a bell icon) — no click needed to check if there are alerts

## Usability
- [x] Date picker uses native input type="date" — keyboard-accessible, locale-aware
- [x] Styled div overlay makes the native input look branded (not raw browser date input)
- [x] `aria-label` on all interactive elements
- [x] `aria-pressed` on layer toggle buttons — correct semantics for toggle buttons
- [x] Alert badge has sr-only context via `aria-label` on the button
- [x] Logout is placed with user info — expected location, single click

## Minor UX notes
1. **Date picker UX**: The overlay div + native input approach works but on some browsers the click target might be slightly misaligned. Acceptable for MVP — Phase 7 can replace with a proper date picker component if needed.
2. **Alert click**: No popover/panel on click yet — alerts badge is for Phase 7 (Task 7.3d). The button currently does nothing on click, which is fine for MVP scaffold.
3. **Search**: No debounce/filter wired yet — correct for this task, Phase 7 wires it to map/list.

## Verdict
UX approved. Top bar is compact, efficient, and role-appropriate. No map space wasted.
