import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesService } from './companies.service';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockPrismaService = {
  company: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  companyFeature: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  runWithTenant: jest.fn(),
  runWithoutTenant: jest.fn(),
};

describe('CompaniesService', () => {
  let service: CompaniesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );
    mockPrismaService.runWithoutTenant.mockImplementation(
      async (callback: () => Promise<unknown>) => await callback(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('returns current company profile', async () => {
    mockPrismaService.company.findUnique.mockResolvedValue({
      id: 'company-1',
      name: 'Fast Delivery LLC',
      created_at: new Date('2026-04-16T10:00:00.000Z'),
      updated_at: new Date('2026-04-16T10:00:00.000Z'),
    });

    const result = await service.getCurrentCompany('company-1');

    expect(mockPrismaService.company.findUnique).toHaveBeenCalledWith({
      where: { id: 'company-1' },
      select: expect.any(Object),
    });
    expect(result.name).toBe('Fast Delivery LLC');
  });

  it('updates existing company profile', async () => {
    mockPrismaService.company.findUnique.mockResolvedValue({ id: 'company-1' });
    mockPrismaService.company.update.mockResolvedValue({
      id: 'company-1',
      name: 'Updated Logistics',
      created_at: new Date('2026-04-16T10:00:00.000Z'),
      updated_at: new Date('2026-04-16T10:10:00.000Z'),
    });

    const result = await service.updateCompany('company-1', {
      name: 'Updated Logistics',
    });

    expect(mockPrismaService.company.update).toHaveBeenCalledWith({
      where: { id: 'company-1' },
      data: { name: 'Updated Logistics' },
      select: expect.any(Object),
    });
    expect(result.name).toBe('Updated Logistics');
  });

  it('throws when updating missing company', async () => {
    mockPrismaService.company.findUnique.mockResolvedValue(null);

    await expect(
      service.updateCompany('missing-company', { name: 'Ghost Co' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists company feature flags in tenant scope', async () => {
    mockPrismaService.company.findUnique.mockResolvedValue({ id: 'company-1' });
    mockPrismaService.companyFeature.findMany.mockResolvedValue([
      {
        id: 'flag-1',
        company_id: 'company-1',
        feature_key: 'ai.dispatch-suggestions',
        enabled: true,
        config: { rollout: 100 },
        updated_by_user_id: 'user-1',
        enabled_at: new Date('2026-04-16T10:00:00.000Z'),
        disabled_at: null,
        created_at: new Date('2026-04-16T10:00:00.000Z'),
        updated_at: new Date('2026-04-16T10:00:00.000Z'),
      },
    ]);

    const result = await service.listFeatureFlags('company-1');

    expect(mockPrismaService.companyFeature.findMany).toHaveBeenCalledWith({
      orderBy: { feature_key: 'asc' },
      select: expect.any(Object),
    });
    expect(result[0]?.featureKey).toBe('ai.dispatch-suggestions');
  });

  it('creates a new enabled feature flag', async () => {
    mockPrismaService.company.findUnique.mockResolvedValue({ id: 'company-1' });
    mockPrismaService.companyFeature.findFirst.mockResolvedValue(null);
    mockPrismaService.companyFeature.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'flag-1',
        company_id: data.company_id,
        feature_key: data.feature_key,
        enabled: data.enabled,
        config: data.config,
        updated_by_user_id: data.updated_by_user_id,
        enabled_at: data.enabled_at,
        disabled_at: data.disabled_at,
        created_at: new Date('2026-04-16T10:00:00.000Z'),
        updated_at: new Date('2026-04-16T10:00:00.000Z'),
      }),
    );

    const result = await service.upsertFeatureFlag(
      'company-1',
      'AI.Dispatch-Suggestions',
      {
        enabled: true,
        config: { rollout: 100 },
      },
      'user-1',
    );

    expect(mockPrismaService.companyFeature.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          company_id: 'company-1',
          feature_key: 'ai.dispatch-suggestions',
          enabled: true,
          updated_by_user_id: 'user-1',
        }),
      }),
    );
    expect(result.enabled).toBe(true);
    expect(result.featureKey).toBe('ai.dispatch-suggestions');
  });

  it('disables an existing feature flag and stores disabled timestamp', async () => {
    const disabledAtBefore = new Date('2026-04-15T10:00:00.000Z');
    mockPrismaService.company.findUnique.mockResolvedValue({ id: 'company-1' });
    mockPrismaService.companyFeature.findFirst.mockResolvedValue({
      id: 'flag-1',
      enabled: true,
      enabled_at: new Date('2026-04-16T09:00:00.000Z'),
      disabled_at: disabledAtBefore,
    });
    mockPrismaService.companyFeature.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'flag-1',
        company_id: 'company-1',
        feature_key: 'ai.dispatch-suggestions',
        enabled: data.enabled,
        config: Prisma.JsonNull,
        updated_by_user_id: data.updated_by_user_id,
        enabled_at: new Date('2026-04-16T09:00:00.000Z'),
        disabled_at: data.disabled_at,
        created_at: new Date('2026-04-16T09:00:00.000Z'),
        updated_at: new Date('2026-04-16T10:30:00.000Z'),
      }),
    );

    const result = await service.upsertFeatureFlag(
      'company-1',
      'ai.dispatch-suggestions',
      {
        enabled: false,
      },
      'user-2',
    );

    expect(mockPrismaService.companyFeature.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'flag-1' },
        data: expect.objectContaining({
          enabled: false,
          updated_by_user_id: 'user-2',
          disabled_at: expect.any(Date),
        }),
      }),
    );
    expect(result.enabled).toBe(false);
    expect(result.disabledAt).toEqual(expect.any(Date));
  });
});
