import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { API_BASE_URL, API_VERSION } from '@/lib/constants'
import { useAuthStore } from '@/store/auth.store'

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Standard API response envelope (per CLAUDE.md Section 16).
 */
export interface ApiResponse<T> {
  data: T
  meta: {
    requestId: string
    timestamp: string
  }
}

/**
 * Standard API error shape (per CLAUDE.md Section 16).
 */
export interface ApiError {
  statusCode: number
  message: string
  error: string
  requestId: string
}

/**
 * Extended config to track whether a request has already been retried
 * after a token refresh. Prevents infinite retry loops.
 */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// ─── Queue helpers ────────────────────────────────────────────────────────────

interface QueueEntry {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

/** Requests waiting while a refresh is in flight */
let failedQueue: QueueEntry[] = []
let isRefreshing = false

/**
 * Resolve or reject all requests that were queued during a refresh.
 * @param error - If non-null, all queued requests are rejected.
 * @param token - New access token to inject if refresh succeeded.
 */
function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach((entry) => {
    if (error !== null) {
      entry.reject(error)
    } else if (token !== null) {
      entry.resolve(token)
    }
  })
  failedQueue = []
}

// ─── Separate axios instance for refresh calls ────────────────────────────────

/**
 * A standalone axios instance used exclusively for token refresh.
 * Must NOT use httpClient (which has the 401 interceptor) to avoid
 * recursive 401 handling loops.
 */
export const refreshClient = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // sends httpOnly refresh token cookie
})

// ─── Main HTTP client ─────────────────────────────────────────────────────────

/**
 * Central Axios instance.
 * All API requests must go through this client.
 *
 * Token lifecycle:
 * - Request interceptor: attaches Bearer access token from localStorage.
 * - Response interceptor: on 401, attempts token refresh via httpOnly cookie,
 *   retries the original request. Concurrent 401s are queued so only one
 *   refresh call is made at a time.
 */
const httpClient = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // sends httpOnly refresh token cookie
})

// ─── Request interceptor ──────────────────────────────────────────────────────

/** Attach JWT access token to every outgoing request */
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
)

// ─── Response interceptor ────────────────────────────────────────────────────

/**
 * On 401 Unauthorized:
 * 1. Non-401 errors pass through unchanged.
 * 2. Already-retried requests → clear auth and redirect to /login.
 * 3. Refresh in flight → queue this request; it will be retried once the
 *    refresh completes.
 * 4. First 401 → perform refresh, then retry the original request and all
 *    queued requests.
 *
 * Zustand store is accessed via useAuthStore.getState() — the standard Zustand
 * API for imperative access outside React components. No hooks, no circular dep.
 */
httpClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError<ApiError>): Promise<AxiosResponse> => {
    const originalConfig = error.config as RetryableRequestConfig | undefined

    if (error.response?.status !== 401 || originalConfig === undefined) {
      return Promise.reject(error)
    }

    // Request was already retried after a refresh — give up
    if (originalConfig._retry === true) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // A refresh is already in flight — queue this request
    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (originalConfig.headers) {
              originalConfig.headers['Authorization'] = `Bearer ${token}`
            }
            resolve(httpClient(originalConfig))
          },
          reject: (queueError: unknown) => {
            reject(queueError)
          },
        })
      })
    }

    // Mark as refreshing and flag the original request as retried
    originalConfig._retry = true
    isRefreshing = true

    try {
      const refreshResponse = await refreshClient.post<{
        data: { accessToken: string }
      }>('/auth/refresh')

      const newToken = refreshResponse.data.data.accessToken

      // Persist the new access token
      localStorage.setItem('access_token', newToken)

      // Update the Zustand auth store imperatively (outside React)
      const { user, setAuth } = useAuthStore.getState()
      if (user !== null) {
        setAuth(user, newToken)
      }

      // Resolve all queued requests with the new token
      processQueue(null, newToken)

      // Retry the original request with the new token
      if (originalConfig.headers) {
        originalConfig.headers['Authorization'] = `Bearer ${newToken}`
      }
      return httpClient(originalConfig)
    } catch (refreshError: unknown) {
      // Refresh failed — reject all queued requests and log out
      processQueue(refreshError, null)
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default httpClient
