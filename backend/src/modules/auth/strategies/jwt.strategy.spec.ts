import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlatformAdminStatus, UserRole } from '@prisma/client';
import { AuthService } from '../auth.service';
import { JwtStrategy } from './jwt.strategy';

const mockConfigService = {
  get: jest.fn((key: string) => {
    const values: Record<string, string> = {
      JWT_SECRET: 'test-jwt-secret',
      NODE_ENV: 'test',
    };

    return values[key];
  }),
};

const mockAuthService = {
  validateUser: jest.fn(),
  validatePlatformAdmin: jest.fn(),
  validateImpersonationSession: jest.fn(),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(
      mockConfigService as ConfigService,
      mockAuthService as unknown as AuthService,
    );
  });

  it('validates platform admin tokens through platform identity only', async () => {
    mockAuthService.validatePlatformAdmin.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      status: PlatformAdminStatus.active,
      authType: 'platform',
    });

    await expect(
      strategy.validate({
        sub: 'admin-1',
        email: 'admin@example.com',
        type: 'platform',
      }),
    ).resolves.toEqual({
      id: 'admin-1',
      email: 'admin@example.com',
      status: PlatformAdminStatus.active,
      authType: 'platform',
    });

    expect(mockAuthService.validateUser).not.toHaveBeenCalled();
    expect(mockAuthService.validatePlatformAdmin).toHaveBeenCalledWith(
      'admin-1',
    );
  });

  it('validates impersonation tokens as tenant admin context', async () => {
    mockAuthService.validateImpersonationSession.mockResolvedValue({
      id: 'tenant-admin-1',
      email: 'owner@example.com',
      role: UserRole.admin,
      companyId: 'company-1',
      authType: 'impersonation',
      platformAdminId: 'admin-1',
      platformAdminEmail: 'admin@example.com',
      impersonationSessionId: 'session-1',
    });

    await expect(
      strategy.validate({
        sub: 'admin-1',
        companyId: 'company-1',
        sessionId: 'session-1',
        type: 'impersonation',
      }),
    ).resolves.toMatchObject({
      role: UserRole.admin,
      companyId: 'company-1',
      authType: 'impersonation',
      platformAdminId: 'admin-1',
    });

    expect(mockAuthService.validateImpersonationSession).toHaveBeenCalledWith(
      'admin-1',
      'session-1',
      'company-1',
    );
  });

  it('rejects malformed impersonation payloads', async () => {
    await expect(
      strategy.validate({
        sub: 'admin-1',
        type: 'impersonation',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
