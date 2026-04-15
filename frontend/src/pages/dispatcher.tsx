import { useUiStore } from '@/store'
import { usePermissions } from '@/hooks'

/**
 * Dispatcher workspace — the core screen of the application.
 *
 * Layout (per CLAUDE.md Section 21 — Map as the Core of the System):
 *
 * +-----------------------------------------------+
 * | Top bar: date picker, search, filters, alerts  |
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
 * Map is always the dominant element — never hidden behind panels.
 * Right panel: order list. Drag & drop order to courier.
 *
 * NOTE: Actual map (Yandex Maps JS API) will be implemented in the
 * routing/dispatcher feature. This scaffold sets the layout structure.
 */
export default function DispatcherPage(): React.ReactElement {
  const { showRoutes, showCouriers, toggleRoutesLayer, toggleCouriersLayer, selectedOrderId } =
    useUiStore()
  const { can } = usePermissions()

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-4 px-4 h-14 border-b border-border shrink-0 bg-card">
        <span className="font-semibold text-sm">Logistics Center</span>

        {/* Date picker placeholder */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-input text-sm text-muted-foreground cursor-pointer hover:bg-accent">
          <span>Today</span>
        </div>

        {/* Search placeholder */}
        <div className="flex-1 max-w-xs">
          <input
            className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search orders, couriers..."
          />
        </div>

        {/* Map layer toggles */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={toggleRoutesLayer}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              showRoutes
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background text-muted-foreground'
            }`}
          >
            Routes
          </button>
          <button
            onClick={toggleCouriersLayer}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              showCouriers
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background text-muted-foreground'
            }`}
          >
            Couriers
          </button>

          {/* Alerts placeholder */}
          <button className="relative px-3 py-1 text-xs rounded-full border border-input bg-background text-muted-foreground hover:bg-accent">
            Alerts
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        </div>
      </header>

      {/* Main workspace: map + right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map area — dominant, always visible */}
        <main className="flex-1 relative bg-muted">
          {/* Yandex Map will mount here in the routing/dispatcher feature */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-6xl mb-4">&#128506;</div>
              <p className="text-lg font-medium">Map placeholder</p>
              <p className="text-sm mt-1">Yandex Maps JS API will be initialized here</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs">
                {showRoutes && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Routes layer ON</span>
                )}
                {showCouriers && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Couriers layer ON</span>
                )}
                {selectedOrderId && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                    Order {selectedOrderId} selected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Route build mode controls (bottom-left) */}
          {can('build:routes') && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              <button className="px-3 py-2 text-xs bg-card border border-border rounded-md shadow-sm hover:bg-accent">
                Manual route
              </button>
              <button className="px-3 py-2 text-xs bg-card border border-border rounded-md shadow-sm hover:bg-accent">
                Auto-build
              </button>
            </div>
          )}
        </main>

        {/* Right panel: order list */}
        <aside className="w-80 shrink-0 border-l border-border bg-card overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold">Orders</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Click to highlight on map</p>
          </div>

          {/* Order list placeholder */}
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="p-3 rounded-md border border-border hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Order #{1000 + i}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    new
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  123 Main St, placeholder address
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Courier: unassigned
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
