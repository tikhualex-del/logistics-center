# Phase 11.1 — apps/web unique value audit

Date: 2026-04-29
Status: completed
Scope: compare legacy `apps/web` Next.js blocks with canonical Vite frontend under `frontend/`.

## Summary

The canonical frontend already contains a strong dispatcher workspace: map-first operations, route workspace, route preview/update API hooks, draggable order markers, selected-order state in Zustand, courier/payments/settings pages, and a small AI dispatcher panel.

`apps/web` still contains unique value that must not be lost before `apps/web` is removed. The most important gaps are standalone order detail/history/actions, monitoring/SLA widgets, non-map route management screens, platform-admin screens, integrations list/detail/logs, and several reusable map/order overlays.

## Migration Matrix

| Legacy block | Legacy source | Canonical status | Decision for 11.4 |
|---|---|---|---|
| Monitoring | `apps/web/src/components/monitoring/*`, `apps/web/src/features/monitoring/*`, `apps/web/src/app/(dashboard)/monitoring/page.tsx` | No canonical monitoring page or `features/monitoring` implementation. Dispatcher has live map/workspace but not execution-summary view. | Migrate. Use `monitoring-shell` as 11.4a reference pattern, then wire live invalidation in 12.1. |
| SLA widgets | `apps/web/src/components/sla/*`, `apps/web/src/features/sla/*`, `apps/web/src/components/orders/sla-summary-bar.tsx` | No canonical SLA components. Some SLA-like visual priority exists in dispatcher/order cards only. | Migrate `SlaStatusBadge`, `DeadlineBadge`, `SlaSummaryWidget` or reimplement equivalents with canonical order fields. |
| Orders detail/create | `apps/web/src/components/orders/*`, `apps/web/src/features/orders/*`, `apps/web/src/app/(dashboard)/orders/*` | `frontend/src/features/orders` is placeholder. Canonical `useOrders` exists and dispatcher order cards exist, but no order table, detail, history, actions, or create page. | Migrate order detail, history, actions, create form, status badge, table/filter primitives. Quick-create-on-map remains Phase 12.2. |
| Routes management | `apps/web/src/components/routes/*`, `apps/web/src/features/routes/*`, `apps/web/src/app/(dashboard)/routes/*` | Canonical has strong route workspace under dispatcher and route API hooks. `frontend/src/features/routes` is placeholder and there are no standalone route pages. | Partially migrate. Keep dispatcher workspace as primary route tool; add route table/detail/action views only if needed outside map. Avoid duplicating route-builder UX already present in `RouteWorkspacePanel`. |
| Map advanced | `apps/web/src/components/map/*`, `apps/web/src/features/map/*`, `apps/web/src/app/(dashboard)/map/page.tsx` | Canonical dispatcher already has Yandex map, order markers, zones, routes, couriers, filters in top bar, order panel, and map-to-route drag/drop. | Partially migrate. Do not replace canonical map. Reuse ideas from `SelectedOrderOverlay`, `NotificationsButton`, compact control-bar affordances, and SLA marker badges in 12.4/12.5. |
| Users | `apps/web/src/components/users/*`, `apps/web/src/features/users/*`, `apps/web/src/app/(dashboard)/users/*` | Canonical `UserManagement` already covers list, create, edit, role, active state and company settings in one settings screen. No separate user detail page. | Mostly covered. Optionally migrate `UserDetailCard` if separate `/users/:id` is required. Do not migrate duplicate invite/change-role modals unless product wants modal UX. |
| Integrations | `apps/web/src/components/integrations/*`, `apps/web/src/features/integrations/*`, `apps/web/src/app/(dashboard)/integrations/*` | Canonical `CompanySettings` includes webhook registration CRUD and event selection. `frontend/src/features/integrations` is placeholder. No integration list/detail/logs pages. | Migrate expanded integrations list/detail/logs/create if backend endpoints are retained. Reconcile with current `integrations.api.ts` which only exposes webhooks. |
| Platform admin | `apps/web/src/components/platform/*`, `apps/web/src/features/platform/*`, platform/company/impersonation pages | No canonical frontend platform module. Depends on backend migration in 11.5. | Defer UI wiring until 11.5 backend platform/tenant-provisioning endpoints exist. Keep source list for migration: companies, platform-admins, company detail/create, impersonation. |
| AI assistant | `apps/web/src/components/ai/*`, `apps/web/src/features/ai/*`, `apps/web/src/app/(dashboard)/ai-assistant/page.tsx` | Canonical has `frontend/src/features/dispatcher/ai-dispatcher-panel.tsx`, but it is UI-only and does not use legacy chat message/input/suggestion components or AI API hook. | Partially migrate. Keep current dispatcher AI panel; migrate chat primitives only if standalone AI assistant page remains in MVP. |

## Source-To-Target Notes

### Monitoring/SLA

Legacy:
- `monitoring-shell.tsx`
- `execution-summary.tsx`
- `route-cards-list.tsx`
- `courier-progress-panel.tsx`
- `sla-status-badge.tsx`
- `deadline-badge.tsx`
- `sla-summary-widget.tsx`

Canonical target:
- New `frontend/src/features/monitoring/` implementation.
- Route exposed through `frontend/src/pages/app-router.tsx` only after page is ready.
- Use existing `useOrders`, `useRoutes`, `useCouriers` first; add dedicated API only if the backend has a monitoring summary endpoint.

### Orders

Legacy order components are MVP-critical because canonical frontend currently has no full order detail workflow:
- `order-detail-card.tsx`
- `order-history-list.tsx`
- `order-actions.tsx`
- `deadline-editor.tsx`
- `create-order-form.tsx`
- `orders-table.tsx`
- `orders-filters.tsx`
- `order-status-badge.tsx`

Canonical target:
- New `frontend/src/features/orders/` slice.
- New pages for list/detail/create if keeping non-map workflows.
- Use `frontend/src/api/orders.api.ts` and `frontend/src/hooks/use-orders.ts`.

### Routes

Canonical dispatcher route workspace is more advanced than the legacy route table for day-of-work dispatching. The legacy route screens are still useful for admin-style browsing and details.

Migrate selectively:
- `routes-table.tsx`
- `route-detail-card.tsx`
- `route-actions.tsx`
- `route-orders-list.tsx`
- `route-status-badge.tsx`

Avoid duplicating:
- `create-route-form.tsx`
- `assign-courier-modal.tsx`
- `add-order-to-route-modal.tsx`

Those flows are largely covered by `RouteWorkspacePanel`, `useBuildRoutes`, and `useUpdateRoute`.

### Map

Canonical map should remain the source of truth. Legacy pieces to mine:
- `selected-order-overlay.tsx` for compact selected-order details.
- `notifications-popover.tsx` for 12.5 inbox behavior.
- `map-control-bar.tsx` interaction ideas only; canonical top bar already covers date/search/status/time/layer filters.

### Users

Canonical `frontend/src/features/settings/user-management.tsx` is stronger than legacy `users-table`, `invite-user-form`, and `change-role-modal` for the current admin settings workflow. Only `user-detail-card.tsx` is unique if separate details are needed.

### Integrations

Canonical company settings can create/update webhooks, but it does not expose:
- integration table
- integration detail card
- integration delivery logs list
- standalone create integration page

Before migration, align with 11.2/11.5 backend decisions because canonical `frontend/src/api/integrations.api.ts` currently exposes webhook registration only.

### Platform

All platform-admin UI is unique and should be preserved for after backend 11.5:
- `companies-table.tsx`
- `company-detail-card.tsx`
- `create-company-form.tsx`
- `platform-admins-table.tsx`
- `platform-admin-detail-card.tsx`
- `create-platform-admin-form.tsx`
- `impersonation-panel.tsx`

## Adaptation Checklist For 11.4a/11.4

- Remove `'use client'`.
- Replace `next/link` with `react-router-dom` `Link`.
- Replace `useRouter()` with `useNavigate()` and explicit back/navigation handlers.
- Replace legacy `@/features/*/hooks` with canonical hooks in `frontend/src/hooks`, or create new canonical hooks next to API modules.
- Replace legacy UI imports (`Table`, `Badge`, `Modal`, `Select`, `EmptyState`, `PageLoader`) with existing Vite UI primitives or add small canonical components under `frontend/src/components/ui`.
- Re-localize mojibake Russian labels through `frontend/src/i18n/ru.json`; do not copy broken text verbatim.
- Align role names: legacy uses `owner/viewer`; canonical uses `admin/dispatcher/courier`.
- Align route/order statuses with canonical backend types: route `planned/in_progress` instead of legacy `assigned`; order `confirmed/handed_over/in_transit` instead of legacy `picked_up`.
- Avoid redundant effects; keep derived filtering/sorting in render or `useMemo`, and reserve `useEffect` for Yandex map, sockets, and DOM listeners.
- Prefer the existing canonical map/store architecture over copying legacy local map selection state.

## Recommended 11.4 Migration Order

1. Monitoring/SLA: small, high-value reference migration and future 12.1 dependency.
2. Orders detail/history/actions/create/list: MVP-critical non-map order workflow.
3. Routes table/detail/status: only the admin-style pieces not duplicated by dispatcher workspace.
4. Integrations expanded list/detail/logs: after API contract check.
5. Users detail only if separate user page is required; otherwise mark covered by `UserManagement`.
6. Map overlays/inbox ideas: fold into dispatcher/top-bar without replacing canonical map.
7. Platform admin: defer until backend 11.5.
8. AI chat primitives: defer unless standalone AI assistant page remains in MVP.

## Conclusion

`apps/web` can be deleted only after 11.4 has either migrated or explicitly waived the blocks above. The highest risk of accidental loss is orders detail/history/actions, monitoring/SLA, integrations logs, and platform admin.
