import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { FeatureFlagsService } from './feature-flags.service';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockPrismaService = {
  companyFeature: {
    findFirst: jest.fn(),
  },
  runWithTenant: jest.fn(),
};

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
  });

  it('returns true when feature flag is enabled', async () => {
    mockPrismaService.companyFeature.findFirst.mockResolvedValue({
      id: 'flag-1',
    });

    await expect(
      service.isEnabled('ai.dispatch-suggestions', 'company-1'),
    ).resolves.toBe(true);
    expect(mockPrismaService.companyFeature.findFirst).toHaveBeenCalledWith({
      where: {
        feature_key: 'ai.dispatch-suggestions',
        enabled: true,
      },
      select: { id: true },
    });
  });

  it('returns false when feature flag is missing', async () => {
    mockPrismaService.companyFeature.findFirst.mockResolvedValue(null);

    await expect(
      service.isEnabled('ai.dispatch-suggestions', 'company-1'),
    ).resolves.toBe(false);
  });
});
