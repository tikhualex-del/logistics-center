import { BadRequestException } from '@nestjs/common';
import { CompanyStatus, PlatformAdminStatus } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { TenantProvisioningService } from '../tenant-provisioning/tenant-provisioning.service';
import { PlatformService } from './platform.service';

const mockPrismaService = {
  company: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  platformSuperAdmin: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  platformImpersonationSession: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  platformAuditEvent: {
    create: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  runWithTenant: jest.fn(),
  runWithoutTenant: jest.fn(),
};

const mockProvisioningService = {
  provisionCompany: jest.fn(),
  seedOwner: jest.fn(),
};

const mockAuthService = {
  generateImpersonationAccessToken: jest.fn(),
};

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
};

describe('PlatformService', () => {
  let service: PlatformService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaService.runWithoutTenant.mockImplementation(
      async (callback: () => Promise<unknown>) => await callback(),
    );
    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );

    service = new PlatformService(
      mockPrismaService as unknown as PrismaService,
      mockProvisioningService as unknown as TenantProvisioningService,
      mockAuthService as unknown as AuthService,
      mockLogger as unknown as PinoLogger,
    );
  });

  it('prevents platform admins from suspending themselves', async () => {
    mockPrismaService.platformSuperAdmin.findUnique.mockResolvedValue({
      id: 'admin-1',
      status: PlatformAdminStatus.active,
    });

    await expect(
      service.updateAdmin(
        'admin-1',
        { status: PlatformAdminStatus.suspended },
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrismaService.platformSuperAdmin.update).not.toHaveBeenCalled();
  });

  it('prevents suspending the last active platform admin', async () => {
    mockPrismaService.platformSuperAdmin.findUnique.mockResolvedValue({
      id: 'admin-2',
      status: PlatformAdminStatus.active,
    });
    mockPrismaService.platformSuperAdmin.count.mockResolvedValue(0);

    await expect(
      service.updateAdmin(
        'admin-2',
        { status: PlatformAdminStatus.suspended },
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrismaService.platformSuperAdmin.update).not.toHaveBeenCalled();
  });

  it('starts impersonation only for active companies and returns a token', async () => {
    mockPrismaService.company.findUnique.mockResolvedValue({
      id: 'company-1',
      status: CompanyStatus.active,
    });
    mockPrismaService.platformImpersonationSession.findFirst.mockResolvedValue(
      null,
    );
    mockPrismaService.platformImpersonationSession.create.mockResolvedValue({
      id: 'session-1',
      super_admin_id: 'admin-1',
      target_company_id: 'company-1',
      started_at: new Date('2026-04-30T09:00:00.000Z'),
      ended_at: null,
      reason: 'support',
    });
    mockAuthService.generateImpersonationAccessToken.mockReturnValue({
      accessToken: 'impersonation-token',
      expiresAt: new Date('2026-04-30T10:00:00.000Z'),
    });
    mockPrismaService.platformAuditEvent.create.mockResolvedValue({});

    await expect(
      service.startImpersonation('company-1', { reason: 'support' }, 'admin-1'),
    ).resolves.toEqual({
      accessToken: 'impersonation-token',
      sessionId: 'session-1',
      companyId: 'company-1',
      expiresAt: new Date('2026-04-30T10:00:00.000Z'),
    });

    expect(
      mockAuthService.generateImpersonationAccessToken,
    ).toHaveBeenCalledWith({
      adminId: 'admin-1',
      companyId: 'company-1',
      sessionId: 'session-1',
    });
  });

  it('rejects impersonation for non-active companies', async () => {
    mockPrismaService.company.findUnique.mockResolvedValue({
      id: 'company-1',
      status: CompanyStatus.suspended,
    });

    await expect(
      service.startImpersonation('company-1', {}, 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
