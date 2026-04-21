import httpClient from './http-client'
import type { ApiResponse } from './http-client'
import type { UserRole } from '@/store/auth.store'

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface User {
  id: string
  companyId: string
  email: string
  phone: string | null
  firstName: string
  lastName: string | null
  role: UserRole
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateUserDto {
  email: string
  password: string
  firstName: string
  lastName?: string
  phone?: string
  role: UserRole
}

export interface UpdateUserDto {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: UserRole
  isActive?: boolean
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/users
 * Admin-only: returns all users for the current company.
 * Backend enforces role check (admin only).
 */
export async function getUsers(): Promise<User[]> {
  const response = await httpClient.get<ApiResponse<User[]>>('/users')
  return response.data.data
}

/**
 * POST /api/v1/users
 * Admin-only: creates a new user in the current company.
 */
export async function createUser(data: CreateUserDto): Promise<User> {
  const response = await httpClient.post<ApiResponse<User>>('/users', data)
  return response.data.data
}

/**
 * PATCH /api/v1/users/:id
 * Admin-only: updates user profile or role within the current company.
 */
export async function updateUser(
  id: string,
  data: UpdateUserDto,
): Promise<User> {
  const response = await httpClient.patch<ApiResponse<User>>(
    `/users/${id}`,
    data,
  )
  return response.data.data
}
