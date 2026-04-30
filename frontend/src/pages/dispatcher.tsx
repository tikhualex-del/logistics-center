import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/store'
import { usePermissions } from '@/hooks'
import {
  AiDispatcherPanel,
  MapView,
  OrderListPanel,
  RouteWorkspacePanel,
  SelectedOrderOverlay,
  useDispatcherRealtime,
} from '@/features/dispatcher'

function IconRoute(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h2a4 4 0 0 0 4-4V9a4 4 0 0 1 4-4" />
    </svg>
  )
}

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
  const { t } = useTranslation()
  const { selectedOrderId } = useUiStore()
  const { can } = usePermissions()
  const canBuildRoutes = can('build:routes')
  const canEditRoutes = can('edit:routes')
  const hasRouteControls = canBuildRoutes || canEditRoutes
  const [isRoutePanelOpen, setIsRoutePanelOpen] = useState(false)
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false)
  useDispatcherRealtime()

  return (
    <div className="h-full overflow-hidden">
      {/* Map area — dominant, always visible. MapView fills this absolutely. */}
      <main className="relative h-full bg-muted overflow-hidden">
        {/* Yandex Maps JS API — renders as absolute inset-0 (FEAT-055) */}
        <MapView />

        {/* Route build mode controls (bottom-left overlay) — Task 7.2a */}
        {hasRouteControls && (
          <div
            className={[
              'absolute bottom-4 left-1.5 right-3 z-30 h-80 overflow-hidden rounded-2xl border border-violet-500/70 bg-slate-950 text-slate-100 shadow-2xl shadow-violet-950/30 backdrop-blur transition-all duration-300 ease-out md:right-[23rem]',
              isRoutePanelOpen
                ? 'translate-y-0 opacity-100 pointer-events-auto'
                : 'translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none',
            ].join(' ')}
            aria-hidden={!isRoutePanelOpen}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-violet-100">
                  <IconRoute />
                </span>
                <span className="text-sm font-semibold text-slate-100">
                  {t('topBar.routes')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRoutePanelOpen(false)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-100"
                aria-label={t('common.close')}
              >
                {t('common.close')}
              </button>
            </div>
            <div className="h-[calc(20rem-3.125rem)] overflow-hidden">
              <RouteWorkspacePanel
                canBuildRoutes={canBuildRoutes}
                canEditRoutes={canEditRoutes}
              />
            </div>
          </div>
        )}

        {hasRouteControls && !isRoutePanelOpen && (
          <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRoutePanelOpen(true)}
              className="flex h-14 items-center gap-3 rounded-2xl bg-slate-950 px-8 text-sm font-semibold text-white shadow-2xl transition-transform hover:-translate-y-0.5 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label={t('routes.build')}
            >
              <IconRoute />
              <span>{t('routes.build')}</span>
            </button>
          </div>
        )}


        {/* Selected order compact overlay migrated from legacy map UI */}
        {selectedOrderId && <SelectedOrderOverlay />}

        <AiDispatcherPanel
          open={isAiPanelOpen}
          onClose={() => setIsAiPanelOpen(false)}
          onToggle={() => setIsAiPanelOpen((open) => !open)}
        />

        {/* Right panel: order list (FEAT-056, task 7.1e) */}
        <OrderListPanel
          onRouteBuilt={
            hasRouteControls ? () => setIsRoutePanelOpen(true) : undefined
          }
        />
      </main>
    </div>
  )
}
