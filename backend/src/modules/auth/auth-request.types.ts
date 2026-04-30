import { PlatformAdminStatus, UserRole } from '@prisma/client';
import type { Request } from 'express';

export interface AuthenticatedTenantUser {
  id: string;
  email: string;
  role: UserRole;
  companyId: string;
  authType?: 'tenant';
}

export interface AuthenticatedImpersonationUser {
  id: string;
  email: string;
  role: UserRole;
  companyId: string;
  authType: 'impersonation';
  platformAdminId: string;
  platformAdminEmail: string;
  impersonationSessionId: string;
}

export interface AuthenticatedPlatformAdmin {
  id: string;
  email: string;
  status: PlatformAdminStatus;
  authType: 'platform';
  companyId?: never;
  role?: never;
}

export type TenantAuthenticatedUser =
  | AuthenticatedTenantUser
  | AuthenticatedImpersonationUser;

export type AuthenticatedUser =
  | TenantAuthenticatedUser
  | AuthenticatedPlatformAdmin;

export type RequestWithUser<TUser> = Request & {
  user: TUser;
};

export function isTenantAuthenticatedUser(
  user: AuthenticatedUser | null | undefined,
): user is TenantAuthenticatedUser {
  if (!user || user.authType === 'platform') {
    return false;
  }

  return Boolean(user.companyId);
}

export function isPlatformAdminUser(
  user: AuthenticatedUser | null | undefined,
): user is AuthenticatedPlatformAdmin {
  return user?.authType === 'platform';
}
