import type { AxiosError } from 'axios'
import httpClient from './http-client'
import type { ApiResponse } from './http-client'
import type { UserRole } from '@/store'

// ─── Request types ──────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName?: string
  companyName: string
}

// ─── Response types ──────────────────────────────────────────────────────────

/**
 * Backend user shape returned in auth responses.
 * Must stay in sync with TokenResponseDto (backend FEAT-018).
 */
export interface AuthUserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  companyId: string
}

export interface AuthTokenResponse {
  accessToken: string
  user: AuthUserResponse
}

export interface RefreshResponse {
  accessToken: string
}

// ─── API functions ──────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/login
 * Returns access token + user profile.
 * Refresh token is set as httpOnly cookie by the backend.
 */
export async function loginApi(data: LoginRequest): Promise<AuthTokenResponse> {
  const response = await httpClient.post<ApiResponse<AuthTokenResponse>>(
    '/auth/login',
    data,
  )
  return response.data.data
}

/**
 * POST /api/v1/auth/register
 * Creates a new company + admin user. Returns access token + user profile.
 */
export async function registerApi(
  data: RegisterRequest,
): Promise<AuthTokenResponse> {
  const response = await httpClient.post<ApiResponse<AuthTokenResponse>>(
    '/auth/register',
    data,
  )
  return response.data.data
}

/**
 * POST /api/v1/auth/refresh
 * Uses httpOnly cookie (sent automatically via withCredentials).
 * Returns a new access token.
 *
 * NOTE: This function is intentionally NOT used by the 401 interceptor
 * (which uses a separate axios instance to avoid recursive interception).
 * It is exported for direct use where needed.
 */
export async function refreshApi(): Promise<RefreshResponse> {
  const response = await httpClient.post<ApiResponse<RefreshResponse>>(
    '/auth/refresh',
  )
  return response.data.data
}

/**
 * POST /api/v1/auth/logout
 * Requires Bearer token (attached automatically by request interceptor).
 * Backend clears the httpOnly refresh cookie.
 */
export async function logoutApi(): Promise<void> {
  await httpClient.post('/auth/logout')
}

/**
 * Type guard to extract a human-readable message from an API error.
 * Falls back to a generic message if the shape doesn't match.
 */
export function extractApiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string | string[] }>
  const messageField = axiosError?.response?.data?.message
  if (Array.isArray(messageField)) {
    return messageField.join('. ')
  }
  if (typeof messageField === 'string') {
    return messageField
  }
  return 'Произошла ошибка. Попробуйте ещё раз.'
}
