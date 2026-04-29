import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PaymentRuleType } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentRulesService } from './payment-rules.service';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const baseRule = {
  id: 'rule-version-1',
  company_id: 'company-1',
  rule_key: 'rule-key-1',
  name: 'Central zone payout',
  rule_type: PaymentRuleType.zone_rate,
  version: 1,
  config: {
    value: 250,
    conditions: {
      zoneId: 'zone-1',
    },
  },
  changed_by_user_id: 'user-1',
  change_reason: 'Initial setup',
  is_active: true,
  effective_from: new Date('2025-01-01T00:00:00.000Z'),
  effective_to: null,
  created_at: new Date('2026-04-17T10:00:00.000Z'),
  updated_at: new Date('2026-04-17T10:00:00.000Z'),
};

const otherRuleVersion = {
  ...baseRule,
  id: 'rule-version-2',
  version: 2,
  name: 'Central zone payout v2',
  config: {
    value: 300,
    conditions: {
      zoneId: 'zone-1',
    },
  },
  created_at: new Date('2026-04-18T10:00:00.000Z'),
  updated_at: new Date('2026-04-18T10:00:00.000Z'),
};

const inactiveRule = {
  ...baseRule,
  id: 'rule-version-3',
  rule_key: 'rule-key-2',
  name: 'Legacy per-order payout',
  rule_type: PaymentRuleType.per_order,
  config: {
    value: 90,
    conditions: null,
  },
  is_active: false,
};

const mockPrismaService = {
  paymentRuleVersion: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  runWithTenant: jest.fn(),
};

describe('PaymentRulesService', () => {
  let service: PaymentRulesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRulesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PaymentRulesService>(PaymentRulesService);
  });

  it('creates version 1 payment rule with normalized config payload', async () => {
    mockPrismaService.paymentRuleVersion.create.mockResolvedValue(baseRule);

    const result = await service.createPaymentRule('company-1', 'user-1', {
      name: 'Central zone payout',
      ruleType: PaymentRuleType.zone_rate,
      value: 250,
      conditions: { zoneId: 'zone-1' },
      changeReason: 'Initial setup',
      isActive: true,
      effectiveFrom: new Date('2026-04-17T00:00:00.000Z'),
    });

    expect(mockPrismaService.paymentRuleVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        name: 'Central zone payout',
        rule_type: PaymentRuleType.zone_rate,
        version: 1,
        changed_by_user_id: 'user-1',
        change_reason: 'Initial setup',
        is_active: true,
        config: {
          value: 250,
          conditions: { zoneId: 'zone-1' },
        },
      }),
      select: expect.any(Object),
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'rule-version-1',
        ruleKey: 'rule-key-1',
        version: 1,
        value: 250,
        conditions: { zoneId: 'zone-1' },
      }),
    );
  });

  it('lists only latest active rules by default', async () => {
    mockPrismaService.paymentRuleVersion.findMany.mockResolvedValue([
      otherRuleVersion,
      baseRule,
      inactiveRule,
    ]);

    const result = await service.listPaymentRules('company-1', {});

    expect(mockPrismaService.paymentRuleVersion.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [
        { rule_key: 'asc' },
        { version: 'desc' },
        { created_at: 'desc' },
      ],
      select: expect.any(Object),
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'rule-version-2',
        version: 2,
        value: 300,
      }),
    );
  });

  it('can include history and inactive rules in the list', async () => {
    mockPrismaService.paymentRuleVersion.findMany.mockResolvedValue([
      otherRuleVersion,
      baseRule,
      inactiveRule,
    ]);

    const result = await service.listPaymentRules('company-1', {
      includeHistory: true,
      includeInactive: true,
      ruleType: PaymentRuleType.per_order,
    });

    expect(mockPrismaService.paymentRuleVersion.findMany).toHaveBeenCalledWith({
      where: {
        rule_type: PaymentRuleType.per_order,
      },
      orderBy: [
        { rule_key: 'asc' },
        { version: 'desc' },
        { created_at: 'desc' },
      ],
      select: expect.any(Object),
    });
    expect(result).toHaveLength(3);
  });

  it('creates a new immutable version on patch', async () => {
    mockPrismaService.paymentRuleVersion.findFirst
      .mockResolvedValueOnce(baseRule)
      .mockResolvedValueOnce(baseRule);
    mockPrismaService.paymentRuleVersion.create.mockResolvedValue(
      otherRuleVersion,
    );

    const result = await service.updatePaymentRule(
      'company-1',
      'user-2',
      'rule-version-1',
      {
        name: 'Central zone payout v2',
        value: 300,
        changeReason: 'Raised zone compensation',
      },
    );

    expect(mockPrismaService.paymentRuleVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        rule_key: 'rule-key-1',
        name: 'Central zone payout v2',
        version: 2,
        changed_by_user_id: 'user-2',
        change_reason: 'Raised zone compensation',
        config: {
          value: 300,
          conditions: { zoneId: 'zone-1' },
        },
      }),
      select: expect.any(Object),
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'rule-version-2',
        version: 2,
        value: 300,
      }),
    );
  });

  it('rejects updates for non-latest versions', async () => {
    mockPrismaService.paymentRuleVersion.findFirst
      .mockResolvedValueOnce(baseRule)
      .mockResolvedValueOnce(otherRuleVersion);

    await expect(
      service.updatePaymentRule('company-1', 'user-2', 'rule-version-1', {
        value: 300,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when updating missing rule version', async () => {
    mockPrismaService.paymentRuleVersion.findFirst.mockResolvedValue(null);

    await expect(
      service.updatePaymentRule('company-1', 'user-2', 'missing-rule', {
        value: 300,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
