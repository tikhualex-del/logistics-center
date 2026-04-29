/**
 * Hooks barrel export.
 */
export { usePermissions } from './use-permissions'
export { useSocket } from './use-socket'
export type { Permission } from './use-permissions'

// ─── Domain query hooks ───────────────────────────────────────────────────────

export {
  useOrders,
  useOrder,
  useCreateOrder,
  useUpdateOrder,
  useUpdateOrderStatus,
} from './use-orders'

export {
  useCouriers,
  useCourier,
  useUpdateCourierStatus,
  useUpdateCourierLocation,
} from './use-couriers'

export {
  useRoutes,
  useRoute,
  useRoutePreview,
  useBuildRoutes,
  useUpdateRoute,
  useDeleteRoute,
} from './use-routes'

export { useZones, useZone } from './use-zones'

export {
  usePaymentRules,
  useCreatePaymentRule,
  useUpdatePaymentRule,
  usePayments,
  usePayment,
  useCalculatePayment,
  useUpdatePaymentStatus,
} from './use-payments'

export { useUsers, useCreateUser, useUpdateUser } from './use-users'

export {
  useCurrentCompany,
  useCompanyFeatures,
  useUpdateCurrentCompany,
  useUpdateCompanyFeature,
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
} from './use-company-settings'

// ─── Map hooks ────────────────────────────────────────────────────────────────

export { useYandexMap } from './use-yandex-map'
export type { UseYandexMapOptions, UseYandexMapResult } from './use-yandex-map'
