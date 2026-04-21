import { useUiStore } from '@/store'
import { usePermissions } from '@/hooks'
import {
  MapView,
  OrderListPanel,
  RouteBuildControls,
  RouteEditorPanel,
  useDispatcherRealtime,
} from '@/features/dispatcher'

/**
 * Dispatcher workspace — the core screen of the application.
 *
 * Layout (per CLAUDE.md Section 21 — Map as the Core of the System):
 *
 * [TopBar provided by AppLayout]
 * +---------------------------+-------------------+
 * |                           |                   |
 * |   MAP (center, primary)   |  ORDER LIST panel |
 * |                           |  (right panel)    |
 * |   - Orders (points)       |                   |
 * |   - Geo-zones             |  Click order →    |
 * |   - Routes (toggle)       |  highlight on map |
 * |   - Couriers (toggle)     |                   |
 * +---------------------------+-------------------+
 *
 * The top bar (date picker, search, alerts) is rendered by AppLayout/TopBar (FEAT-053).
 * Map: Yandex Maps JS API (FEAT-055, task 7.1a).
 * Right panel: real order list (FEAT-056, task 7.1e).
 */
export default function DispatcherPage(): React.ReactElement {
  const { selectedOrderId } = useUiStore()
  const { can } = usePermissions()
  useDispatcherRealtime()

  return (
    <div className="flex h-full overflow-hidden">
      {/* Map area — dominant, always visible. MapView fills this absolutely. */}
      <main className="flex-1 relative bg-muted overflow-hidden">
        {/* Yandex Maps JS API — renders as absolute inset-0 (FEAT-055) */}
        <MapView />

        {/* Route build mode controls (bottom-left overlay) — Task 7.2a */}
        {can('build:routes') && <RouteBuildControls />}

        {/* Route editing controls (Task 7.2b): reorder/add/remove route points. */}
        {can('edit:routes') && <RouteEditorPanel />}

        {/* Selected order indicator (bottom-right map overlay) */}
        {selectedOrderId && (
          <div className="absolute bottom-4 right-4 z-20">
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded shadow-sm border border-yellow-200">
              Order selected
            </span>
          </div>
        )}
      </main>

      {/* Right panel: order list (FEAT-056, task 7.1e) */}
      <OrderListPanel />
    </div>
  )
}
