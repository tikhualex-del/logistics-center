import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { PlatformAdminStatus, UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/auth-request.types';
import { PlatformGuard } from './platform.guard';

describe('PlatformGuard', () => {
  const guard = new PlatformGuard();

  it('allows active platform admin context', () => {
    expect(
      guard.canActivate(
        createHttpContext({
          id: 'admin-1',
          email: 'admin@example.com',
          status: PlatformAdminStatus.active,
          authType: 'platform',
        }),
      ),
    ).toBe(true);
  });

  it('rejects tenant user context', () => {
    expect(() =>
      guard.canActivate(
        createHttpContext({
          id: 'user-1',
          email: 'tenant@example.com',
          role: UserRole.admin,
          companyId: 'company-1',
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects impersonation context on platform routes', () => {
    expect(() =>
      guard.canActivate(
        createHttpContext({
          id: 'user-1',
          email: 'tenant@example.com',
          role: UserRole.admin,
          companyId: 'company-1',
          authType: 'impersonation',
          platformAdminId: 'admin-1',
          platformAdminEmail: 'admin@example.com',
          impersonationSessionId: 'session-1',
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});

function createHttpContext(user: AuthenticatedUser): ExecutionContext {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}
