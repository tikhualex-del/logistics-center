import { apiClient } from '@/lib/api/client'
import type { User, InviteUserInput, UpdateUserRoleInput } from './types'

export const usersApi = {
  list: (): Promise<User[]> =>
    apiClient.get('/users'),

  get: (id: string): Promise<User> =>
    apiClient.get(`/users/${id}`),

  invite: (input: InviteUserInput): Promise<User> =>
    apiClient.post('/users', input),

  updateRole: (id: string, input: UpdateUserRoleInput): Promise<User> =>
    apiClient.patch(`/users/${id}`, input),

  deactivate: (id: string): Promise<User> =>
    apiClient.patch(`/users/${id}`, { status: 'suspended' }),
}
