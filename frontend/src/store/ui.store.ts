import { create } from 'zustand'
import type { AlertNotificationPayload } from '@/api/socket-client'
import type { OrderStatus } from '@/api/orders.api'

export type RouteDisplayMode = 'roads' | 'lines'
export interface RoutePreviewPoint {
  orderId: string
  latitude: number
  longitude: number
}

export interface RoutePreview {
  routeId: string | null
  orderIds: string[]
  routeDate: string
  courierId: string | null
  points: RoutePreviewPoint[]
}

/**
 * UI store — holds transient interface state only.
 * No server data lives here — use TanStack Query for server state.
 *
 * Per CLAUDE.md Section 8: Zustand only for UI state (open modals,
 * selected filters, map view settings, etc.)
 */

/** Returns today's date as an ISO date string (YYYY-MM-DD). */
function todayIso(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

interface UiState {
  /** Dispatcher map: selected order ID (highlighted on map + detail panel) */
  selectedOrderId: string | null
  /** Dispatcher map: selected order IDs for multi-select highlighting */
  selectedOrderIds: string[]
  /** Dispatcher map: selected courier ID */
  selectedCourierId: string | null
  /** Dispatcher map: selected route ID */
  selectedRouteId: string | null
  /** Dispatcher map: whether routes layer is visible */
  showRoutes: boolean
  /** Dispatcher map: route path display mode */
  routeDisplayMode: RouteDisplayMode
  /** Dispatcher map: unsaved local route preview for immediate redraw */
  routePreview: RoutePreview | null
  /** Dispatcher map: whether couriers layer is visible */
  showCouriers: boolean
  /** Global sidebar drawer open state */
  sidebarOpen: boolean
  /** Legacy sidebar collapsed state */
  sidebarCollapsed: boolean
  /** Top bar: currently selected date (ISO format YYYY-MM-DD, default today) */
  selectedDate: string
  /** Top bar: search query string */
  searchQuery: string
  /** Top bar: number of unread alerts */
  alertCount: number
  /** Toast notifications received from realtime alert:new events */
  alertToasts: AlertNotificationPayload[]
  /** Dispatcher order list: status filter (null = show all) */
  statusFilter: OrderStatus | null
  /** Dispatcher order list: delivery window start time filter (HH:mm, null = no lower bound) */
  startTimeFilter: string | null
  /** Dispatcher order list: delivery window end time filter (HH:mm, null = no upper bound) */
  endTimeFilter: string | null

  setSelectedOrderId: (id: string | null) => void
  selectOrder: (id: string, multiSelect?: boolean) => void
  clearOrderSelection: () => void
  setSelectedCourierId: (id: string | null) => void
  setSelectedRouteId: (id: string | null) => void
  setRoutesLayer: (visible: boolean) => void
  setRouteDisplayMode: (mode: RouteDisplayMode) => void
  setRoutePreview: (preview: RoutePreview | null) => void
  clearRoutePreview: () => void
  toggleRoutesLayer: () => void
  toggleCouriersLayer: () => void
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSelectedDate: (date: string) => void
  setSearchQuery: (query: string) => void
  setAlertCount: (count: number) => void
  incrementAlertCount: () => void
  pushAlertToast: (toast: AlertNotificationPayload) => void
  dismissAlertToast: (id: string) => void
  clearAlertToasts: () => void
  setStatusFilter: (status: OrderStatus | null) => void
  setStartTimeFilter: (time: string | null) => void
  setEndTimeFilter: (time: string | null) => void
  clearTimeFilter: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  selectedOrderId: null,
  selectedOrderIds: [],
  selectedCourierId: null,
  selectedRouteId: null,
  showRoutes: true,
  routeDisplayMode: 'roads',
  routePreview: null,
  showCouriers: true,
  sidebarOpen: false,
  sidebarCollapsed: false,
  selectedDate: todayIso(),
  searchQuery: '',
  alertCount: 0,
  alertToasts: [],
  statusFilter: null,
  startTimeFilter: null,
  endTimeFilter: null,

  setSelectedOrderId: (id) =>
    set({
      selectedOrderId: id,
      selectedOrderIds: id ? [id] : [],
    }),
  selectOrder: (id, multiSelect = false) =>
    set((state) => {
      if (!multiSelect) {
        return {
          selectedOrderId: id,
          selectedOrderIds: [id],
        }
      }

      const isSelected = state.selectedOrderIds.includes(id)
      const selectedOrderIds = isSelected
        ? state.selectedOrderIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedOrderIds, id]
      const selectedOrderId = isSelected
        ? state.selectedOrderId === id
          ? selectedOrderIds[selectedOrderIds.length - 1] ?? null
          : state.selectedOrderId
        : id

      return {
        selectedOrderId,
        selectedOrderIds,
      }
    }),
  clearOrderSelection: () =>
    set({
      selectedOrderId: null,
      selectedOrderIds: [],
    }),
  setSelectedCourierId: (id) => set({ selectedCourierId: id }),
  setSelectedRouteId: (id) => set({ selectedRouteId: id }),
  setRoutesLayer: (visible) => set({ showRoutes: visible }),
  setRouteDisplayMode: (mode) => set({ routeDisplayMode: mode }),
  setRoutePreview: (preview) => set({ routePreview: preview }),
  clearRoutePreview: () => set({ routePreview: null }),
  toggleRoutesLayer: () => set((state) => ({ showRoutes: !state.showRoutes })),
  toggleCouriersLayer: () => set((state) => ({ showCouriers: !state.showCouriers })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setAlertCount: (count) => set({ alertCount: count }),
  incrementAlertCount: () => set((state) => ({ alertCount: state.alertCount + 1 })),
  pushAlertToast: (toast) =>
    set((state) => ({
      alertToasts: [
        toast,
        ...state.alertToasts.filter((item) => item.id !== toast.id),
      ].slice(0, 4),
    })),
  dismissAlertToast: (id) =>
    set((state) => ({
      alertToasts: state.alertToasts.filter((toast) => toast.id !== id),
    })),
  clearAlertToasts: () => set({ alertToasts: [] }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setStartTimeFilter: (time) => set({ startTimeFilter: time }),
  setEndTimeFilter: (time) => set({ endTimeFilter: time }),
  clearTimeFilter: () => set({ startTimeFilter: null, endTimeFilter: null }),
}))
