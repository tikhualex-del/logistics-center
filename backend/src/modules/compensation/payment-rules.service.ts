import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PaymentRuleType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentRuleDto } from './dto/create-payment-rule.dto';
import { ListPaymentRulesQueryDto } from './dto/list-payment-rules.query.dto';
import { PaymentRuleResponseDto } from './dto/payment-rule-response.dto';
import { UpdatePaymentRuleDto } from './dto/update-payment-rule.dto';
import {
  buildPaymentRuleConfig,
  isRuleEffectiveNow,
  parsePaymentRuleConfig,
  validateEffectiveWindow,
} from './payment-rule-config';

const paymentRuleSelect = {
  id: true,
  company_id: true,
  rule_key: true,
  name: true,
  rule_type: true,
  version: true,
  config: true,
  changed_by_user_id: true,
  change_reason: true,
  is_active: true,
  effective_from: true,
  effective_to: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.PaymentRuleVersionSelect;

type PaymentRuleRecord = Prisma.PaymentRuleVersionGetPayload<{
  select: typeof paymentRuleSelect;
}>;

@Injectable()
export class PaymentRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentRulesService.name);
  }

  async createPaymentRule(
    companyId: string,
    changedByUserId: string,
    dto: CreatePaymentRuleDto,
  ): Promise<PaymentRuleResponseDto> {
    validateEffectiveWindow(dto.effectiveFrom, dto.effectiveTo);

    return await this.prisma.runWithTenant(companyId, async () => {
      const rule = await this.prisma.paymentRuleVersion.create({
        data: {
          company_id: companyId,
          rule_key: randomUUID(),
          name: dto.name,
          rule_type: dto.ruleType,
          version: 1,
          config: buildPaymentRuleConfig(dto.ruleType, dto.value, dto.conditions),
          changed_by_user_id: changedByUserId,
          change_reason: dto.changeReason ?? null,
          is_active: dto.isActive ?? true,
          effective_from: dto.effectiveFrom ?? null,
          effective_to: dto.effectiveTo ?? null,
        },
        select: paymentRuleSelect,
      });

      this.logger.info(
        {
          paymentRuleId: rule.id,
          companyId,
          ruleKey: rule.rule_key,
          ruleType: rule.rule_type,
        },
        'Payment rule created',
      );

      return mapPaymentRule(rule);
    });
  }

  async listPaymentRules(
    companyId: string,
    query: ListPaymentRulesQueryDto,
  ): Promise<PaymentRuleResponseDto[]> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const where: Prisma.PaymentRuleVersionWhereInput = {};

      if (query.ruleType) {
        where.rule_type = query.ruleType;
      }

      if (query.ruleKey) {
        where.rule_key = query.ruleKey;
      }

      if (query.name) {
        where.name = {
          contains: query.name,
          mode: 'insensitive',
        };
      }

      const rules = await this.prisma.paymentRuleVersion.findMany({
        where,
        orderBy: [
          { rule_key: 'asc' },
          { version: 'desc' },
          { created_at: 'desc' },
        ],
        select: paymentRuleSelect,
      });

      const currentRules = query.includeHistory ? rules : latestRulesOnly(rules);
      const now = new Date();
      const filteredRules = query.includeInactive
        ? currentRules
        : currentRules.filter(
            (rule) =>
              rule.is_active &&
              isRuleEffectiveNow(rule.effective_from, rule.effective_to, now),
          );

      return filteredRules.map(mapPaymentRule);
    });
  }

  async updatePaymentRule(
    companyId: string,
    changedByUserId: string,
    ruleVersionId: string,
    dto: UpdatePaymentRuleDto,
  ): Promise<PaymentRuleResponseDto> {
    validateEffectiveWindow(dto.effectiveFrom, dto.effectiveTo);

    return await this.prisma.runWithTenant(companyId, async () => {
      const currentRule = await this.prisma.paymentRuleVersion.findFirst({
        where: { id: ruleVersionId },
        select: paymentRuleSelect,
      });

      if (!currentRule) {
        throw new NotFoundException('Payment rule not found');
      }

      const latestRule = await this.prisma.paymentRuleVersion.findFirst({
        where: {
          rule_key: currentRule.rule_key,
        },
        orderBy: { version: 'desc' },
        select: paymentRuleSelect,
      });

      if (!latestRule || latestRule.id !== currentRule.id) {
        throw new BadRequestException(
          'Only the latest payment rule version can be updated',
        );
      }

      if (!hasAnyUpdates(dto)) {
        throw new BadRequestException(
          'At least one payment rule field must be provided for versioning',
        );
      }

      const currentConfig = parsePaymentRuleConfig(currentRule.config);
      const nextRuleType = dto.ruleType ?? currentRule.rule_type;
      const nextValue = dto.value ?? currentConfig.value;
      const nextConditions =
        dto.conditions !== undefined ? dto.conditions : currentConfig.conditions;

      const nextRule = await this.prisma.paymentRuleVersion.create({
        data: {
          company_id: companyId,
          rule_key: currentRule.rule_key,
          name: dto.name ?? currentRule.name,
          rule_type: nextRuleType,
          version: currentRule.version + 1,
          config: buildPaymentRuleConfig(nextRuleType, nextValue, nextConditions),
          changed_by_user_id: changedByUserId,
          change_reason:
            dto.changeReason !== undefined
              ? dto.changeReason
              : currentRule.change_reason,
          is_active:
            dto.isActive !== undefined ? dto.isActive : currentRule.is_active,
          effective_from:
            dto.effectiveFrom !== undefined
              ? dto.effectiveFrom
              : currentRule.effective_from,
          effective_to:
            dto.effectiveTo !== undefined
              ? dto.effectiveTo
              : currentRule.effective_to,
        },
        select: paymentRuleSelect,
      });

      this.logger.info(
        {
          previousPaymentRuleId: currentRule.id,
          paymentRuleId: nextRule.id,
          companyId,
          ruleKey: nextRule.rule_key,
          version: nextRule.version,
        },
        'Payment rule version created',
      );

      return mapPaymentRule(nextRule);
    });
  }
}

function mapPaymentRule(rule: PaymentRuleRecord): PaymentRuleResponseDto {
  const config = parsePaymentRuleConfig(rule.config);

  return {
    id: rule.id,
    companyId: rule.company_id,
    ruleKey: rule.rule_key,
    name: rule.name,
    ruleType: rule.rule_type,
    version: rule.version,
    value: config.value,
    conditions: config.conditions,
    isActive: rule.is_active,
    effectiveFrom: rule.effective_from,
    effectiveTo: rule.effective_to,
    changedByUserId: rule.changed_by_user_id,
    changeReason: rule.change_reason,
    createdAt: rule.created_at,
    updatedAt: rule.updated_at,
  };
}

function latestRulesOnly(rules: PaymentRuleRecord[]): PaymentRuleRecord[] {
  const latestByRuleKey = new Map<string, PaymentRuleRecord>();

  for (const rule of rules) {
    const existing = latestByRuleKey.get(rule.rule_key);

    if (!existing || rule.version > existing.version) {
      latestByRuleKey.set(rule.rule_key, rule);
    }
  }

  return [...latestByRuleKey.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function hasAnyUpdates(dto: UpdatePaymentRuleDto): boolean {
  return (
    dto.name !== undefined ||
    dto.ruleType !== undefined ||
    dto.value !== undefined ||
    dto.conditions !== undefined ||
    dto.isActive !== undefined ||
    dto.changeReason !== undefined ||
    dto.effectiveFrom !== undefined ||
    dto.effectiveTo !== undefined
  );
}
