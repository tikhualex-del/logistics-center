'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from './api'
import type { InviteUserInput, UpdateUserRoleInput } from './types'

const USERS_KEY = 'users'

export function useUsers() {
  return useQuery({
    queryKey: [USERS_KEY],
    queryFn: () => usersApi.list(),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: [USERS_KEY, id],
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  })
}

export function useInviteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: InviteUserInput) => usersApi.invite(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  })
}

export function useUpdateUserRole(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateUserRoleInput) => usersApi.updateRole(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  })
}
