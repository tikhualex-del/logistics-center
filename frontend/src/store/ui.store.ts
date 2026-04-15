import { create } from 'zustand'

/**
 * UI store — holds transient interface state only.
 * No server data lives here — use TanStack Query for server state.
 *
 * Per CLAUDE.md Section 8: Zustand only for UI state (open modals,
 * selected filters, map view settings, etc.)
 */

interface UiState {
  /** Dispatcher map: selected order ID (highlighted on map + detail panel) */
  selectedOrderId: string | null
  /** Dispatcher map: selected courier ID */
  selectedCourierId: string | null
  /** Dispatcher map: whether routes layer is visible */
  showRoutes: boolean
  /** Dispatcher map: whether couriers layer is visible */
  showCouriers: boolean
  /** Global sidebar collapsed state */
  sidebarCollapsed: boolean

  setSelectedOrderId: (id: string | null) => void
  setSelectedCourierId: (id: string | null) => void
  toggleRoutesLayer: () => void
  toggleCouriersLayer: () => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useUiStore = create<UiState>()((set) => ({
  selectedOrderId: null,
  selectedCourierId: null,
  showRoutes: true,
  showCouriers: true,
  sidebarCollapsed: false,

  setSelectedOrderId: (id) => set({ selectedOrderId: id }),
  setSelectedCourierId: (id) => set({ selectedCourierId: id }),
  toggleRoutesLayer: () => set((state) => ({ showRoutes: !state.showRoutes })),
  toggleCouriersLayer: () => set((state) => ({ showCouriers: !state.showCouriers })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))
