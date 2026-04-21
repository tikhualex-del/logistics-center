import { UserRole } from '@prisma/client';
import {
  ALL_PERMISSION_NAMES,
  ROLE_PERMISSION_MATRIX,
  getPermissionsForRole,
  hasPermission,
} from './permission-matrix';

describe('permission-matrix', () => {
  it('grants every declared permission to admins', () => {
    expect(getPermissionsForRole(UserRole.admin)).toEqual(ALL_PERMISSION_NAMES);

    for (const permission of ALL_PERMISSION_NAMES) {
      expect(hasPermission(UserRole.admin, permission)).toBe(true);
    }
  });

  it.each([
    [
      UserRole.dispatcher,
      [
        'view:orders',
        'edit:orders',
        'edit:routes',
        'view:operational-analytics',
        'manage:couriers',
        'manage:shifts',
      ],
    ],
    [UserRole.courier, ['view:orders', 'view:own-earnings']],
  ] as const)(
    'matches the expected permission set for %s',
    (role, expected) => {
      expect(getPermissionsForRole(role)).toEqual(expected);
    },
  );

  it('does not grant privileged admin permissions to dispatcher or courier roles', () => {
    const privilegedPermissions = [
      'edit:payment-rules',
      'approve:motivation-rules',
      'view:financial-analytics',
      'connect:integrations',
      'manage:users',
    ] as const;

    for (const role of [UserRole.dispatcher, UserRole.courier]) {
      for (const permission of privilegedPermissions) {
        expect(hasPermission(role, permission)).toBe(false);
      }
    }
  });

  it('keeps every role permission inside the declared permission list', () => {
    for (const permissions of Object.values(ROLE_PERMISSION_MATRIX)) {
      for (const permission of permissions) {
        expect(ALL_PERMISSION_NAMES).toContain(permission);
      }
    }
  });
});
