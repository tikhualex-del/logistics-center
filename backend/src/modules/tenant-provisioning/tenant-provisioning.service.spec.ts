import { CompanyStatus, UserRole } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantProvisioningService } from './tenant-provisioning.service';

const mockTx = {
  company: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  user: {
    create: jest.fn(),
    count: jest.fn(),
  },
  companyFeature: {
    createMany: jest.fn(),
  },
  platformAuditEvent: {
    create: jest.fn(),
  },
};

const mockPrismaService = {
  $transaction: jest.fn(),
  runWithoutTenant: jest.fn(),
};

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
};

describe('TenantProvisioningService', () => {
  let service: TenantProvisioningService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaService.runWithoutTenant.mockImplementation(
      async (callback: () => Promise<unknown>) => await callback(),
    );
    mockPrismaService.$transaction.mockImplementation(
      async (callback: (tx: typeof mockTx) => Promise<unknown>) =>
        await callback(mockTx),
    );

    service = new TenantProvisioningService(
      mockPrismaService as unknown as PrismaService,
      mockLogger as unknown as PinoLogger,
    );
  });

  it('creates company, owner admin, default features, and platform audit in one transaction', async () => {
    mockTx.company.create.mockResolvedValue({
      id: 'company-1',
      name: 'Fast Delivery LLC',
      slug: 'fast-delivery',
      status: CompanyStatus.active,
      timezone: 'Europe/Moscow',
      default_currency: 'RUB',
      language: 'ru',
      country: 'RU',
      contact_email: 'ops@example.com',
      contact_phone: null,
      plan_id: 'starter',
      created_at: new Date('2026-04-30T09:00:00.000Z'),
      updated_at: new Date('2026-04-30T09:00:00.000Z'),
    });
    mockTx.user.create.mockResolvedValue({
      id: 'owner-1',
      company_id: 'company-1',
      role: UserRole.admin,
      email: 'owner@example.com',
      first_name: 'Ivan',
      last_name: 'Petrov',
      is_active: true,
      created_at: new Date('2026-04-30T09:00:00.000Z'),
    });
    mockTx.companyFeature.createMany.mockResolvedValue({ count: 5 });
    mockTx.platformAuditEvent.create.mockResolvedValue({});

    const result = await service.provisionCompany(
      {
        name: 'Fast Delivery LLC',
        slug: 'fast-delivery',
        timezone: 'Europe/Moscow',
        contactEmail: 'ops@example.com',
        planId: 'starter',
        owner: {
          email: 'owner@example.com',
          password: 'SecurePass123!',
          firstName: 'Ivan',
          lastName: 'Petrov',
        },
      },
      'platform-admin-1',
    );

    expect(result.company.id).toBe('company-1');
    expect(result.owner.role).toBe(UserRole.admin);
    expect(mockTx.company.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'fast-delivery',
          status: CompanyStatus.active,
        }),
      }),
    );
    expect(mockTx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          company_id: 'company-1',
          email: 'owner@example.com',
          role: UserRole.admin,
          is_active: true,
        }),
      }),
    );
    expect(mockTx.companyFeature.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ feature_key: 'routing.yandex' }),
          expect.objectContaining({ feature_key: 'notifications.realtime' }),
        ]),
        skipDuplicates: true,
      }),
    );
    expect(mockTx.platformAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actor_id: 'platform-admin-1',
          action: 'tenant.provisioned',
          company_id: 'company-1',
        }),
      }),
    );
  });
});
