// Application route constants — single source of truth for all URL paths
export const ROUTES = {
  LOGIN: '/login',

  // Default post-login landing
  DASHBOARD: '/orders',

  // Operational
  ORDERS: '/orders',
  ORDERS_CREATE: '/orders/create',
  ORDER: (id: string) => `/orders/${id}`,

  COURIERS: '/couriers',
  COURIERS_CREATE: '/couriers/create',
  COURIER: (id: string) => `/couriers/${id}`,

  ROUTES_LIST: '/routes',
  ROUTES_CREATE: '/routes/create',
  ROUTE: (id: string) => `/routes/${id}`,

  USERS: '/users',
  USERS_CREATE: '/users/create',
  USER: (id: string) => `/users/${id}`,

  INTEGRATIONS: '/integrations',
  INTEGRATIONS_CREATE: '/integrations/create',
  INTEGRATION: (id: string) => `/integrations/${id}`,
  INTEGRATION_LOGS: (id: string) => `/integrations/${id}/logs`,

  // Platform admin
  COMPANIES: '/companies',
  COMPANIES_CREATE: '/companies/create',
  COMPANY: (id: string) => `/companies/${id}`,

  PLATFORM_ADMINS: '/platform-admins',
  PLATFORM_ADMINS_CREATE: '/platform-admins/create',
  PLATFORM_ADMIN: (id: string) => `/platform-admins/${id}`,

  IMPERSONATION: '/impersonation',

  // Settings
  SETTINGS: '/settings',
  SETTINGS_COMPANY: '/settings/company',
  SETTINGS_OPERATIONS: '/settings/operations',
  SETTINGS_SLA: '/settings/sla',
  SETTINGS_INTEGRATIONS: '/settings/integrations',
  SETTINGS_ACCESS: '/settings/access',

  // AI
  AI_ASSISTANT: '/ai-assistant',

  // Core product screens
  MAP: '/map',
  MONITORING: '/monitoring',
  ANALYTICS: '/analytics',
} as const
