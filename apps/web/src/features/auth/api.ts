import { apiClient } from '@/lib/api/client'
import type { LoginInput, PlatformLoginInput, LoginResponse } from './types'

export const authApi = {
  login: (input: LoginInput): Promise<LoginResponse> =>
    apiClient.post('/auth/login', input),

  platformLogin: (input: PlatformLoginInput): Promise<LoginResponse> =>
    apiClient.post('/auth/platform/login', input),

  me: (): Promise<LoginResponse['user']> =>
    apiClient.get('/auth/me'),
}
