import { Test, type TestingModule } from '@nestjs/testing';
import { PaymentRuleType } from '@prisma/client';
import { PaymentRulesController } from './payment-rules.controller';
import { PaymentRulesService } from './payment-rules.service';

const mockPaymentRulesService = {
  createPaymentRule: jest.fn(),
  listPaymentRules: jest.fn(),
  updatePaymentRule: jest.fn(),
};

const paymentRuleResponse = {
  id: 'rule-version-1',
  companyId: 'company-1',
  ruleKey: 'rule-key-1',
  name: 'Central zone payout',
  ruleType: PaymentRuleType.zone_rate,
  version: 1,
  value: 250,
  conditions: { zoneId: 'zone-1' },
  isActive: true,
  effectiveFrom: new Date('2026-04-17T00:00:00.000Z'),
  effectiveTo: null,
  changedByUserId: 'user-1',
  changeReason: 'Initial setup',
  createdAt: new Date('2026-04-17T10:00:00.000Z'),
  updatedAt: new Date('2026-04-17T10:00:00.000Z'),
};

describe('PaymentRulesController', () => {
  let controller: PaymentRulesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentRulesController],
      providers: [
        { provide: PaymentRulesService, useValue: mockPaymentRulesService },
      ],
    }).compile();

    controller = module.get<PaymentRulesController>(PaymentRulesController);
  });

  it('creates a payment rule in tenant scope', async () => {
    const dto = {
      name: 'Central zone payout',
      ruleType: PaymentRuleType.zone_rate,
      value: 250,
      conditions: { zoneId: 'zone-1' },
    };
    mockPaymentRulesService.createPaymentRule.mockResolvedValue(paymentRuleResponse);

    await expect(
      controller.createPaymentRule('company-1', 'user-1', dto),
    ).resolves.toEqual(paymentRuleResponse);
    expect(mockPaymentRulesService.createPaymentRule).toHaveBeenCalledWith(
      'company-1',
      'user-1',
      dto,
    );
  });

  it('lists payment rules inside tenant scope', async () => {
    const query = { includeHistory: false, includeInactive: false };
    mockPaymentRulesService.listPaymentRules.mockResolvedValue([
      paymentRuleResponse,
    ]);

    await expect(controller.listPaymentRules('company-1', query)).resolves.toEqual(
      [paymentRuleResponse],
    );
    expect(mockPaymentRulesService.listPaymentRules).toHaveBeenCalledWith(
      'company-1',
      query,
    );
  });

  it('patches a payment rule by creating a new version', async () => {
    const dto = {
      value: 300,
      changeReason: 'Raised zone compensation',
    };
    const updatedRule = {
      ...paymentRuleResponse,
      id: 'rule-version-2',
      version: 2,
      value: 300,
      changeReason: dto.changeReason,
    };
    mockPaymentRulesService.updatePaymentRule.mockResolvedValue(updatedRule);

    await expect(
      controller.updatePaymentRule('company-1', 'user-1', 'rule-version-1', dto),
    ).resolves.toEqual(updatedRule);
    expect(mockPaymentRulesService.updatePaymentRule).toHaveBeenCalledWith(
      'company-1',
      'user-1',
      'rule-version-1',
      dto,
    );
  });
});
