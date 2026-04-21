import { create } from 'zustand'
import type { AlertNotificationPayload } from '@/api/socket-client'
import type { OrderStatus } from '@/api/orders.api'
import type { OrderTimeSlotFilter } from '@/lib/order-utils'

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
  /** Dispatcher map: selected courier ID */
  selectedCourierId: string | null
  /** Dispatcher map: selected route ID */
  selectedRouteId: string | null
  /** Dispatcher map: whether routes layer is visible */
  showRoutes: boolean
  /** Dispatcher map: whether couriers layer is visible */
  showCouriers: boolean
  /** Global sidebar collapsed state */
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
  /** Dispatcher order list: time slot filter string (null = show all) */
  timeSlotFilter: OrderTimeSlotFilter | null

  setSelectedOrderId: (id: string | null) => void
  setSelectedCourierId: (id: string | null) => void
  setSelectedRouteId: (id: string | null) => void
  setRoutesLayer: (visible: boolean) => void
  toggleRoutesLayer: () => void
  toggleCouriersLayer: () => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSelectedDate: (date: string) => void
  setSearchQuery: (query: string) => void
  setAlertCount: (count: number) => void
  incrementAlertCount: () => void
  pushAlertToast: (toast: AlertNotificationPayload) => void
  dismissAlertToast: (id: string) => void
  clearAlertToasts: () => void
  setStatusFilter: (status: OrderStatus | null) => void
  setTimeSlotFilter: (slot: OrderTimeSlotFilter | null) => void
}

export const useUiStore = create<UiState>()((set) => ({
  selectedOrderId: null,
  selectedCourierId: null,
  selectedRouteId: null,
  showRoutes: true,
  showCouriers: true,
  sidebarCollapsed: false,
  selectedDate: todayIso(),
  searchQuery: '',
  alertCount: 0,
  alertToasts: [],
  statusFilter: null,
  timeSlotFilter: null,

  setSelectedOrderId: (id) => set({ selectedOrderId: id }),
  setSelectedCourierId: (id) => set({ selectedCourierId: id }),
  setSelectedRouteId: (id) => set({ selectedRouteId: id }),
  setRoutesLayer: (visible) => set({ showRoutes: visible }),
  toggleRoutesLayer: () => set((state) => ({ showRoutes: !state.showRoutes })),
  toggleCouriersLayer: () => set((state) => ({ showCouriers: !state.showCouriers })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
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
  setTimeSlotFilter: (slot) => set({ timeSlotFilter: slot }),
}))
