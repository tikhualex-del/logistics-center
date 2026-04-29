/**
 * Centralized TanStack Query key factory.
 *
 * Using factory functions ensures:
 * - Type-safe keys across the codebase
 * - Easy targeted invalidation (e.g. invalidate all orders, or a specific order)
 * - No magic strings scattered across hooks
 *
 * Pattern: ['domain', 'list'|'detail', ...params]
 */

export const QUERY_KEYS = {
  orders: {
    all: ['orders'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },

  couriers: {
    all: ['couriers'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['couriers', 'list', filters] as const,
    detail: (id: string) => ['couriers', 'detail', id] as const,
  },

  routes: {
    all: ['routes'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['routes', 'list', filters] as const,
    detail: (id: string) => ['routes', 'detail', id] as const,
    preview: (params?: Record<string, unknown>) =>
      ['routes', 'preview', params] as const,
  },

  zones: {
    all: ['zones'] as const,
    list: () => ['zones', 'list'] as const,
    detail: (id: string) => ['zones', 'detail', id] as const,
  },

  paymentRules: {
    all: ['payment-rules'] as const,
    list: () => ['payment-rules', 'list'] as const,
    detail: (id: string) => ['payment-rules', 'detail', id] as const,
  },

  payments: {
    all: ['payments'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['payments', 'list', filters] as const,
    detail: (id: string) => ['payments', 'detail', id] as const,
  },

  users: {
    all: ['users'] as const,
    list: () => ['users', 'list'] as const,
  },

  companies: {
    all: ['companies'] as const,
    current: () => ['companies', 'current'] as const,
    features: () => ['companies', 'features'] as const,
  },

  integrations: {
    all: ['integrations'] as const,
    webhooks: () => ['integrations', 'webhooks'] as const,
  },
} as const
