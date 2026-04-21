import { SetMetadata } from '@nestjs/common';
import type { PermissionName } from '../../modules/auth/permissions/permission-matrix';

export const REQUIRE_PERMISSION_KEY = 'required_permissions';

export const RequirePermission = (...permissions: PermissionName[]) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permissions);
