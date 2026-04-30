# Phase 11.4 - legacy apps/web UI migration

Date: 2026-04-29
Status: completed
Depends on: 11.4a

## Migrated

- Monitoring route: `frontend/src/pages/monitoring.tsx` uses the canonical `MonitoringShell` from 11.4a.
- SLA widgets: `frontend/src/features/sla` adds `SlaStatusBadge`, `DeadlineBadge`, `SlaSummaryWidget`, and shared SLA utilities based on canonical order fields.
- Orders workspace: `frontend/src/features/orders/orders-workspace.tsx` adds list, create form, detail card, status actions, SLA badges, and a lightweight history panel using canonical `useOrders`, `useCreateOrder`, and `useUpdateOrderStatus`.
- Routes management: `frontend/src/features/routes/routes-management.tsx` adds admin-style route list, detail card, route point list, status actions, and delete action using canonical `useRoutes`, `useUpdateRoute`, and `useDeleteRoute`.
- Integrations workspace: `frontend/src/features/integrations/integrations-workspace.tsx` adds a standalone webhook list/detail/create/edit surface over the current canonical integrations API.
- AI assistant page: `frontend/src/features/ai/ai-assistant-page.tsx` preserves the legacy chat/input/suggestion primitives as UI-only until an AI backend exists.
- Map advanced overlay: `frontend/src/features/dispatcher/selected-order-overlay.tsx` replaces the old tiny selected-order indicator with compact selected order details, status, address, and SLA deadline.
- Navigation/routes: sidebar and router now expose monitoring, orders, routes, integrations, AI assistant, and platform preview routes.

## Explicit waivers

- Users: no separate users page was migrated. Canonical `frontend/src/features/settings/user-management.tsx` already covers list/create/edit/role/active state more completely than legacy users table/modals for the current admin workflow.
- Platform admin: no fake tenant-admin API was added. `frontend/src/features/platform/platform-admin-preview.tsx` preserves the UI contract and documents the blocked areas, but real companies/admins/impersonation forms must wait for backend task 11.5.
- Integration delivery logs: the legacy logs list depends on endpoints that do not exist in canonical `frontend/src/api/integrations.api.ts`. The standalone integrations detail panel keeps a log placeholder and should be wired after backend exposes delivery events.
- Map control bar/notifications popover: canonical top bar and dispatcher map remain the source of truth. Notification inbox behavior stays in Phase 12.5; SLA marker work stays in Phase 12.4.

## Verification

- `cd frontend && npm run lint` passed with one pre-existing warning in `frontend/src/features/dispatcher/route-workspace-panel.tsx` about an unnecessary hook dependency.
- `cd frontend && npm run build` passed.
