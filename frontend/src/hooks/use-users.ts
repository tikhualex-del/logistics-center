import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { QUERY_KEYS } from '@/api/query-keys'
import { QUERY_STALE_TIME } from '@/lib/constants'
import {
  getUsers,
  createUser,
  updateUser,
  type User,
  type CreateUserDto,
  type UpdateUserDto,
} from '@/api/users.api'

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches all users for the current company.
 * Admin-only — backend enforces the role guard.
 * Used by: user management page (admin settings).
 *
 * StaleTime: LONG (5min) — user roster changes infrequently.
 */
export function useUsers(options?: Partial<UseQueryOptions<User[]>>) {
  return useQuery({
    queryKey: QUERY_KEYS.users.list(),
    queryFn: getUsers,
    staleTime: QUERY_STALE_TIME.LONG,
    ...options,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Creates a new user in the current company.
 * Admin-only — backend enforces role guard.
 * Invalidates users list on success.
 */
export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserDto) => createUser(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all })
    },
  })
}

/**
 * Updates a user's profile or role.
 * Admin-only — backend enforces role guard.
 * Invalidates users list on success.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      updateUser(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all })
    },
  })
}
