import { UserRole } from '@prisma/client';

export const ALL_PERMISSION_NAMES = [
  'view:orders',
  'edit:orders',
  'edit:routes',
  'edit:zones',
  'edit:payment-rules',
  'approve:motivation-rules',
  'view:financial-analytics',
  'view:operational-analytics',
  'view:own-earnings',
  'manage:couriers',
  'manage:shifts',
  'connect:integrations',
  'manage:users',
] as const;

export type PermissionName = (typeof ALL_PERMISSION_NAMES)[number];

const ADMIN_PERMISSIONS: readonly PermissionName[] = ALL_PERMISSION_NAMES;
const DISPATCHER_PERMISSIONS = [
  'view:orders',
  'edit:orders',
  'edit:routes',
  'view:operational-analytics',
  'manage:couriers',
  'manage:shifts',
] as const satisfies readonly PermissionName[];
const COURIER_PERMISSIONS = [
  'view:orders',
  'view:own-earnings',
] as const satisfies readonly PermissionName[];

export const ROLE_PERMISSION_MATRIX: Record<UserRole, readonly PermissionName[]> =
  {
    [UserRole.admin]: ADMIN_PERMISSIONS,
    [UserRole.dispatcher]: DISPATCHER_PERMISSIONS,
    [UserRole.courier]: COURIER_PERMISSIONS,
  };

export function getPermissionsForRole(role: UserRole): readonly PermissionName[] {
  return ROLE_PERMISSION_MATRIX[role] ?? [];
}

export function hasPermission(
  role: UserRole,
  permission: PermissionName,
): boolean {
  return getPermissionsForRole(role).includes(permission);
}
