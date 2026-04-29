/**
 * API module barrel export.
 * All API utilities are imported from here.
 */
export { default as httpClient } from './http-client'
export { queryClient } from './query-client'
export type { ApiResponse, ApiError } from './http-client'
export {
  loginApi,
  registerApi,
  refreshApi,
  logoutApi,
  extractApiErrorMessage,
} from './auth.api'
export type {
  LoginRequest,
  RegisterRequest,
  AuthUserResponse,
  AuthTokenResponse,
  RefreshResponse,
} from './auth.api'

// ─── Query keys ───────────────────────────────────────────────────────────────

export { QUERY_KEYS } from './query-keys'

// ─── Shared types ─────────────────────────────────────────────────────────────

export type { PaginationParams, PaginatedResponse } from './types'

// ─── Domain API functions ─────────────────────────────────────────────────────

export {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
} from './orders.api'
export type {
  Order,
  OrderStatus,
  OrderFilters,
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
} from './orders.api'

export {
  getCouriers,
  getCourier,
  updateCourierStatus,
  updateCourierLocation,
} from './couriers.api'
export type {
  Courier,
  CourierStatus,
  CourierAvailabilityStatus,
  UpdateCourierStatusDto,
  UpdateCourierLocationDto,
} from './couriers.api'

export {
  getRoutes,
  getRoute,
  buildRoutes,
  updateRoute,
  deleteRoute,
} from './routes.api'
export type {
  Route,
  RouteStatus,
  RouteCoordinate,
  RoutePoint,
  RouteFilters,
  BuildRoutesDto,
  UpdateRouteDto,
} from './routes.api'

export { getZones, getZone } from './zones.api'
export type { Zone, GeoJsonPolygon } from './zones.api'

export {
  getPaymentRules,
  createPaymentRule,
  updatePaymentRule,
  getPayments,
  getPayment,
  calculatePayment,
  updatePaymentStatus,
} from './payments.api'
export type {
  PaymentRule,
  PaymentRuleType,
  UpsertPaymentRuleDto,
  Payment,
  PaymentStatus,
  UpdatePaymentStatusDto,
  PaymentBreakdown,
  PaymentBreakdownItem,
  PaymentFilters,
  CalculatePaymentDto,
  PaymentCalculationResult,
} from './payments.api'

export { getUsers, createUser, updateUser } from './users.api'
export type {
  User,
  CreateUserDto,
  UpdateUserDto,
} from './users.api'

export {
  getCurrentCompany,
  updateCurrentCompany,
  getCompanyFeatures,
  updateCompanyFeature,
} from './companies.api'
export type {
  Company,
  UpdateCompanyDto,
  CompanyFeature,
  UpdateCompanyFeatureDto,
} from './companies.api'

export {
  SUPPORTED_WEBHOOK_EVENTS,
  getWebhooks,
  createWebhook,
  updateWebhook,
} from './integrations.api'
export type {
  SupportedWebhookEvent,
  WebhookRegistration,
  UpsertWebhookRegistrationDto,
} from './integrations.api'
