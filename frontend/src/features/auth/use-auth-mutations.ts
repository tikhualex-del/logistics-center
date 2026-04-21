import { useMutation } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  loginApi,
  registerApi,
  logoutApi,
} from '@/api/auth.api'
import type {
  LoginRequest,
  RegisterRequest,
  AuthTokenResponse,
} from '@/api/auth.api'
import type { ApiError } from '@/api/http-client'
import { ROUTES } from '@/lib'
import { useAuthStore } from '@/store'

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * TanStack Query mutation for user login.
 *
 * On success: persists auth state via Zustand store and navigates to dispatcher.
 * On error: mutation.error contains the AxiosError — components render it inline.
 */
export function useLoginMutation(): UseMutationResult<
  AuthTokenResponse,
  AxiosError<ApiError>,
  LoginRequest
> {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation<AuthTokenResponse, AxiosError<ApiError>, LoginRequest>({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      navigate(ROUTES.DISPATCHER)
    },
  })
}

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * TanStack Query mutation for company + user registration.
 *
 * On success: persists auth state and navigates to dispatcher.
 */
export function useRegisterMutation(): UseMutationResult<
  AuthTokenResponse,
  AxiosError<ApiError>,
  RegisterRequest
> {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation<AuthTokenResponse, AxiosError<ApiError>, RegisterRequest>({
    mutationFn: registerApi,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      navigate(ROUTES.DISPATCHER)
    },
  })
}

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * TanStack Query mutation for logout.
 *
 * Uses onSettled (not onSuccess) so auth is always cleared even if the
 * backend call fails (e.g., expired token at logout time).
 */
export function useLogoutMutation(): UseMutationResult<
  void,
  AxiosError<ApiError>,
  void
> {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  return useMutation<void, AxiosError<ApiError>, void>({
    mutationFn: logoutApi,
    onSettled: () => {
      clearAuth()
      navigate(ROUTES.LOGIN)
    },
  })
}
