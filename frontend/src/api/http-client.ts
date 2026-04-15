import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, API_VERSION } from '@/lib/constants'

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
 * Central Axios instance.
 * All API requests must go through this client.
 *
 * Auth token is injected from localStorage; 401 responses
 * trigger auth state reset (token refresh to be implemented in auth feature).
 */
const httpClient = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // sends httpOnly refresh token cookie
})

/** Attach JWT access token to every request */
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

/** Handle 401 — clear token and redirect to login */
httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default httpClient
