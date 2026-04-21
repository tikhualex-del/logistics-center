# FEAT-056 v1 — Plan: Dispatcher Order List Panel

Feature: 7.1e — Список заказов (правая панель)
Version: v1
Agent: planner

---

## Scope

Frontend-only. Replace the static placeholder in the right panel of dispatcher.tsx with a real, data-driven scrollable order list.

---

## Implementation Steps

### Step 1: Extend UI store for order filters
File: `frontend/src/store/ui.store.ts` (UPDATE)

Add to UiState:
- `statusFilter: OrderStatus | null` — selected status filter (null = all)
- `timeSlotFilter: string | null` — selected time slot filter

Add setters:
- `setStatusFilter(status: OrderStatus | null): void`
- `setTimeSlotFilter(slot: string | null): void`

### Step 2: Order status color mapping utility
File: `frontend/src/lib/order-utils.ts` (NEW)

- `getStatusColor(status: OrderStatus): string` — returns Tailwind class pair (bg + text)
- `getStatusLabel(status: OrderStatus): string` — returns human-readable label
- `formatTimeSlot(scheduledAt: string | null): string` — formats ISO datetime to "HH:mm" or "—"

### Step 3: OrderCard component
File: `frontend/src/features/dispatcher/order-card.tsx` (NEW)

Props:
- `order: Order`
- `isSelected: boolean`
- `onSelect: (id: string) => void`
- `isDragging?: boolean`

Displays:
- Order number (short ID or externalId)
- Status badge (color-coded per status)
- Delivery address (truncated)
- Scheduled time slot (HH:mm or "—")
- Courier name placeholder (unassigned or courierId)

Interaction:
- Click → `onSelect(order.id)`
- Selected state: highlighted border + bg

Drag & drop:
- `draggable` attribute on root element
- `onDragStart` stores `order.id` in `dataTransfer.setData('orderId', order.id)`
- This prepares for 7.2c (drag to courier assignment)

### Step 4: OrderListPanel component
File: `frontend/src/features/dispatcher/order-list-panel.tsx` (NEW)

- Uses `useOrders` hook with filters: `{ date: selectedDate, status: statusFilter || undefined, search: searchQuery || undefined }`
- Uses `useUiStore` for: selectedDate, searchQuery, statusFilter, setSelectedOrderId, selectedOrderId
- Scrollable list (overflow-y-auto) of OrderCard components
- Loading state: skeleton rows (3 items)
- Empty state: "No orders for this date" message
- Error state: "Failed to load orders" with retry hint
- Total count in panel header: "Orders (N)"
- Pagination: loads first page (limit: 50 for dispatcher — need to see all day's orders)

### Step 5: Update dispatcher.tsx
File: `frontend/src/pages/dispatcher.tsx` (UPDATE)

- Replace static `<aside>` placeholder with `<OrderListPanel />`
- Import from `@/features/dispatcher`

### Step 6: Export from feature index
File: `frontend/src/features/dispatcher/index.ts` (UPDATE)

- Add exports: `OrderListPanel`, `OrderCard`

---

## File Structure

```
frontend/src/
├── store/
│   └── ui.store.ts              (UPDATE — add statusFilter, timeSlotFilter)
├── lib/
│   └── order-utils.ts           (NEW)
├── features/
│   └── dispatcher/
│       ├── order-card.tsx       (NEW)
│       ├── order-list-panel.tsx (NEW)
│       └── index.ts             (UPDATE)
└── pages/
    └── dispatcher.tsx           (UPDATE)
```

---

## Constraints

- No `any` in TypeScript
- Drag & drop: native HTML5 drag API only (no external library)
- Filtering via useOrders filters, not client-side array filter (server-side pagination)
- `selectedOrderId` in ui.store — only UI state, no server call on select
- Right panel width: 320px (w-80) — fixed per design
- Do NOT implement the actual courier assignment — that is 7.2c. Just set up drag source.
- MVP only: no virtual scrolling, no infinite scroll in this task

---

## Acceptance Criteria

1. Real orders load from API via useOrders hook
2. Each card shows: status (colored badge), address, time slot
3. Click on card sets selectedOrderId in ui.store
4. Selected card has visible highlight
5. Loading state shows skeleton rows
6. Empty state handled gracefully
7. Drag & drop: order card is draggable, stores orderId in dataTransfer
8. TypeScript strict, no any
