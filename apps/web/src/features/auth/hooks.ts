'use client'

import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/auth-context'
import { authApi } from './api'
import type { LoginInput, PlatformLoginInput } from './types'

export function useLogin() {
  const { login } = useAuth()

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => login(data.token, data.user),
  })
}

export function usePlatformLogin() {
  const { login } = useAuth()

  return useMutation({
    mutationFn: (input: PlatformLoginInput) => authApi.platformLogin(input),
    onSuccess: (data) => login(data.token, data.user),
  })
}
