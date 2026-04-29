import { Test, type TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth-request.types';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

const mockCompaniesService = {
  getCurrentCompany: jest.fn(),
  updateCompany: jest.fn(),
  listFeatureFlags: jest.fn(),
  upsertFeatureFlag: jest.fn(),
};

const authenticatedUser: AuthenticatedUser = {
  id: 'user-1',
  email: 'admin@example.com',
  role: UserRole.admin,
  companyId: 'company-1',
};

describe('CompaniesController', () => {
  let controller: CompaniesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        { provide: CompaniesService, useValue: mockCompaniesService },
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
  });

  it('returns current tenant company profile', async () => {
    const serviceResult = {
      id: authenticatedUser.companyId,
      name: 'Fast Delivery LLC',
      createdAt: new Date('2026-04-16T10:00:00.000Z'),
      updatedAt: new Date('2026-04-16T10:00:00.000Z'),
    };
    mockCompaniesService.getCurrentCompany.mockResolvedValue(serviceResult);

    await expect(
      controller.getCurrentCompany(authenticatedUser.companyId),
    ).resolves.toEqual(serviceResult);
    expect(mockCompaniesService.getCurrentCompany).toHaveBeenCalledWith(
      authenticatedUser.companyId,
    );
  });

  it('updates current company within tenant scope', async () => {
    const dto = { name: 'Updated Logistics' };
    const serviceResult = {
      id: authenticatedUser.companyId,
      name: dto.name,
      createdAt: new Date('2026-04-16T10:00:00.000Z'),
      updatedAt: new Date('2026-04-16T10:10:00.000Z'),
    };
    mockCompaniesService.updateCompany.mockResolvedValue(serviceResult);

    await expect(
      controller.updateCurrentCompany(authenticatedUser.companyId, dto),
    ).resolves.toEqual(serviceResult);
    expect(mockCompaniesService.updateCompany).toHaveBeenCalledWith(
      authenticatedUser.companyId,
      dto,
    );
  });

  it('lists tenant feature flags', async () => {
    const serviceResult = [
      {
        id: 'flag-1',
        companyId: authenticatedUser.companyId,
        featureKey: 'ai.dispatch-suggestions',
        enabled: true,
        config: { rollout: 100 },
        updatedByUserId: authenticatedUser.id,
        enabledAt: new Date('2026-04-16T10:00:00.000Z'),
        disabledAt: null,
        createdAt: new Date('2026-04-16T10:00:00.000Z'),
        updatedAt: new Date('2026-04-16T10:00:00.000Z'),
      },
    ];
    mockCompaniesService.listFeatureFlags.mockResolvedValue(serviceResult);

    await expect(
      controller.listFeatureFlags(authenticatedUser.companyId),
    ).resolves.toEqual(serviceResult);
    expect(mockCompaniesService.listFeatureFlags).toHaveBeenCalledWith(
      authenticatedUser.companyId,
    );
  });

  it('updates a tenant feature flag with actor context', async () => {
    const dto = { enabled: false, config: { rollout: 0 } };
    const serviceResult = {
      id: 'flag-1',
      companyId: authenticatedUser.companyId,
      featureKey: 'ai.dispatch-suggestions',
      enabled: false,
      config: dto.config,
      updatedByUserId: authenticatedUser.id,
      enabledAt: null,
      disabledAt: new Date('2026-04-16T10:15:00.000Z'),
      createdAt: new Date('2026-04-16T10:00:00.000Z'),
      updatedAt: new Date('2026-04-16T10:15:00.000Z'),
    };
    mockCompaniesService.upsertFeatureFlag.mockResolvedValue(serviceResult);

    await expect(
      controller.updateFeatureFlag(
        authenticatedUser.companyId,
        authenticatedUser.id,
        'ai.dispatch-suggestions',
        dto,
      ),
    ).resolves.toEqual(serviceResult);
    expect(mockCompaniesService.upsertFeatureFlag).toHaveBeenCalledWith(
      authenticatedUser.companyId,
      'ai.dispatch-suggestions',
      dto,
      authenticatedUser.id,
    );
  });
});
