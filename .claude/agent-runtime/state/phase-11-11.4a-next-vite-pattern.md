# Phase 11.4a - Next.js to Vite adaptation pattern

Date: 2026-04-29
Status: completed
Reference implementation: `frontend/src/features/monitoring/monitoring-shell.tsx`

## Goal

Use one migrated component as the pattern for Phase 11.4, so legacy `apps/web` UI can move into the canonical Vite frontend without copying Next.js assumptions, stale API hooks, or mojibake labels.

## Reference Component

Legacy source:

- `apps/web/src/components/monitoring/monitoring-shell.tsx`
- Child ideas from `execution-summary.tsx`, `route-cards-list.tsx`, `courier-progress-panel.tsx`

Canonical target:

- `frontend/src/features/monitoring/monitoring-shell.tsx`
- `frontend/src/features/monitoring/index.ts`
- New i18n namespace: `monitoring` in `frontend/src/i18n/ru.json`

The Vite version is intentionally self-contained for 11.4a. It does not import the old child components because they depend on legacy hooks and non-canonical statuses. Instead, it keeps the same product shape: execution summary, active routes, and courier progress.

## Transformation Checklist

- Remove `'use client'`; Vite components are client-side by default.
- Replace `next/link` with `react-router-dom` `Link`; use `to`, not `href`.
- Replace `useRouter()` with `useNavigate()` and explicit event handlers.
- Replace `next/image` with a plain `<img>` or an existing media primitive. Keep explicit dimensions or responsive constraints.
- Replace Next page `metadata` exports with route-level document title handling only if the canonical router already has that pattern. Do not carry `Metadata` imports into Vite.
- Replace server actions with TanStack Query mutations in `frontend/src/hooks` or feature-local hooks that call `frontend/src/api/*`.
- Replace legacy `@/features/*/hooks` imports with canonical hooks such as `useOrders`, `useRoutes`, and `useCouriers`.
- Replace legacy UI primitives (`Table`, `Badge`, `Modal`, `Select`, `EmptyState`, `PageLoader`) with existing Vite primitives or small local components until a shared primitive is justified.
- Re-localize visible labels through `frontend/src/i18n/ru.json`; do not copy mojibake strings from `apps/web`.
- Align roles with canonical backend: `admin`, `dispatcher`, `courier`; do not copy `owner` or `viewer` into tenant UI.
- Align route statuses with canonical backend: `draft`, `planned`, `in_progress`, `completed`, `cancelled`.
- Align order statuses with canonical backend: `new`, `confirmed`, `assigned`, `handed_over`, `in_transit`, `delivered`, `undelivered`, `returned`, `cancelled`.
- Keep derived filtering, sorting, and counters in render or `useMemo`. Reserve `useEffect` for external systems such as Yandex Maps, sockets, or DOM listeners.
- Use canonical Zustand only for transient UI state, for example `selectedDate`; keep server data in TanStack Query.
- Prefer direct imports from feature folders and API modules. Avoid adding new broad barrels unless the folder already uses one.

## Monitoring-Shell Adaptation Notes

- Legacy `useMonitoringSummary()` was not migrated because canonical backend has no `/monitoring/summary` endpoint.
- Summary metrics are derived from existing canonical queries:
  - `useOrders({ date: selectedDate })`
  - `useRoutes({ date: selectedDate })`
  - `useCouriers()`
- Legacy route status `assigned` was replaced with canonical `planned` and `in_progress`.
- Legacy courier `status === 'active'` was replaced with canonical `courier.isOnline || courier.status === 'busy'`.
- Legacy order `picked_up` was not copied; canonical in-flight statuses are `handed_over` and `in_transit`.
- SLA risk is a lightweight client-side approximation using `timeWindowTo`: final orders are ignored, and non-final orders are counted as at risk when the delivery window has expired or is within 30 minutes.
- The component exposes a React Router link back to `ROUTES.DISPATCHER`, demonstrating the `next/link` replacement in a real component.

## 11.4 Follow-up

- Wire the monitoring route into navigation only after the full monitoring/SLA block is migrated.
- Add smoke tests in 9.2g for `MonitoringShell` after Phase 11.4 finishes moving all required components.
- If backend later adds `/monitoring/summary`, replace local derived counters with a canonical `useMonitoringSummary` hook under `frontend/src/hooks` or `frontend/src/features/monitoring`.
